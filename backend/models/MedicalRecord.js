const mongoose = require('mongoose');

const VitalSignsSchema = new mongoose.Schema({
  bloodPressure: { type: String, default: '' },
  temperature: { type: String, default: '' },
  pulse: { type: String, default: '' },
  weight: { type: String, default: '' },
  height: { type: String, default: '' },
  oxygenSaturation: { type: String, default: '' }
}, { _id: false });

const MedicalRecordSchema = new mongoose.Schema({
  recordId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  patientId: { 
    type: String, 
    required: true 
  },
  patientName: { 
    type: String, 
    required: true 
  },
  doctorId: { 
    type: String, 
    required: true 
  },
  doctorName: {
    type: String,
    required: true
  },
  appointmentId: {
    type: String,
    default: null
  },
  visitDate: { 
    type: Date, 
    required: true 
  },
  chiefComplaint: { 
    type: String, 
    required: true 
  },
  symptoms: {
    type: [String],
    default: []
  },
  diagnosis: { 
    type: String, 
    required: true 
  },
  treatment: { 
    type: String, 
    default: '' 
  },
  medications: {
    type: [String],
    default: []
  },
  labResults: {
    type: [String],
    default: []
  },
  vitalSigns: {
    type: VitalSignsSchema,
    default: () => ({})
  },
  allergies: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date,
    default: null
  },
  recordType: { 
    type: String, 
    enum: ['Visit', 'Emergency', 'Surgery', 'Checkup', 'Lab'], 
    default: 'Visit' 
  },
  attachments: {
    type: [String],
    default: []
  },
  status: { 
    type: String, 
    enum: ['Active', 'Archived'], 
    default: 'Active' 
  }
}, { timestamps: true });

// Text indexing for search
MedicalRecordSchema.index({ diagnosis: 'text', symptoms: 'text', notes: 'text', chiefComplaint: 'text' });

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
