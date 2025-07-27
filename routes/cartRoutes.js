const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const csrf = require('csurf');

// CSRF koruma middleware'i
const csrfProtection = csrf({ cookie: true });

// Tüm rotalarda CSRF koruması kullan
router.use(csrfProtection);

// Slot rezervasyon rotası
router.post('/reserve-slot', cartController.addToCart);

// Rezervasyon sayfası
router.get('/reservation', cartController.viewCart);

// Rezervasyon iptal
router.post('/cancel-reservation', cartController.removeFromCart);

// Promo kod uygulama
router.post('/apply-promo', cartController.applyPromoCode);

module.exports = router;