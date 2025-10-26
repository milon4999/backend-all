const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/orders
// @desc    Get all orders (admin) or user's orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const { page = 1, limit = 10, status } = req.query;

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name images price currency')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images price currency');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, payment, coupon } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    // Calculate pricing
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }

      // Check stock
      if (product.inventory.trackInventory && product.inventory.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      subtotal += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0]?.url || '',
        price: product.price,
        currency: product.currency,
        quantity: item.quantity,
        variant: item.variant || ''
      });

      // Update sales and stock
      product.sales = (product.sales || 0) + item.quantity;
      if (product.inventory.trackInventory) {
        product.inventory.stock -= item.quantity;
      }
      await product.save();
    }

    const shipping = req.body.pricing?.shipping || 0;
    const tax = req.body.pricing?.tax || 0;
    const discount = req.body.pricing?.discount || 0;
    const total = subtotal + shipping + tax - discount;

    // Find applicable coupon (optional)
    let appliedCouponDoc = null;
    if (req.body.coupon?.code) {
      const code = String(req.body.coupon.code).trim().toUpperCase();
      const c = await Coupon.findOne({ code });
      if (c && c.isValid() && subtotal >= (c.minPurchase || 0)) {
        appliedCouponDoc = c;
      }
    }

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      payment,
      pricing: { subtotal, shipping, tax, discount, total },
      coupon,
      currency: orderItems[0]?.currency || 'USD'
    });

    // Increment coupon usage if applicable
    if (appliedCouponDoc) {
      try {
        appliedCouponDoc.usedCount = (appliedCouponDoc.usedCount || 0) + 1;
        await appliedCouponDoc.save();
      } catch (e) {
        // Do not fail order if coupon update fails
        console.warn('Coupon usage update failed:', e?.message || e);
      }
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id).populate('items.product', 'inventory.trackInventory inventory.stock sales');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const prevStatus = order.status;
    const newStatus = status;

    if (prevStatus === newStatus) {
      return res.json({ success: true, order });
    }

    // If transitioning to cancelled, revert sales and restock
    if (prevStatus !== 'cancelled' && newStatus === 'cancelled') {
      for (const it of order.items) {
        const p = await Product.findById(it.product._id || it.product);
        if (!p) continue;
        p.sales = Math.max(0, (p.sales || 0) - it.quantity);
        if (p.inventory?.trackInventory) {
          p.inventory.stock = (p.inventory.stock || 0) + it.quantity;
        }
        await p.save();
      }
      order.cancelledAt = Date.now();
    }

    // If transitioning from cancelled to any other status, re-apply sales and unstock
    if (prevStatus === 'cancelled' && newStatus !== 'cancelled') {
      for (const it of order.items) {
        const p = await Product.findById(it.product._id || it.product);
        if (!p) continue;
        if (p.inventory?.trackInventory && (p.inventory.stock || 0) < it.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock to reinstate item ${p.name}` });
        }
        p.sales = (p.sales || 0) + it.quantity;
        if (p.inventory?.trackInventory) {
          p.inventory.stock = (p.inventory.stock || 0) - it.quantity;
        }
        await p.save();
      }
      order.cancelledAt = undefined;
    }

    order.status = newStatus;
    order.statusHistory.push({ status: newStatus, note });
    if (newStatus === 'delivered') {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User cancels own order
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'inventory.trackInventory inventory.stock sales');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (order.status === 'cancelled') {
      return res.json({ success: true, order });
    }

    for (const it of order.items) {
      const p = await Product.findById(it.product._id || it.product);
      if (!p) continue;
      p.sales = Math.max(0, (p.sales || 0) - it.quantity);
      if (p.inventory?.trackInventory) {
        p.inventory.stock = (p.inventory.stock || 0) + it.quantity;
      }
      await p.save();
    }

    order.status = 'cancelled';
    order.cancelledAt = Date.now();
    order.statusHistory.push({ status: 'cancelled', note: req.body?.note });
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/orders/:id/tracking
// @desc    Update order tracking
// @access  Private/Admin
router.put('/:id/tracking', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { tracking: req.body },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
