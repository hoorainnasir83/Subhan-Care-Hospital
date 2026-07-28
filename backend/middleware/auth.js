const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../config/logger');

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
        logger.warn('Authentication failed - User not found', {
          userId: decoded.id,
          userEmail: decoded.email
        });
        return res.status(401).json({ success: false, error: 'User account not found' });
      }

      logger.debug('User authenticated', {
        userId: req.user._id || req.user.id,
        email: req.user.email,
        role: req.user.role
      });

      next();
    } catch (error) {
      logger.warn('JWT Verification failed', {
        error: error.message,
        statusCode: 401
      });
      console.error('JWT Verification error:', error.message);
      return res.status(401).json({ success: false, error: 'Not authorized, session expired or invalid' });
    }
  }

  if (!token) {
    logger.warn('Authentication attempted without token', {
      url: req.url,
      method: req.method
    });
    return res.status(401).json({ success: false, error: 'Not authorized, login session token is missing' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const userRole = req.user ? req.user.role : 'Guest';
      logger.warn('Authorization failed - Insufficient permissions', {
        userId: req.user ? req.user._id || req.user.id : null,
        userEmail: req.user ? req.user.email : null,
        userRole: userRole,
        requiredRoles: roles,
        url: req.url,
        method: req.method
      });
      return res.status(403).json({
        success: false,
        error: `User role '${userRole}' is restricted from accessing this endpoint`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
