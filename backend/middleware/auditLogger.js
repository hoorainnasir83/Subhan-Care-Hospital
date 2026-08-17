const AuditLog = require('../models/AuditLog');
const { isDbConnected } = require('../config/db');
const logger = require('../config/logger');

const METHOD_ACTION_MAP = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
  GET: 'VIEW'
};

const auditLogger = (resource) => {
  return async (req, res, next) => {
    // Only audit mutating operations (POST, PUT, DELETE)
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Store original res.json to intercept after response
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Only log successful operations
      if (body && body.success !== false) {
        const logEntry = {
          userId: req.user?.id || 'unknown',
          userName: req.user?.name || 'Unknown User',
          userRole: req.user?.role || 'Unknown',
          action: METHOD_ACTION_MAP[req.method] || 'VIEW',
          resource: resource,
          resourceId: req.params.id || body?.data?.id || body?.data?.recordId || null,
          details: `${METHOD_ACTION_MAP[req.method]} ${resource} - ${req.originalUrl}`,
          ipAddress: req.ip || req.connection?.remoteAddress || '',
          createdAt: new Date()
        };

        // Fire and forget - don't block the response
        if (isDbConnected()) {
          AuditLog.create(logEntry).catch(err => {
            logger.error('Audit log save failed (MongoDB)', { error: err.message });
          });
        } else {
          global.memoryStore.auditLogs = global.memoryStore.auditLogs || [];
          logEntry._id = 'audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
          global.memoryStore.auditLogs.push(logEntry);
        }
      }

      return originalJson(body);
    };

    next();
  };
};

module.exports = auditLogger;
