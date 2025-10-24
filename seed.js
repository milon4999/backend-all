const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log('🗑️  Cleared existing data');

        // Create admin users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@ecommerce.com',
      password: 'admin123',
      role: 'admin'
    });

    const customAdmin = await User.create({
      name: 'Milon Islam',
      email: 'milonislam742002@gmail.com',
      password: '12345678',
      role: 'admin'
    });

    console.log('👤 Admin users created');

    // Create categories
    const electronics = await Category.create({
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
    });

    const clothing = await Category.create({
      name: 'Clothing',
      description: 'Fashion and apparel',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'
    });

    const home = await Category.create({
      name: 'Home & Garden',
      description: 'Home decor and garden supplies',
      image: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400'
    });

        const man = await Category.create({
      name: 'Man',
      description: 'Men\'s fashion and clothing',
      image: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400'
    });

    console.log('📁 Categories created');

    // Create products
    const products = [
      {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
        price: 299.99,
        comparePrice: 399.99,
        category: electronics._id,
        tags: ['audio', 'wireless', 'bluetooth'],
        images: [
          { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', alt: 'Headphones' }
        ],
        inventory: { stock: 50, sku: 'WH-001' },
        featured: true,
        createdBy: admin._id
      },
      {
        name: 'Smart Watch',
        slug: 'smart-watch',
        description: 'Fitness tracking smartwatch with heart rate monitor',
        price: 249.99,
        category: electronics._id,
        tags: ['wearable', 'fitness', 'smartwatch'],
        images: [
          { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', alt: 'Smart Watch' }
        ],
        inventory: { stock: 30, sku: 'SW-001' },
        featured: true,
        createdBy: admin._id
      },
      {
        name: 'Laptop Backpack',
        slug: 'laptop-backpack',
        description: 'Durable laptop backpack with multiple compartments',
        price: 79.99,
        category: electronics._id,
        tags: ['accessories', 'bag', 'laptop'],
        images: [
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', alt: 'Backpack' }
        ],
        inventory: { stock: 100, sku: 'BP-001' },
        createdBy: admin._id
      },
      {
        name: 'Classic T-Shirt',
        slug: 'classic-t-shirt',
        description: 'Comfortable cotton t-shirt in various colors',
        price: 29.99,
        category: clothing._id,
        tags: ['casual', 'cotton', 'tshirt'],
        images: [
          { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', alt: 'T-Shirt' }
        ],
        variants: [
          { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
          { name: 'Color', options: ['Black', 'White', 'Blue', 'Red'] }
        ],
        inventory: { stock: 200, sku: 'TS-001' },
        createdBy: admin._id
      },
      {
        name: 'Denim Jeans',
        slug: 'denim-jeans',
        description: 'Classic fit denim jeans',
        price: 89.99,
        category: clothing._id,
        tags: ['denim', 'pants', 'casual'],
        images: [
          { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', alt: 'Jeans' }
        ],
        variants: [
          { name: 'Size', options: ['28', '30', '32', '34', '36'] },
          { name: 'Color', options: ['Blue', 'Black'] }
        ],
        inventory: { stock: 150, sku: 'DJ-001' },
        createdBy: admin._id
      },
      {
        name: 'Decorative Lamp',
        slug: 'decorative-lamp',
        description: 'Modern LED desk lamp with adjustable brightness',
        price: 49.99,
        category: home._id,
        tags: ['lighting', 'decor', 'led'],
        images: [
          { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600', alt: 'Lamp' }
        ],
        inventory: { stock: 75, sku: 'DL-001' },
        createdBy: admin._id
      },
      {
        name: 'Plant Pot Set',
        slug: 'plant-pot-set',
        description: 'Set of 3 ceramic plant pots',
        price: 34.99,
        category: home._id,
        tags: ['garden', 'plants', 'decor'],
        images: [
          { url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600', alt: 'Plant Pots' }
        ],
        inventory: { stock: 60, sku: 'PP-001' },
        createdBy: admin._id
      },
      {
        name: 'Wireless Mouse',
        slug: 'wireless-mouse',
        description: 'Ergonomic wireless mouse with precision tracking',
        price: 39.99,
        category: electronics._id,
        tags: ['computer', 'accessories', 'wireless'],
        images: [
          { url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600', alt: 'Mouse' }
        ],
        inventory: { stock: 120, sku: 'WM-001' },
        featured: true,
        createdBy: admin._id
      }
            ,
      {
        name: 'Man T-Shirt Style 1',
        slug: 'man-t-shirt-style-1',
        description: 'Premium quality men t-shirt with comfortable fit',
        price: 550,
        comparePrice: 600,
        category: man._id,
        tags: ['men', 'tshirt', 'casual'],
        images: [{ url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjuZIGy0RorGfrxMifd-e1h-RrieRsxzDx-az5ikQnIJhhxIMCLm2ZCfA83s-jq2XL6WXtTH7LOsEDEOv6saoy4nA9KM1cfU-liWK0wLBN8l881fAZ3ciHixLlktG-tRkiKJuLsU2VQn7pf4OAnr7aJrJGw8iXA-hvdnRKpBiCPdW92P78H_SX97raCvqU/s320/WhatsApp%20Image%202025-10-18%20at%2019.25.30_28cd6873.jpg', alt: 'T-Shirt 1' }],
        variants: [{ name: 'Size', options: ['M', 'L', 'X', 'XL'] }],
        inventory: { stock: 100, sku: 'MT-001' },
        featured: true,
        createdBy: admin._id
      },
      {
        name: 'Man T-Shirt Style 2',
        slug: 'man-t-shirt-style-2',
        description: 'Premium quality men t-shirt with comfortable fit',
        price: 550,
        comparePrice: 600,
        category: man._id,
        tags: ['men', 'tshirt', 'casual'],
        images: [{ url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEivDEnGH0XMxbjaT_Q4PkZnmpvsRm9CzBNNCNCPpxV2NQtOF5MSe8iNMqjtidAHYR2QtmdyPOIaknlSBOQUeMSH4ASpaTGVmYRXcpJRXi8yDcIfB8KxjfCK1zvubPL_INvzDCaJDq_wSkakCh-6yJQOAViNlWm_JiYEEHQEv96ncHNJhS7sIniAm6mcZ04/s320/WhatsApp%20Image%202025-10-18%20at%2019.25.30_6a2a7389.jpg', alt: 'T-Shirt 2' }],
        variants: [{ name: 'Size', options: ['M', 'L', 'X', 'XL'] }],
        inventory: { stock: 100, sku: 'MT-002' },
        featured: true,
        createdBy: admin._id
      },
      {
        name: 'Man T-Shirt Style 3',
        slug: 'man-t-shirt-style-3',
        description: 'Premium quality men t-shirt with comfortable fit',
        price: 550,
        comparePrice: 600,
        category: man._id,
        tags: ['men', 'tshirt', 'casual'],
        images: [{ url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjpC1T-5hVVJ7qNC2ws2vrK5VlLMfTf8XujRDPwoLGth6dhJmL47kdZ-DthBwAUoqNxxvXt8dUAuSxUyEna4FOhPSRbqBTG5jWoAKjC1us4Ni3Oulyc7DpFsCrr24-G-KPqpORQAKT_SxK7JWJtcWgRlGjMFbQmr4dwsqn9NU39fVFIEoqUJxfRrx359_g/s320/WhatsApp%20Image%202025-10-18%20at%2019.25.30_669ef56e.jpg', alt: 'T-Shirt 3' }],
        variants: [{ name: 'Size', options: ['M', 'L', 'X', 'XL'] }],
        inventory: { stock: 100, sku: 'MT-003' },
        createdBy: admin._id
      },
      {
        name: 'Man T-Shirt Style 4',
        slug: 'man-t-shirt-style-4',
        description: 'Premium quality men t-shirt with comfortable fit',
        price: 550,
        comparePrice: 600,
        category: man._id,
        tags: ['men', 'tshirt', 'casual'],
        images: [{ url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEivxmGR9L6H25CwmIvzzwcm29FH_i1j6Wn0wmsHwN-RPMssjcU2OmjWkK4aXKq899PxVvvvIONUs4n8agerHgYcOHC68GQ50mcXioUnL4peqvJrA85wn_FgMWJkVAQ4jmR13hPVs5LoB13pLv6e2aNR0yOD5sT8fFS5iouHQdZ2GrSnkKXcc5FTH6eN7bE/s320/WhatsApp%20Image%202025-10-18%20at%2019.25.12_46634590.jpg', alt: 'T-Shirt 4' }],
        variants: [{ name: 'Size', options: ['M', 'L', 'X', 'XL'] }],
        inventory: { stock: 100, sku: 'MT-004' },
        createdBy: admin._id
      },
      {
        name: 'Man T-Shirt Style 5',
        slug: 'man-t-shirt-style-5',
        description: 'Premium quality men t-shirt with comfortable fit',
        price: 550,
        comparePrice: 600,
        category: man._id,
        tags: ['men', 'tshirt', 'casual'],
        images: [{ url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEizXwPZ8eHbVIKtktoDI8tblYESDGo2P9qK-CYHMf0jCFWihIFKMBqse4qaYinlIo5B0vsvmHGcZVQN4Kbp6mndYHB1C11wt6HlZlN3DcawHBtA24pYtjl5BgEqVxjjMGyMgXhFN03TVr2tzFUQYH-HRUSDddzN-hzSZji-1hnBlS9KGSImHrE3Fzbrlcc/s320/WhatsApp%20Image%202025-10-18%20at%2019.24.45_ec01f4dc.jpg', alt: 'T-Shirt 5' }],
        variants: [{ name: 'Size', options: ['M', 'L', 'X', 'XL'] }],
        inventory: { stock: 100, sku: 'MT-005' },
        createdBy: admin._id
      },
      {
        name: 'Man T-Shirt Style 6',
        slug: 'man-t-shirt-style-6',
        description: 'Premium quality men t-shirt with comfortable fit',
        price: 550,
        comparePrice: 600,
        category: man._id,
        tags: ['men', 'tshirt', 'casual'],
        images: [{ url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhf4j19R_rz1Gjzs0S7NjZqPHuMsRKM3nLAuYlghBk2l_o4M2zOv2H5P0Avt8-BvYIIdyAJL5IZh1bubo1jYbCtr98XBEpEGvEFVQQH1FHPSKNFCPx8N-TctmQvtkapJ4oXbcKpp8SwLp_1IAcRs9MdBNz_OfBn4ad0Qe0FRzVJPW2w50zmJIIw-LqaeAg/s320/WhatsApp%20Image%202025-10-18%20at%2019.24.45_27e34f0c.jpg', alt: 'T-Shirt 6' }],
        variants: [{ name: 'Size', options: ['M', 'L', 'X', 'XL'] }],
        inventory: { stock: 100, sku: 'MT-006' },
        createdBy: admin._id
      }
    ];

    await Product.insertMany(products);
    console.log('📦 Products created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Admin Login Credentials:');
    console.log('\n1. Default Admin:');
    console.log('   Email: admin@ecommerce.com');
    console.log('   Password: admin123');
    console.log('\n2. Custom Admin:');
    console.log('   Email: milonislam742002@gmail.com');
    console.log('   Password: 12345678');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
