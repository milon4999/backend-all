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
      payments: {
        stripeEnabled: settings.payments?.stripeEnabled || false,
        codEnabled: settings.payments?.codEnabled || false,
        paypalEnabled: settings.payments?.paypalEnabled || false,
        bankEnabled: settings.payments?.bankEnabled || false,
        localEnabled: settings.payments?.localEnabled || false,
        socialEnabled: settings.payments?.socialEnabled || false,
        stripePublicKey: settings.payments?.stripePublicKey || ''
      },
      tax: {
        enabled: settings.tax?.enabled ?? true,
        rate: settings.tax?.rate ?? 10
      },
      shipping: {
        methods: settings.shipping?.methods || {
          standard: { enabled: true, name: 'Standard', price: 10, freeAbove: 50 },
          express: { enabled: true, name: 'Express', price: 20, freeAbove: 0 }
        }
      },
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
