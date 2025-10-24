const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Cart is stored in frontend (localStorage/Redux)
// These routes help with cart operations

// @route   POST /api/cart/validate
// @desc    Validate cart items (check stock, prices)
// @access  Public
router.post('/validate', async (req, res) => {
  try {
    const { items } = req.body;
    const validatedItems = [];
    const errors = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        errors.push({ productId: item.productId, message: 'Product not found' });
        continue;
      }

      if (!product.isActive) {
        errors.push({ productId: item.productId, message: 'Product is no longer available' });
        continue;
      }

      if (product.inventory.trackInventory && product.inventory.stock < item.quantity) {
        errors.push({
          productId: item.productId,
          message: `Only ${product.inventory.stock} items available`,
          availableStock: product.inventory.stock
        });
        continue;
      }

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || '',
        quantity: item.quantity,
        variant: item.variant,
        inStock: product.inventory.stock >= item.quantity
      });
    }

    res.json({
      success: true,
      validatedItems,
      errors,
      hasErrors: errors.length > 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
