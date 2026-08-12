const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Staff = require('../models/Staff');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../config/logger');

// Helper functions for memory store fallbacks
const getMemStaff = () => {
  if (!global.memoryStore) global.memoryStore = {};
  if (!global.memoryStore.staff) global.memoryStore.staff = [];
  return global.memoryStore.staff;
};

const getMemUsers = () => {
  if (!global.memoryStore) global.memoryStore = {};
  if (!global.memoryStore.users) global.memoryStore.users = [];
  return global.memoryStore.users;
};

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: List all staff members
 *     description: Retrieve a paginated and searchable list of all staff members. Requires Admin role.
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for filtering staff by name, email, phone, role, department, or staff ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Staff list retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Server error
 */
// @desc    List all staff (with search & pagination)
// @route   GET /api/staff
// @access  Private (Admin)
router.get('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    logger.info('Fetching staff list', { userId });

    const { query, search, page = 1, limit = 10 } = req.query;
    const searchTerm = (query || search || '').trim();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    if (mongoose.connection.readyState === 1) {
      let filter = {};
      if (searchTerm) {
        const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
          { name: regex },
          { email: regex },
          { phone: regex },
          { role: regex },
          { department: regex },
          { id: regex }
        ];
      }

      const total = await Staff.countDocuments(filter);
      const staff = await Staff.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      logger.info('Staff list fetched successfully', { count: staff.length, total });
      return res.json({
        success: true,
        count: staff.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        data: staff
      });
    }

    // Memory Store fallback
    let staffList = getMemStaff();
    if (searchTerm) {
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      staffList = staffList.filter(s =>
        regex.test(s.name || '') ||
        regex.test(s.email || '') ||
        regex.test(s.phone || '') ||
        regex.test(s.role || '') ||
        regex.test(s.department || '') ||
        regex.test(s.id || '')
      );
    }

    const total = staffList.length;
    const paginated = staffList.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    logger.info('Staff list fetched from memory store', { count: paginated.length, total });
    return res.json({
      success: true,
      count: paginated.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: paginated
    });
  } catch (error) {
    logger.error('Error fetching staff list', {
      error: error.message,
      stack: error.stack,
      userId: req.user ? (req.user._id || req.user.id) : undefined
    });
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /staff:
 *   post:
 *     summary: Create a new staff member
 *     description: Register a new staff member and automatically create an associated User account. Requires Admin role.
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - role
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Receptionist, Billing, Staff, Admin]
 *               department:
 *                 type: string
 *               shift:
 *                 type: string
 *                 enum: [Morning, Evening, Night]
 *               salary:
 *                 type: number
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff created successfully
 *       400:
 *         description: Validation error or email already in use
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Server error
 */
// @desc    Create staff member
// @route   POST /api/staff
// @access  Private (Admin)
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, email, phone, role, department, shift, salary, password } = req.body;

    if (!name || !email || !phone || !role || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, email, phone, role, password'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const staffId = `SC-STF-${Math.floor(10000 + Math.random() * 90000)}`;

    if (mongoose.connection.readyState === 1) {
      // Validate email uniqueness in User model & Staff model
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email is already registered'
        });
      }

      const existingStaff = await Staff.findOne({ email: cleanEmail });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          error: 'Email is already associated with a staff member'
        });
      }

      // 1. Create User document
      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        role
      });

      // 2. Create Staff document
      const staff = await Staff.create({
        id: staffId,
        userId: user._id,
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        role,
        department: department ? department.trim() : 'General',
        shift: shift || 'Morning',
        salary: Number(salary) || 0
      });

      logger.info('Staff created successfully', {
        staffId: staff.id,
        userId: user._id,
        createdById: req.user._id || req.user.id
      });

      return res.status(201).json({ success: true, data: staff });
    }

    // Memory Store fallback
    const usersStore = getMemUsers();
    const staffStore = getMemStaff();

    const existingMemUser = usersStore.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (existingMemUser) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered'
      });
    }

    const existingMemStaff = staffStore.find(s => s.email && s.email.toLowerCase() === cleanEmail);
    if (existingMemStaff) {
      return res.status(400).json({
        success: false,
        error: 'Email is already associated with a staff member'
      });
    }

    const newUserId = new mongoose.Types.ObjectId().toString();
    const newUser = {
      id: newUserId,
      _id: newUserId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      role
    };
    usersStore.push(newUser);

    const newStaffObj = {
      id: staffId,
      _id: new mongoose.Types.ObjectId().toString(),
      userId: newUserId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      role,
      department: department ? department.trim() : 'General',
      shift: shift || 'Morning',
      salary: Number(salary) || 0,
      joiningDate: new Date().toISOString(),
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    staffStore.unshift(newStaffObj);

    logger.info('Staff created successfully (memory store)', {
      staffId: newStaffObj.id,
      userId: newUserId
    });

    return res.status(201).json({ success: true, data: newStaffObj });
  } catch (error) {
    logger.error('Error creating staff', { error: error.message, stack: error.stack });
    return res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /staff/{id}:
 *   put:
 *     summary: Update a staff member
 *     description: Update staff details. If email or role changes, the associated User document is also updated. Requires Admin role.
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID or ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *               shift:
 *                 type: string
 *               salary:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private (Admin)
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const staffParamId = req.params.id;
    const { name, email, phone, role, department, shift, salary, status } = req.body;

    if (mongoose.connection.readyState === 1) {
      let staff = await Staff.findOne({ id: staffParamId });
      if (!staff && mongoose.Types.ObjectId.isValid(staffParamId)) {
        staff = await Staff.findById(staffParamId);
      }

      if (!staff) {
        return res.status(404).json({ success: false, error: 'Staff member not found' });
      }

      let cleanEmail = staff.email;
      if (email && email.trim().toLowerCase() !== staff.email.toLowerCase()) {
        cleanEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser && existingUser._id.toString() !== staff.userId.toString()) {
          return res.status(400).json({ success: false, error: 'Email is already in use by another account' });
        }
      }

      // Update associated User if email, role, or name changed
      if (staff.userId) {
        const user = await User.findById(staff.userId);
        if (user) {
          let userChanged = false;
          if (cleanEmail && user.email !== cleanEmail) {
            user.email = cleanEmail;
            userChanged = true;
          }
          if (role && user.role !== role) {
            user.role = role;
            userChanged = true;
          }
          if (name && user.name !== name.trim()) {
            user.name = name.trim();
            userChanged = true;
          }
          if (userChanged) {
            await user.save();
            logger.info('Associated User document updated', { userId: user._id, staffId: staff.id });
          }
        }
      }

      // Update Staff document
      if (name !== undefined) staff.name = name.trim();
      if (cleanEmail !== undefined) staff.email = cleanEmail;
      if (phone !== undefined) staff.phone = phone.trim();
      if (role !== undefined) staff.role = role;
      if (department !== undefined) staff.department = department.trim();
      if (shift !== undefined) staff.shift = shift;
      if (salary !== undefined) staff.salary = Number(salary);
      if (status !== undefined) staff.status = status;

      await staff.save();

      logger.info('Staff document updated successfully', { staffId: staff.id });
      return res.json({ success: true, data: staff });
    }

    // Memory Store fallback
    const staffStore = getMemStaff();
    const usersStore = getMemUsers();

    const staffIndex = staffStore.findIndex(s => s.id === staffParamId || s._id === staffParamId);
    if (staffIndex === -1) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    const staffItem = staffStore[staffIndex];
    let cleanEmail = staffItem.email;

    if (email && email.trim().toLowerCase() !== (staffItem.email || '').toLowerCase()) {
      cleanEmail = email.trim().toLowerCase();
      const existingUser = usersStore.find(
        u => u.email && u.email.toLowerCase() === cleanEmail && u.id !== staffItem.userId && u._id !== staffItem.userId
      );
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email is already in use by another account' });
      }
    }

    // Update associated memory user
    if (staffItem.userId) {
      const userItem = usersStore.find(u => u.id === staffItem.userId || u._id === staffItem.userId);
      if (userItem) {
        if (cleanEmail) userItem.email = cleanEmail;
        if (role) userItem.role = role;
        if (name) userItem.name = name.trim();
        logger.info('Associated memory user updated', { userId: userItem.id, staffId: staffItem.id });
      }
    }

    // Update memory staff fields
    if (name !== undefined) staffItem.name = name.trim();
    if (cleanEmail !== undefined) staffItem.email = cleanEmail;
    if (phone !== undefined) staffItem.phone = phone.trim();
    if (role !== undefined) staffItem.role = role;
    if (department !== undefined) staffItem.department = department.trim();
    if (shift !== undefined) staffItem.shift = shift;
    if (salary !== undefined) staffItem.salary = Number(salary);
    if (status !== undefined) staffItem.status = status;

    logger.info('Staff updated in memory store', { staffId: staffItem.id });
    return res.json({ success: true, data: staffItem });
  } catch (error) {
    logger.error('Error updating staff', { error: error.message, stack: error.stack });
    return res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /staff/{id}:
 *   delete:
 *     summary: Delete a staff member
 *     description: Delete a staff record and its associated User account. Requires Admin role.
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID or ObjectId
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
// @desc    Delete staff member & associated user
// @route   DELETE /api/staff/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const staffParamId = req.params.id;

    if (mongoose.connection.readyState === 1) {
      let staff = await Staff.findOne({ id: staffParamId });
      if (!staff && mongoose.Types.ObjectId.isValid(staffParamId)) {
        staff = await Staff.findById(staffParamId);
      }

      if (!staff) {
        return res.status(404).json({ success: false, error: 'Staff member not found' });
      }

      if (staff.userId) {
        await User.deleteOne({ _id: staff.userId });
        logger.info('Associated User document deleted', { userId: staff.userId });
      }

      await Staff.deleteOne({ _id: staff._id });
      logger.info('Staff document deleted', { staffId: staff.id });

      return res.json({
        success: true,
        message: 'Staff member and associated user account deleted successfully'
      });
    }

    // Memory Store fallback
    const staffStore = getMemStaff();
    const usersStore = getMemUsers();

    const staffIndex = staffStore.findIndex(s => s.id === staffParamId || s._id === staffParamId);
    if (staffIndex === -1) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    const [deletedStaff] = staffStore.splice(staffIndex, 1);
    if (deletedStaff.userId) {
      const userIndex = usersStore.findIndex(u => u.id === deletedStaff.userId || u._id === deletedStaff.userId);
      if (userIndex !== -1) {
        usersStore.splice(userIndex, 1);
        logger.info('Associated memory user deleted', { userId: deletedStaff.userId });
      }
    }

    logger.info('Staff deleted from memory store', { staffId: deletedStaff.id });
    return res.json({
      success: true,
      message: 'Staff member and associated user account deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting staff', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
