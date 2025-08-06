// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const csrf = require('csurf');

// CSRF koruma middleware'i
const csrfProtection = csrf({ cookie: true });

// Tüm rotalarda CSRF koruması kullan
router.use(csrfProtection);

// Tüm etkinlikleri görüntüleme
router.get('/events', eventController.getAllEvents);

// Slug ile etkinlik detayları
router.get('/event/:slug', eventController.getEventBySlug);

// Etkinliği sepete ekleme
router.post('/event/add-to-cart', eventController.addEventToCart);

module.exports = router;