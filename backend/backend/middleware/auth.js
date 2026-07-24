const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Protected route middleware
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from bearer scheme
      token = req.headers.authorization.split(' ')[1];

      // Decode token to retrieve user reference
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (mongoose.connection.readyState === 1) {
        req.user = await User.findById(decoded.id).select('-password');
      } else if (global.memoryStore) {
        // Fallback user resolution when DB is offline
        const memUser = global.memoryStore.users.find(u => u.id === decoded.id || u.email === decoded.email);
        if (memUser) {
          req.user = { _id: memUser.id, name: memUser.name, email: memUser.email, role: memUser.role, doctorId: memUser.doctorId };
        }
      }
      
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'User account not found' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification error:', error.message);
      return res.status(401).json({ success: false, error: 'Not authorized, session expired or invalid' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, login session token is missing' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user ? req.user.role : 'Guest'}' is restricted from accessing this endpoint`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
