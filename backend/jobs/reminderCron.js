const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { sendSms, getTwilioConfig } = require('../config/twilioService');
const mongoose = require('mongoose');
const logger = require('../config/logger');

// Run every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  logger.info('Running daily appointment reminder cron job');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let appointments = [];

    if (mongoose.connection.readyState === 1) {
      appointments = await Appointment.find({ date: tomorrowStr, status: 'Scheduled' });
    } else {
      appointments = (global.memoryStore.appointments || []).filter(
        a => a.date === tomorrowStr && a.status === 'Scheduled'
      );
    }

    if (appointments.length === 0) {
      logger.info('No appointments scheduled for tomorrow. Skipping reminders.');
      return;
    }

    const twilioCfg = await getTwilioConfig();
    if (!twilioCfg) {
      logger.warn('Twilio not configured. Reminders will be logged to console only.');
    }

    for (const appt of appointments) {
      let patient;
      if (mongoose.connection.readyState === 1) {
        patient = await Patient.findOne({ id: appt.patientId });
      } else {
        patient = (global.memoryStore.patients || []).find(p => p.id === appt.patientId);
      }

      if (patient && patient.phone) {
        const message = `Reminder: You have an appointment at Subhan Care Clinic with ${appt.doctorName} tomorrow (${appt.date}) at ${appt.time}. Reply Cancel to cancel.`;
        
        if (twilioCfg) {
          try {
            await sendSms(patient.phone, message);
            logger.info(`Reminder SMS sent to ${patient.name}`);
          } catch (err) {
            logger.error(`Failed to send reminder SMS to ${patient.name}`, { error: err.message });
          }
        } else {
          // Fallback log
          logger.info(`[MOCK SMS to ${patient.phone}]: ${message}`);
        }
      }
    }
  } catch (err) {
    logger.error('Error running reminder cron job', { error: err.message });
  }
});
