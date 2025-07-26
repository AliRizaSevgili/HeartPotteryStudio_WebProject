const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger'); // Logger import ediyoruz

// POST /api/payment/checkout
router.post(
  '/checkout',
  [
    body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
    body('currency').isString().notEmpty().withMessage('Currency is required'),
    body('productName').isString().notEmpty().withMessage('Product name is required'),
    body('success_url').isURL().withMessage('Success URL must be valid'),
    body('cancel_url').isURL().withMessage('Cancel URL must be valid')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { amount, currency, productName, success_url, cancel_url } = req.body;
      logger.info('Gelen productName:', productName);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency || 'cad',
              product_data: {
                name: productName // Artık boş olamaz, validation var
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url,
        cancel_url,
        metadata: {
          productName: productName
        }
      });

      res.json({ id: session.id, url: session.url });
    } catch (error) {
      logger.error('Stripe session creation error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

// Stripe Webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Ödeme başarılıysa burada işle
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    logger.debug('Session metadata:', session.metadata);
    try {
      await Order.create({
        sessionId: session.id,
        email: session.customer_details?.email,
        amount: session.amount_total,
        currency: session.currency,
        productName: session.metadata?.productName,
        createdAt: new Date()
      });
      logger.info('✅ Order saved to DB:', session.id);
    } catch (dbErr) {
      logger.error('❌ Order save error:', dbErr);
    }
    logger.info('✅ Payment succeeded:', session.id);
  }

  res.json({ received: true });
});

module.exports = router;