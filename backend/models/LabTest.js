const mongoose = require('mongoose');

const LabTestSchema = new mongoose.Schema({
  testId: { 
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
  testName: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['Blood', 'Urine', 'Radiology', 'Pathology', 'Other'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  result: { 
    type: String, 
    default: '' 
  },
  cost: { 
    type: Number, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('LabTest', LabTestSchema);
