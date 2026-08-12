const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add staff name']
  },
  email: {
    type: String,
    required: [true, 'Please add email']
  },
  phone: {
    type: String,
    required: [true, 'Please add phone number']
  },
  role: {
    type: String,
    enum: ['Receptionist', 'Billing', 'Staff', 'Admin'],
    required: [true, 'Please add a role']
  },
  department: {
    type: String,
    default: 'General'
  },
  shift: {
    type: String,
    enum: ['Morning', 'Evening', 'Night'],
    default: 'Morning'
  },
  salary: {
    type: Number,
    default: 0
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Full-text search index
StaffSchema.index({
  name: 'text',
  email: 'text',
  phone: 'text',
  department: 'text',
  role: 'text'
}, {
  name: 'staff_text_search',
  weights: { name: 10, email: 5, phone: 3, role: 2 }
});

module.exports = mongoose.model('Staff', StaffSchema);
