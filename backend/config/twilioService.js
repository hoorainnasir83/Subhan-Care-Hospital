const twilio = require('twilio');
const mongoose = require('mongoose');

const getTwilioConfig = async () => {
  let accountSid = process.env.TWILIO_ACCOUNT_SID;
  let authToken = process.env.TWILIO_AUTH_TOKEN;
  let fromPhone = process.env.TWILIO_PHONE_NUMBER;
  let useTwilio = false;

  if (mongoose.connection.readyState === 1) {
    try {
      const Setting = require('../models/Setting');
      const settings = await Setting.findOne();
      if (settings?.sms?.provider === 'Twilio') {
        useTwilio = true;
        accountSid = settings.sms.twilioSid || accountSid;
        authToken = settings.sms.twilioAuthToken || authToken;
        fromPhone = settings.sms.twilioPhone || fromPhone;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load Twilio settings from database, falling back to ENV variables.');
    }
  }

  if (!accountSid || !authToken || !fromPhone) {
    return null;
  }

  return { accountSid, authToken, fromPhone, useTwilio };
};

const sendSms = async (to, body) => {
  const config = await getTwilioConfig();
  if (!config) {
    throw new Error('Twilio configuration is missing. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.');
  }

  const client = twilio(config.accountSid, config.authToken);

  const message = await client.messages.create({
    body,
    from: config.fromPhone,
    to
  });

  return message;
};

module.exports = { getTwilioConfig, sendSms };
