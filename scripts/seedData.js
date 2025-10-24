const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
require('dotenv').config();

// Sample categories
const categories = [
  {
    name: 'Men\'s Fashion',
    slug: 'mens-fashion',
    description: 'Stylish clothing and accessories for men',
    order: 1
  },
  {
    name: 'Women\'s Fashion',
    slug: 'womens-fashion',
    description: 'Trendy clothing and accessories for women',
    order: 2
  },
  {
    name: 'Shoes',
    slug: 'shoes',
    description: 'Footwear for all occasions',
    order: 3
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Fashion accessories and jewelry',
    order: 4
  },
  {
    name: 'Bags',
    slug: 'bags',
    description: 'Handbags, backpacks, and travel bags',
    order: 5
  }
];

// Sample products (will be created after categories)
const getProducts = (categoryIds) => [
  {
    name: 'Classic White T-Shirt',
    slug: 'classic-white-t-shirt',
    description: 'Premium cotton t-shirt with comfortable fit. Perfect for casual wear.',
    price: 29.99,
    comparePrice: 39.99,
    category: categoryIds['Men\'s Fashion'],
    tags: ['casual', 'cotton', 'basic'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        alt: 'White t-shirt front view'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['S', 'M', 'L', 'XL']
      }
    ],
    inventory: {
      stock: 50,
      sku: 'TS-WHITE-001'
    },
    featured: true
  },
  {
    name: 'Elegant Black Dress',
    slug: 'elegant-black-dress',
    description: 'Sophisticated black dress perfect for evening events and formal occasions.',
    price: 89.99,
    comparePrice: 120.00,
    category: categoryIds['Women\'s Fashion'],
    tags: ['formal', 'elegant', 'evening'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
        alt: 'Black dress'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['XS', 'S', 'M', 'L']
      }
    ],
    inventory: {
      stock: 25,
      sku: 'DR-BLACK-001'
    },
    featured: true
  },
  {
    name: 'Running Sneakers',
    slug: 'running-sneakers',
    description: 'Comfortable running shoes with excellent cushioning and support.',
    price: 79.99,
    comparePrice: 99.99,
    category: categoryIds['Shoes'],
    tags: ['sports', 'running', 'comfortable'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        alt: 'Running sneakers'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['7', '8', '9', '10', '11', '12']
      },
      {
        name: 'Color',
        options: ['Black', 'White', 'Blue']
      }
    ],
    inventory: {
      stock: 40,
      sku: 'SH-RUN-001'
    },
    featured: true
  },
  {
    name: 'Leather Wallet',
    slug: 'leather-wallet',
    description: 'Genuine leather wallet with multiple card slots and bill compartment.',
    price: 45.99,
    category: categoryIds['Accessories'],
    tags: ['leather', 'wallet', 'accessories'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
        alt: 'Leather wallet'
      }
    ],
    inventory: {
      stock: 30,
      sku: 'AC-WALLET-001'
    },
    featured: false
  },
  {
    name: 'Canvas Backpack',
    slug: 'canvas-backpack',
    description: 'Durable canvas backpack perfect for daily use, school, or travel.',
    price: 59.99,
    category: categoryIds['Bags'],
    tags: ['backpack', 'canvas', 'travel'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
        alt: 'Canvas backpack'
      }
    ],
    variants: [
      {
        name: 'Color',
        options: ['Navy', 'Black', 'Khaki']
      }
    ],
    inventory: {
      stock: 20,
      sku: 'BG-CANVAS-001'
    },
    featured: true
  },
  {
    name: 'Denim Jeans',
    slug: 'denim-jeans',
    description: 'Classic blue denim jeans with perfect fit and premium quality.',
    price: 69.99,
    comparePrice: 89.99,
    category: categoryIds['Men\'s Fashion'],
    tags: ['denim', 'jeans', 'casual'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        alt: 'Denim jeans'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['28', '30', '32', '34', '36', '38']
      }
    ],
    inventory: {
      stock: 35,
      sku: 'JN-DENIM-001'
    },
    featured: false
  },
  {
    name: 'Summer Floral Dress',
    slug: 'summer-floral-dress',
    description: 'Light and breezy floral dress perfect for summer days.',
    price: 54.99,
    category: categoryIds['Women\'s Fashion'],
    tags: ['summer', 'floral', 'casual'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500',
        alt: 'Floral summer dress'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['XS', 'S', 'M', 'L', 'XL']
      }
    ],
    inventory: {
      stock: 28,
      sku: 'DR-FLORAL-001'
    },
    featured: true
  },
  {
    name: 'Casual Loafers',
    slug: 'casual-loafers',
    description: 'Comfortable leather loafers for casual and semi-formal occasions.',
    price: 95.99,
    category: categoryIds['Shoes'],
    tags: ['loafers', 'leather', 'casual'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500',
        alt: 'Leather loafers'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['7', '8', '9', '10', '11', '12']
      },
      {
        name: 'Color',
        options: ['Brown', 'Black']
      }
    ],
    inventory: {
      stock: 22,
      sku: 'SH-LOAF-001'
    },
    featured: false
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create category ID mapping
    const categoryIds = {};
    createdCategories.forEach(cat => {
      categoryIds[cat.name] = cat._id;
    });

    // Create products
    const products = getProducts(categoryIds);
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    console.log('🎉 Database seeded successfully!');
    console.log('\nCreated Categories:');
    createdCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug})`);
    });

    console.log('\nCreated Products:');
    createdProducts.forEach(product => {
      console.log(`- ${product.name} - $${product.price}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seed function
seedDatabase();
