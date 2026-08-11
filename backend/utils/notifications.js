const logger = require('../config/logger');
const { getTwilioConfig, sendSms } = require('../config/twilioService');

const emit = (app, event, data) => {
  try {
    const io = app && app.get ? app.get('io') : null;
    if (io) io.emit(event, data);
  } catch (error) {
    logger.error('Failed to emit socket event', { error: error.message, event });
  }
};

const invoiceCreated = async (app, invoice, patient) => {
  emit(app, 'invoice:created', { invoice });

  try {
    const cfg = await getTwilioConfig();
    if (cfg && cfg.useTwilio && patient && patient.phone) {
      const body = `Your invoice ${invoice.id} for amount ${invoice.totalAmount} has been created.`;
      await sendSms(patient.phone, body);
      logger.info('Invoice created SMS sent', { invoiceId: invoice.id, to: patient.phone });
    }
  } catch (err) {
    logger.error('Failed to send invoice created SMS', { error: err.message, invoiceId: invoice.id });
  }
};

const invoicePaid = async (app, invoice, patient) => {
  emit(app, 'invoice:paid', { invoice });

  try {
    const cfg = await getTwilioConfig();
    if (cfg && cfg.useTwilio && patient && patient.phone) {
      const body = `Payment received for invoice ${invoice.id}. Thank you!`;
      await sendSms(patient.phone, body);
      logger.info('Invoice paid SMS sent', { invoiceId: invoice.id, to: patient.phone });
    }
  } catch (err) {
    logger.error('Failed to send invoice paid SMS', { error: err.message, invoiceId: invoice.id });
  }
};

module.exports = { emit, invoiceCreated, invoicePaid };
