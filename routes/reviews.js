const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      product: req.params.productId,
      isApproved: true
    })
      .populate('user', 'name avatar')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    const total = await Review.countDocuments({
      product: req.params.productId,
      isApproved: true
    });

    res.json({
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/reviews/product/:productId/eligibility
// @desc    Check if authenticated user can review a product
// @access  Private
router.get('/product/:productId/eligibility', protect, async (req, res) => {
  try {
    const productId = req.params.productId;

    const hasPurchased = await Order.exists({
      user: req.user.id,
      'items.product': productId,
      status: { $in: ['shipped', 'delivered'] }
    });

    if (!hasPurchased) {
      return res.json({
        success: true,
        canReview: false,
        message: 'Only customers who purchased this product can leave a review.'
      });
    }

    const existingReview = await Review.exists({
      product: productId,
      user: req.user.id
    });

    if (existingReview) {
      return res.json({
        success: true,
        canReview: false,
        message: 'You have already reviewed this product.'
      });
    }

    return res.json({ success: true, canReview: true, message: '' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { product, rating, title, comment, images } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    const hasPurchased = await Order.exists({
      user: req.user.id,
      'items.product': product,
      status: { $in: ['shipped', 'delivered'] }
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Only customers who purchased this product can leave a review'
      });
    }

    const review = await Review.create({
      product,
      user: req.user.id,
      rating,
      title,
      comment,
      images,
      verified: true
    });

    // Update product ratings
    const reviews = await Review.find({ product, isApproved: true });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Product.findByIdAndUpdate(product, {
      'ratings.average': avgRating,
      'ratings.count': reviews.length
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.put('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.helpful.users.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this review as helpful'
      });
    }

    review.helpful.users.push(req.user.id);
    review.helpful.count += 1;
    await review.save();

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
