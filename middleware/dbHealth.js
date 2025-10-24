const mongoose = require('mongoose');

// Database health check middleware
const dbHealthCheck = (req, res, next) => {
  // Check if MongoDB connection is ready
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not available. Please try again later.',
      code: 'DB_CONNECTION_ERROR'
    });
  }
  
  next();
};

module.exports = dbHealthCheck;
