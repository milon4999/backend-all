const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/banners
// @desc    Get all active banners (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    
    // Get all active banners within date range, sorted by order
    const banners = await Banner.find({
      isActive: true,
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: null, endDate: null }
      ]
    }).sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: banners.length,
      banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching banners',
      error: error.message
    });
  }
});

// @route   GET /api/banners/all
// @desc    Get all banners (admin only)
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: banners.length,
      banners
    });
  } catch (error) {
    console.error('Error fetching all banners:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching banners',
      error: error.message
    });
  }
});

// @route   GET /api/banners/:id
// @desc    Get single banner
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      banner
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching banner',
      error: error.message
    });
  }
});

// @route   POST /api/banners
// @desc    Create new banner
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      image,
      bgColor,
      isActive,
      order,
      startDate,
      endDate
    } = req.body;

    const banner = await Banner.create({
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      image,
      bgColor,
      isActive,
      order,
      startDate,
      endDate
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      banner
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating banner',
      error: error.message
    });
  }
});

// @route   PUT /api/banners/:id
// @desc    Update banner
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      image,
      bgColor,
      isActive,
      order,
      startDate,
      endDate
    } = req.body;

    let banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    banner = await Banner.findByIdAndUpdate(
      req.params.id,
      {
        title,
        subtitle,
        description,
        buttonText,
        buttonLink,
        image,
        bgColor,
        isActive,
        order,
        startDate,
        endDate
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Banner updated successfully',
      banner
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating banner',
      error: error.message
    });
  }
});

// @route   DELETE /api/banners/:id
// @desc    Delete banner
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    await banner.deleteOne();

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting banner',
      error: error.message
    });
  }
});

// @route   PATCH /api/banners/:id/toggle
// @desc    Toggle banner active status
// @access  Private/Admin
router.patch('/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      banner
    });
  } catch (error) {
    console.error('Error toggling banner status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling banner status',
      error: error.message
    });
  }
});

module.exports = router;
