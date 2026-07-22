const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please add doctor name']
  },
  specialty: {
    type: String,
    required: [true, 'Please add specialty']
  },
  phone: {
    type: String,
    required: [true, 'Please add phone number']
  },
  email: {
    type: String,
    required: [true, 'Please add email']
  },
  availability: {
    type: String,
    required: [true, 'Please add availability schedule']
  },
  fee: {
    type: Number,
    required: [true, 'Please add consulting fee']
  },
  rating: {
    type: Number,
    default: 5.0
  },
  consultsCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Doctor', DoctorSchema);
