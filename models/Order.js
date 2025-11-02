const mongoose = require('mongoose');

function generateOrderNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const t = String(now.getTime()).slice(-6);
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `ORD-${yyyy}${mm}${dd}-${t}${rand}`;
}

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    default: generateOrderNumber
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    image: String,
    price: Number,
    currency: { type: String },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    variant: String
  }],
  shippingAddress: {
    name: { type: String, required: true },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: String
  },
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'stripe', 'paypal', 'cod', 'bank', 'local', 'social'],
      required: true
    },
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    shipping: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  coupon: {
    code: String,
    discount: Number
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String
  },
  statusHistory: [{
    status: String,
    note: String,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    customer: String,
    admin: String
  },
  currency: {
    type: String,
    default: 'USD'
  },
  deliveredAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('validate', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
