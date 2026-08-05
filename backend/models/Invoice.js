const mongoose = require('mongoose');

const ServiceItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true
  }
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: String,
    required: [true, 'Please add patient ID']
  },
  patientName: {
    type: String,
    required: [true, 'Please add patient name']
  },
  date: {
    type: String,
    required: [true, 'Please add invoice date']
  },
  dueDate: {
    type: String,
    required: [true, 'Please add due date']
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer', 'Insurance'],
    default: 'Cash'
  },
  services: [ServiceItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  discountAmount: {
    type: Number,
    required: true,
    default: 0
  },
  taxRate: {
    type: Number,
    required: true,
    default: 0
  },
  taxAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Full-text search index
InvoiceSchema.index({
  patientName: 'text',
  patientId: 'text'
}, {
  name: 'invoice_text_search',
  weights: { patientName: 10, patientId: 5 }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
