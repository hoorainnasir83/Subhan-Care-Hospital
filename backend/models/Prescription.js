const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  name:         { type: String, required: [true, 'Medication name is required'], minlength: 2, maxlength: 100 },
  dosage:       { type: String, required: [true, 'Dosage is required'], maxlength: 50 },
  frequency:    {
    type: String,
    required: [true, 'Frequency is required'],
    enum: ['Once daily', 'Twice daily', 'Thrice daily', 'As needed', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours']
  },
  duration:     { type: Number, required: [true, 'Duration (days) is required'], min: 1, max: 365 },
  instructions: { type: String, default: '', maxlength: 500 }
}, { _id: false });

const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true },
  patientId:      { type: String, required: [true, 'Patient ID is required'] },
  patientName:    { type: String, required: [true, 'Patient name is required'] },
  doctorId:       { type: String, required: [true, 'Doctor ID is required'] },
  doctorName:     { type: String, required: [true, 'Doctor name is required'] },
  appointmentId:  { type: String, default: null },

  medications: {
    type: [MedicationSchema],
    validate: {
      validator: (arr) => arr.length >= 1 && arr.length <= 20,
      message: 'Prescription must have 1-20 medications'
    }
  },

  diagnosis:      { type: String, required: [true, 'Diagnosis is required'], minlength: [5, 'Diagnosis must be at least 5 characters'], maxlength: [500, 'Diagnosis cannot exceed 500 characters'] },
  notes:          { type: String, default: '', maxlength: 1000 },

  issuedDate:     { type: String, required: true },
  expiryDate:     { type: String, required: [true, 'Expiry date is required'] },
  followUpDate:   { type: String, default: null },

  status:         { type: String, enum: ['Active', 'Expired', 'Completed', 'Cancelled'], default: 'Active' },

  refillsAllowed: { type: Number, default: 0, min: 0, max: 10 },
  refillsUsed:    { type: Number, default: 0, min: 0 },

  parentPrescriptionId: { type: String, default: null },
  filledBy:       { type: String, default: null },
  filledDate:     { type: String, default: null },

  cancelledBy:    { type: String, default: null },
  cancelledDate:  { type: String, default: null },

  createdBy:      { type: String, required: true },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now }
});

PrescriptionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  // Auto-expire if expiryDate has passed
  if (this.expiryDate && new Date(this.expiryDate) < new Date() && this.status === 'Active') {
    this.status = 'Expired';
  }
  next();
});

// Performance indexes
PrescriptionSchema.index({ patientId: 1, status: 1 });
PrescriptionSchema.index({ doctorId: 1, issuedDate: -1 });
PrescriptionSchema.index({ appointmentId: 1 });

module.exports = mongoose.model('Prescription', PrescriptionSchema);