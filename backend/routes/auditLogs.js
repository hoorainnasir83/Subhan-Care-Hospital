const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const { isDbConnected } = require('../config/db');
const logger = require('../config/logger');

// @route   GET /api/audit-logs
// @desc    Get all audit logs (Admin only)
// @access  Private (Admin)
router.get('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, resource, userId } = req.query;
    let logs = [];
    let total = 0;

    if (isDbConnected()) {
      const filter = {};
      if (action) filter.action = action;
      if (resource) filter.resource = resource;
      if (userId) filter.userId = userId;

      total = await AuditLog.countDocuments(filter);
      logs = await AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    } else {
      global.memoryStore.auditLogs = global.memoryStore.auditLogs || [];
      let filtered = [...global.memoryStore.auditLogs];
      if (action) filtered = filtered.filter(l => l.action === action);
      if (resource) filtered = filtered.filter(l => l.resource === resource);
      if (userId) filtered = filtered.filter(l => l.userId === userId);
      
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      total = filtered.length;
      logs = filtered.slice((page - 1) * limit, page * limit);
    }

    res.json({
      success: true,
      data: logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    logger.error('Failed to get audit logs', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
