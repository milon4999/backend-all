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
    },
    freeShippingThreshold: {
      type: Number,
      default: 50
    },
    standardDelivery: {
      type: String,
      default: '3-5 business days'
    },
    expressDelivery: {
      type: String,
      default: '1-2 business days (additional charges apply)'
    },
    internationalShipping: {
      type: Boolean,
      default: true
    },
    shippingNotes: String
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
  let s = String(val || '').toLowerCase();
  
  // Transliteration map for common non-English characters
  const translitMap = {
    'প্রি': 'pri',
    'সিল': 'sil',
    'পার্সেল': 'parcel',
    'কালারা': 'kalara',
    'শার্ট': 'shirt',
    'টি': 'ti',
    'পোশাক': 'poshak',
    'জামা': 'jama',
    'কাপড়': 'kapor'
  };
  
  // Try to transliterate common words
  Object.keys(translitMap).forEach(key => {
    s = s.replace(new RegExp(key, 'g'), translitMap[key]);
  });
  
  // Remove remaining non-alphanumeric characters and replace with hyphens
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // If slug is too short or empty, use a timestamp-based slug
  if (!s || s.length < 3) {
    s = 'product-' + Date.now().toString(36);
  }
  
  return s;
};

productSchema.pre('save', async function(next) {
  // Generate/update slug if it's a new document, name has changed, or slug is modified
  if (this.isNew || this.isModified('name') || this.isModified('slug')) {
    // Use provided slug or generate from name
    const base = this.slug || this.name;
    let s = makeSlug(base);
    
    if (s) {
      // Check if slug exists and append incremental number if needed
      const existingProduct = await mongoose.model('Product').findOne({ 
        slug: s, 
        _id: { $ne: this._id } 
      });
      
      if (existingProduct) {
        // Find all products with similar slugs to get the next number
        const similarProducts = await mongoose.model('Product').find({
          slug: new RegExp(`^${s}(-\\d+)?$`),
          _id: { $ne: this._id }
        }).select('slug');
        
        // Extract numbers from existing slugs
        const numbers = similarProducts
          .map(p => {
            const match = p.slug.match(new RegExp(`^${s}-(\\d+)$`));
            return match ? parseInt(match[1]) : 0;
          })
          .filter(n => n > 0);
        
        // Get the next number
        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 2;
        s = `${s}-${nextNumber}`;
      }
    }
    
    this.slug = s || undefined;
  }
  next();
});

productSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() || {};
  const $set = update.$set || {};
  const $unset = update.$unset || {};
  
  // Regenerate slug if name or slug is being updated
  const nameIsBeingUpdated = $set.name !== undefined || update.name !== undefined;
  const slugIsBeingUpdated = $set.slug !== undefined || update.slug !== undefined;
  
  if (nameIsBeingUpdated || slugIsBeingUpdated) {
    // Use provided slug or generate from name
    const providedSlug = $set.slug !== undefined ? $set.slug : update.slug;
    const newName = $set.name !== undefined ? $set.name : update.name;
    const base = providedSlug || newName;
    let s = makeSlug(base);
    
    if (s) {
      // Check if slug exists and append incremental number if needed
      const currentDocId = this.getQuery()._id;
      const existingProduct = await mongoose.model('Product').findOne({ 
        slug: s, 
        _id: { $ne: currentDocId } 
      });
      
      if (existingProduct) {
        // Find all products with similar slugs to get the next number
        const similarProducts = await mongoose.model('Product').find({
          slug: new RegExp(`^${s}(-\\d+)?$`),
          _id: { $ne: currentDocId }
        }).select('slug');
        
        // Extract numbers from existing slugs
        const numbers = similarProducts
          .map(p => {
            const match = p.slug.match(new RegExp(`^${s}-(\\d+)$`));
            return match ? parseInt(match[1]) : 0;
          })
          .filter(n => n > 0);
        
        // Get the next number
        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 2;
        s = `${s}-${nextNumber}`;
      }
      
      $set.slug = s;
      if (update.slug !== undefined) delete update.slug;
    } else {
      $unset.slug = '';
      if ($set.slug !== undefined) delete $set.slug;
      if (update.slug !== undefined) delete update.slug;
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
