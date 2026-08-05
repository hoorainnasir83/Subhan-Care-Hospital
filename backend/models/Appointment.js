const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
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
  doctorId: {
    type: String,
    required: [true, 'Please add doctor ID']
  },
  doctorName: {
    type: String,
    required: [true, 'Please add doctor name']
  },
  date: {
    type: String,
    required: [true, 'Please add date']
  },
  time: {
    type: String,
    required: [true, 'Please add time']
  },
  fee: {
    type: Number,
    required: true,
    min: [0, 'Fee cannot be negative']
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Cancelled', 'Completed', 'No-Show'],
    default: 'Scheduled'
  },
  // ✅ NEW FIELDS
  reason: {
    type: String,
    default: '',
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    default: '',
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  prescription: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: String,
    default: null
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Online', 'Insurance', 'Pending'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Update timestamp on save
AppointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ Full-text search index
AppointmentSchema.index({
  patientName: 'text',
  doctorName: 'text',
  reason: 'text'
}, {
  name: 'appointment_text_search',
  weights: { 
    patientName: 10, 
    doctorName: 8,
    reason: 5
  }
});

// ✅ Compound index for conflict detection
AppointmentSchema.index({ 
  doctorId: 1, 
  date: 1, 
  time: 1 
}, { 
  name: 'doctor_slot_index' 
});

// ✅ Status index for filtering
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1 });
AppointmentSchema.index({ date: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);