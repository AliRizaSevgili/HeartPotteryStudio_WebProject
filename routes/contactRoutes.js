const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const axios = require('axios');

// reCAPTCHA middleware
async function verifyRecaptcha(req, res, next) {
  const recaptchaToken = req.body.recaptchaToken;
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'reCAPTCHA token missing' });
  }
  try {
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
    const response = await axios.post(verifyUrl);
    const data = response.data;
    if (!data.success || data.score < 0.5) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'reCAPTCHA verification error' });
  }
}

// Use reCAPTCHA middleware before validation and submission
router.post(
  '/',
  verifyRecaptcha,
  contactController.validateContactForm,
  contactController.submitContactForm
);

module.exports = router;