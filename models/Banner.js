const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Subtitle cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  buttonText: {
    type: String,
    default: 'Shop Now',
    trim: true,
    maxlength: [50, 'Button text cannot be more than 50 characters']
  },
  buttonLink: {
    type: String,
    default: '/products',
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Please provide a banner image URL']
  },
  bgColor: {
    type: String,
    default: '',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for sorting
bannerSchema.index({ order: 1, createdAt: -1 });

// Method to check if banner is currently active
bannerSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  const isWithinDateRange = (!this.startDate || this.startDate <= now) && 
                           (!this.endDate || this.endDate >= now);
  return this.isActive && isWithinDateRange;
};

module.exports = mongoose.model('Banner', bannerSchema);
