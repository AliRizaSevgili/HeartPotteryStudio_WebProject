const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const axios = require('axios');
const logger = require('../utils/logger');

// reCAPTCHA middleware
async function verifyRecaptcha(req, res, next) {
  const token = req.body.recaptchaToken;
  const formSource = req.body.formSource || 'unknown';
  
  logger.info(`Form source: ${formSource}`);
  
  // Token yoksa hemen hata ver
  if (!token) {
    logger.warn(`reCAPTCHA token eksik: ${formSource} kaynağından gelen formda`);
    return handleRecaptchaError(res, formSource, "reCAPTCHA token eksik");
  }

  try {
    // Zaman aşımını önlemek için timeout ekleyelim
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify`;
    const response = await axios.post(
      verifyURL, 
      null, 
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        },
        timeout: 5000 // 5 saniye timeout
      }
    );
    
    const data = response.data;
    
    logger.info(`reCAPTCHA yanıtı: ${JSON.stringify(data)}`);
    
    // Başarı skoru 0.3'ten büyükse geçerli kabul et (eskiden 0.1'di)
    if (data.success && data.score >= 0.3) {
      logger.info(`reCAPTCHA doğrulaması başarılı: ${formSource}, skor: ${data.score}`);
      return next();
    } else {
      logger.warn(`reCAPTCHA doğrulama hatası: ${JSON.stringify(data)}`);
      return handleRecaptchaError(res, formSource, "reCAPTCHA doğrulaması başarısız");
    }
  } catch (err) {
    logger.error(`reCAPTCHA doğrulama hatası: ${err.message}`);
    return handleRecaptchaError(res, formSource, "reCAPTCHA doğrulama hatası");
  }
}

// Hata işleme fonksiyonu - kod tekrarını azaltmak için
function handleRecaptchaError(res, formSource, errorMessage) {
  switch(formSource) {
    case 'events':
      return res.render("events", { 
        layout: "layouts/main", 
        title: "Events", 
        activeGallery: true, 
        isEventsPage: true, 
        error: errorMessage
      });
    case 'studio':
      return res.render("studio", { 
        layout: "layouts/main", 
        title: "Join the Studio", 
        activeJoin: true, 
        isStudioPage: true, 
        error: errorMessage
      });
    case 'homepage':
      return res.render("homepage", { 
        layout: "layouts/main", 
        title: "Home", 
        activeHome: true, 
        isHomepagePage: true, 
        error: errorMessage
      });
    case 'contact':
    default:
      return res.render("contact", { 
        layout: "layouts/main", 
        title: "Contact | FQA", 
        activeContact: true, 
        isContactPage: true, 
        error: errorMessage
      });
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
module.exports.verifyRecaptcha = verifyRecaptcha;