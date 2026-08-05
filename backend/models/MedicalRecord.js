const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: String,
    required: [true, 'Please add patient ID']
  },
  doctorId: {
    type: String,
    required: [true, 'Please add doctor ID']
  },
  appointmentId: {
    type: String,
    default: null
  },
  recordType: {
    type: String,
    required: [true, 'Please select record type'],
    enum: ['Diagnosis', 'Lab Test', 'Scan', 'Procedure', 'Allergy', 'Medication History', 'Vaccination', 'Surgery', 'Other'],
    default: 'Other'
  },
  recordDate: {
    type: String,
    required: [true, 'Please add record date']
  },
  title: {
    type: String,
    required: [true, 'Please add record title'],
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add description'],
    minlength: [5, 'Description must be at least 5 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  findings: {
    type: String,
    default: '',
    maxlength: [3000, 'Findings cannot exceed 3000 characters']
  },
  recommendations: {
    type: String,
    default: '',
    maxlength: [2000, 'Recommendations cannot exceed 2000 characters']
  },
  severity: {
    type: String,
    required: [true, 'Please select severity level'],
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Resolved', 'Archived', 'Follow-up Needed'],
    default: 'Active'
  },
  tags: [{
    type: String,
    minlength: [2, 'Tag must be at least 2 characters'],
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isConfidential: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: '',
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  attachments: [{
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileData: { type: String, required: true }, // Base64 data URI
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdBy: {
    type: String,
    required: true
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

// Update timestamp on save
MedicalRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Full-text search index
MedicalRecordSchema.index({
  title: 'text',
  description: 'text',
  findings: 'text'
}, {
  name: 'medical_record_text_search',
  weights: { 
    title: 10, 
    description: 5,
    findings: 3
  }
});

// Compound indexes for performance
MedicalRecordSchema.index({ patientId: 1, recordDate: -1 });
MedicalRecordSchema.index({ patientId: 1, status: 1 });
MedicalRecordSchema.index({ doctorId: 1, createdAt: -1 });
MedicalRecordSchema.index({ recordType: 1, patientId: 1 });
MedicalRecordSchema.index({ recordDate: -1 });

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
