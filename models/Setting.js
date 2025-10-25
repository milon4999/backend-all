const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  social: {
    facebookUrl: { type: String, default: '' },
    whatsappUrl: { type: String, default: '' }
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Setting', settingsSchema);
