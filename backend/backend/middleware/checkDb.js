const mongoose = require('mongoose');

// Middleware to check database connection status before handling API requests
const checkDbConnection = (req, res, next) => {
  // readyState 1 means Connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database Connection Error: MongoDB is not connected. Please start your local MongoDB service (mongod) or configure MONGO_URI in backend/.env to use MongoDB Atlas.'
    });
  }
  next();
};

module.exports = checkDbConnection;
