const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * JWT Protection Middleware
 * Extracts and verifies JWT bearer tokens, populating req.user.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from Bearer header scheme
      token = req.headers.authorization.split(' ')[1];

      if (!token || token === 'null' || token === 'undefined') {
        logger.warn('Authentication attempted with empty Bearer token', {
          url: req.url,
          method: req.method,
          ip: req.ip
        });
        return res.status(401).json({ success: false, error: 'Not authorized, invalid token' });
      }

      // Decode token to retrieve user reference
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'subhancare_default_jwt_secret');

      if (mongoose.connection.readyState === 1) {
        req.user = await User.findById(decoded.id).select('-password');
      } else if (global.memoryStore) {
        // Fallback user resolution when DB is offline
        const memUser = global.memoryStore.users.find(u => u.id === decoded.id || u.email === decoded.email);
        if (memUser) {
          req.user = { 
            _id: memUser.id, 
            id: memUser.id, 
            name: memUser.name, 
            email: memUser.email, 
            role: memUser.role, 
            doctorId: memUser.doctorId,
            patientId: memUser.patientId 
          };
        }
      }
      
      if (!req.user) {
        logger.warn('Authentication failed - User not found in database or memory store', {
          userId: decoded.id,
          userEmail: decoded.email
        });
        return res.status(401).json({ success: false, error: 'User account not found or deactivated' });
      }

      logger.debug('User authenticated successfully', {
        userId: req.user._id || req.user.id,
        email: req.user.email,
        role: req.user.role
      });

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('JWT Token Expired', { url: req.url, expiredAt: error.expiredAt });
        return res.status(401).json({ success: false, error: 'Session expired, please log in again' });
      }

      logger.warn('JWT Verification failed', {
        error: error.message,
        statusCode: 401
      });
      return res.status(401).json({ success: false, error: 'Not authorized, token verification failed' });
    }
  }

  if (!token) {
    logger.warn('Authentication attempted without Bearer token', {
      url: req.url,
      method: req.method,
      ip: req.ip
    });
    return res.status(401).json({ success: false, error: 'Not authorized, missing authentication token' });
  }
};

/**
 * Role-Based Authorization Middleware (RBAC)
 * Restricts route execution to users possessing specific authorized roles.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authorized, please authenticate' });
    }

    if (!roles.includes(req.user.role)) {
      const userRole = req.user.role || 'Guest';
      logger.warn('Authorization failed - Insufficient role permissions', {
        userId: req.user._id || req.user.id,
        userEmail: req.user.email,
        userRole: userRole,
        requiredRoles: roles,
        url: req.url,
        method: req.method,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        error: `Access Denied: Role '${userRole}' does not have permission to perform this action`
      });
    }
    next();
  };
};

/**
 * Owner or Admin Authorization Middleware
 * Ensures user is either an Admin/Staff or owns the target resource (e.g. Patient accessing own record)
 */
const authorizeOwnerOrAdmin = (paramIdKey = 'patientId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const isElevated = ['Admin', 'Staff', 'Doctor', 'Receptionist', 'Billing'].includes(req.user.role);
    const targetId = req.params[paramIdKey] || req.query[paramIdKey] || req.body[paramIdKey];

    if (isElevated || (req.user.role === 'Patient' && req.user.patientId === targetId)) {
      return next();
    }

    logger.warn('Resource ownership check failed', {
      userId: req.user.id,
      role: req.user.role,
      targetId,
      url: req.url
    });

    return res.status(403).json({
      success: false,
      error: 'Access Denied: You do not have permission to access this resource'
    });
  };
};

module.exports = { protect, authorize, authorizeOwnerOrAdmin };
