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
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Cancelled', 'Completed'],
    default: 'Scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
