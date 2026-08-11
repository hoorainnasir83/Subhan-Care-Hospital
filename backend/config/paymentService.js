const Stripe = require('stripe');
const mongoose = require('mongoose');
const logger = require('./logger');

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured. Set STRIPE_SECRET_KEY in environment variables.');
  }
  return Stripe(secretKey);
};

const createStripeCheckoutSession = async ({ amount, currency = 'usd', invoiceId, successUrl, cancelUrl, customerEmail }) => {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency,
        product_data: {
          name: `Invoice ${invoiceId}`,
          description: 'Hospital Payment'
        },
        unit_amount: Math.round(amount * 100)
      },
      quantity: 1
    }],
    metadata: {
      invoiceId
    },
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl
  });

  logger.info('Created Stripe checkout session', { invoiceId, sessionId: session.id });
  return session;
};

module.exports = { createStripeCheckoutSession };
