const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please add patient name']
  },
  dob: {
    type: String,
    required: [true, 'Please add date of birth']
  },
  gender: {
    type: String,
    required: [true, 'Please add gender'],
    enum: ['Male', 'Female', 'Other']
  },
  cnic: {
    type: String,
    required: [true, 'Please add CNIC'],
    unique: true,
    match: [
      /^\d{5}-\d{7}-\d{1}$/,
      'Please enter CNIC in XXXXX-XXXXXXX-X format'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add phone number']
  },
  email: {
    type: String,
    required: [true, 'Please add email']
  },
  bloodGroup: {
    type: String,
    required: [true, 'Please select blood group'],
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  emergencyContact: {
    type: String,
    required: [true, 'Please add emergency contact details']
  },
  address: {
    type: String,
    required: [true, 'Please add address']
  },
  allergies: {
    type: String,
    default: 'None'
  },
  allergySeverity: {
    type: String,
    enum: ['Critical', 'Moderate', 'Mild', 'None'],
    default: 'None'
  },
  registeredDate: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Patient', PatientSchema);
