const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

// POST /api/payment/checkout
router.post('/checkout', async (req, res) => {
  try {
    const { amount, currency, productName, success_url, cancel_url } = req.body;
    console.log('Gelen productName:', productName); // <-- LOG EKLENDİ

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'cad',
            product_data: {
              name: productName || 'Pottery Class' // Dinamik ürün adı
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || 'https://yourdomain.com/success',
      cancel_url: cancel_url || 'https://yourdomain.com/cancel',
      metadata: {
        productName: productName || 'Pottery Class'
      }
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Ödeme başarılıysa burada işle
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Session metadata:', session.metadata); // <-- LOG EKLENDİ
    try {
      await Order.create({
        sessionId: session.id,
        email: session.customer_details?.email,
        amount: session.amount_total,
        currency: session.currency,
        productName: session.metadata?.productName, // Stripe metadata'dan ürün adı
        createdAt: new Date()
      });
      console.log('✅ Order saved to DB:', session.id);
    } catch (dbErr) {
      console.error('❌ Order save error:', dbErr);
    }
    console.log('✅ Payment succeeded:', session.id);
  }

  res.json({ received: true });
});

module.exports = router;