const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true,
    default: undefined
  },
  description: {
    type: String,
    required: [true, 'Please provide product description']
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: 0
  },
  comparePrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'BDT', 'INR', 'JPY', 'CNY', 'AUD', 'CAD']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: String
  },
  tags: [{
    type: String
  }],
  images: [{
    url: String,
    alt: String,
    color: String
  }],
  variants: [{
    name: String, // e.g., "Size", "Color"
    options: [String] // e.g., ["S", "M", "L"] or ["Red", "Blue"]
  }],
  inventory: {
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    sku: {
      type: String,
      unique: true,
      sparse: true
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackInventory: {
      type: Boolean,
      default: true
    }
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  sales: {
    type: Number,
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const makeSlug = (val) => {
  const s = String(val || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return s;
};

productSchema.pre('save', async function(next) {
  const provided = this.slug && String(this.slug).trim();
  if (!provided || this.isModified('name')) {
    const base = provided || this.name;
    let s = makeSlug(base);
    
    if (s) {
      // Check if slug exists and append random suffix if needed
      const existingProduct = await mongoose.model('Product').findOne({ 
        slug: s, 
        _id: { $ne: this._id } 
      });
      
      if (existingProduct) {
        // Append random suffix to make it unique
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        s = `${s}-${randomSuffix}`;
      }
    }
    
    this.slug = s || undefined;
  }
  next();
});

productSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() || {};
  const hasTopLevel = Object.prototype.hasOwnProperty.call(update, 'name') || Object.prototype.hasOwnProperty.call(update, 'slug');
  const $set = update.$set || {};
  const $unset = update.$unset || {};
  if (hasTopLevel || $set.name !== undefined || $set.slug !== undefined) {
    const rawSlug = $set.slug !== undefined ? $set.slug : (update.slug !== undefined ? update.slug : undefined);
    const rawName = $set.name !== undefined ? $set.name : (update.name !== undefined ? update.name : undefined);
    const slugProvidedButEmpty = (rawSlug === '' || rawSlug === null);
    const base = (rawSlug && String(rawSlug).trim()) || rawName;
    if (slugProvidedButEmpty) {
      // Explicitly unset slug when null/empty provided
      $unset.slug = '';
      if ($set.slug !== undefined) delete $set.slug;
      if (update.slug !== undefined) delete update.slug;
    } else if (base !== undefined) {
      let s = makeSlug(base);
      if (s) {
        // Check if slug exists and append random suffix if needed
        const currentDocId = this.getQuery()._id;
        const existingProduct = await mongoose.model('Product').findOne({ 
          slug: s, 
          _id: { $ne: currentDocId } 
        });
        
        if (existingProduct) {
          // Append random suffix to make it unique
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          s = `${s}-${randomSuffix}`;
        }
        
        $set.slug = s;
        if (update.slug !== undefined) delete update.slug;
      } else {
        $unset.slug = '';
        if ($set.slug !== undefined) delete $set.slug;
        if (update.slug !== undefined) delete update.slug;
      }
    }
  }
  if (Object.keys($set).length) update.$set = $set; else delete update.$set;
  if (Object.keys($unset).length) update.$unset = $unset; else delete update.$unset;
  this.setUpdate(update);
  next();
});

productSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $exists: true, $nin: ['', null] } }, name: 'unique_slug_nonempty' }
);

// Check if stock is low
productSchema.virtual('isLowStock').get(function() {
  return this.inventory.stock <= this.inventory.lowStockThreshold;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
