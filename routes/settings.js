const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, authorize } = require('../middleware/auth');

async function getOrCreateSettings() {
  let settings = await Setting.findOne({});
  if (!settings) {
    settings = await Setting.create({});
  }
  return settings;
}

router.get('/public', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const payload = {
      social: settings.social || { facebookUrl: '', whatsappUrl: '' },
      updatedAt: settings.updatedAt
    };
    res.json({ success: true, settings: payload });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load settings', error: err.message });
  }
});

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load settings', error: err.message });
  }
});

router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const update = { ...req.body, updatedBy: req.user?._id };
    const settings = await Setting.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true
    });
    res.json({ success: true, message: 'Settings updated', settings });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update settings', error: err.message });
  }
});

module.exports = router;
