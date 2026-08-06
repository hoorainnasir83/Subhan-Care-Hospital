const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  // Hospital Settings
  hospital: {
    name: { type: String, default: 'Subhan Care HMS' },
    address: { type: String, default: '123 Health Ave, Medical City' },
    phone: { type: String, default: '+1 (555) 123-4567' },
    email: { type: String, default: 'contact@subhancare.com' },
    website: { type: String, default: 'https://subhancare.com' },
    emergencyContact: { type: String, default: '911' },
    currency: { type: String, default: 'USD' },
    timeZone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    logo: { type: String, default: '' } // Base64 or URL
  },

  // System Settings
  system: {
    appointmentDuration: { type: Number, default: 30 }, // in minutes
    openingHours: { type: String, default: '09:00 - 17:00' },
    workingDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    language: { type: String, default: 'English' },
    theme: { type: String, default: 'light' }
  },

  // Security Settings
  security: {
    passwordPolicy: { type: Boolean, default: true },
    minPasswordLength: { type: Number, default: 8 },
    requireUppercase: { type: Boolean, default: true },
    requireNumbers: { type: Boolean, default: true },
    requireSymbols: { type: Boolean, default: false },
    maxLoginAttempts: { type: Number, default: 5 },
    accountLockTime: { type: Number, default: 15 } // in minutes
  },

  // Notifications Settings
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    appointmentReminders: { type: Boolean, default: true },
    billingAlerts: { type: Boolean, default: true },
    stockAlerts: { type: Boolean, default: true }
  },

  // Email/SMTP Settings
  email: {
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    username: { type: String, default: '' },
    password: { type: String, default: '' },
    senderEmail: { type: String, default: '' },
    senderName: { type: String, default: 'Subhan Care' }
  },

  // SMS Settings
  sms: {
    provider: { type: String, enum: ['Twilio', 'Custom Gateway', 'None'], default: 'None' },
    twilioSid: { type: String, default: '' },
    twilioAuthToken: { type: String, default: '' },
    twilioPhone: { type: String, default: '' },
    customGatewayUrl: { type: String, default: '' },
    customGatewayKey: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingsSchema);
