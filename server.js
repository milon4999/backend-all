const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  // Set timeout for all requests (30 seconds)
  req.setTimeout(30000, () => {
    const err = new Error('Request Timeout');
    err.status = 408;
    next(err);
  });
  
  res.setTimeout(30000, () => {
    const err = new Error('Response Timeout');
    err.status = 408;
    next(err);
  });
  
  next();
});

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 1000, // More requests in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Configure Mongoose settings
mongoose.set('bufferCommands', false); // Disable mongoose buffering

// Database connection with timeout settings
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Maintain a minimum of 5 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
})
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Database health check middleware
const dbHealthCheck = require('./middleware/dbHealth');

// Routes with database health check
app.use('/api/auth', dbHealthCheck, require('./routes/auth'));
app.use('/api/users', dbHealthCheck, require('./routes/users'));
app.use('/api/products', dbHealthCheck, require('./routes/products'));
app.use('/api/categories', dbHealthCheck, require('./routes/categories'));
app.use('/api/orders', dbHealthCheck, require('./routes/orders'));
app.use('/api/cart', dbHealthCheck, require('./routes/cart'));
app.use('/api/wishlist', dbHealthCheck, require('./routes/wishlist'));
app.use('/api/reviews', dbHealthCheck, require('./routes/reviews'));
app.use('/api/coupons', dbHealthCheck, require('./routes/coupons'));
app.use('/api/payments', dbHealthCheck, require('./routes/payments'));
app.use('/api/analytics', dbHealthCheck, require('./routes/analytics'));
app.use('/api/banners', dbHealthCheck, require('./routes/banners'));
app.use('/api/upload', require('./routes/upload')); // Upload doesn't need DB check

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});