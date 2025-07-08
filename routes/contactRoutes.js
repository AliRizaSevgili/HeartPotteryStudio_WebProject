const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.post(
  '/',
  contactController.validateContactForm,
  contactController.submitContactForm
);

module.exports = router; 