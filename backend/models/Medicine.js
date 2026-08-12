const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please add medicine name'],
    trim: true
  },
  genericName: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Other'],
    default: 'Tablet'
  },
  manufacturer: {
    type: String,
    default: '',
    trim: true
  },
  batchNumber: {
    type: String,
    default: '',
    trim: true
  },
  expiryDate: {
    type: String,
    required: [true, 'Please add expiry date']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Please add purchase price'],
    min: [0, 'Price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Please add selling price'],
    min: [0, 'Price cannot be negative']
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Threshold cannot be negative']
  },
  unit: {
    type: String,
    enum: ['Tablets', 'Capsules', 'ml', 'mg', 'Units', 'Strips', 'Vials', 'Bottles'],
    default: 'Tablets'
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Full-text search index for advanced search
MedicineSchema.index({
  name: 'text',
  genericName: 'text',
  manufacturer: 'text',
  batchNumber: 'text',
  category: 'text'
}, {
  name: 'medicine_text_search',
  weights: { name: 10, genericName: 8, manufacturer: 5, category: 3, batchNumber: 2 }
});

// Compound index for duplicate-batch detection (case-insensitive lookups done in application layer)
MedicineSchema.index({ name: 1, genericName: 1, batchNumber: 1 });

// Compound index for common query patterns
MedicineSchema.index({ category: 1 });
MedicineSchema.index({ expiryDate: 1 });
MedicineSchema.index({ stockQuantity: 1 });

module.exports = mongoose.model('Medicine', MedicineSchema);
