const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const axios = require('axios');

// reCAPTCHA middleware
async function verifyRecaptcha(req, res, next) {
  const recaptchaToken = req.body.recaptchaToken;
  if (!recaptchaToken) {
    // Hangi sayfadan geldiğini kontrol et
    const formSource = req.body.formSource || 'contact';
    
    switch(formSource) {
      case 'events':
        return res.render("events", { 
          layout: "layouts/main", 
          title: "Events", 
          activeGallery: true, 
          isEventsPage: true, 
          error: "reCAPTCHA token missing" 
        });
      case 'studio':
        return res.render("studio", { 
          layout: "layouts/main", 
          title: "Join the Studio", 
          activeJoin: true, 
          isStudioPage: true, 
          error: "reCAPTCHA token missing" 
        });
      case 'homepage':
        return res.render("homepage", { 
          layout: "layouts/main", 
          title: "Home", 
          activeHome: true, 
          isHomepagePage: true, 
          error: "reCAPTCHA token missing" 
        });
      case 'contact':
      default:
        return res.render("contact", { 
          layout: "layouts/main", 
          title: "Contact | FQA", 
          activeContact: true, 
          isContactPage: true, 
          error: "reCAPTCHA token missing" 
        });
    }
  }
  
  try {
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
    const response = await axios.post(verifyUrl);
    const data = response.data;
    
    if (!data.success || data.score < 0.1) {
      const formSource = req.body.formSource || 'contact';
      
      switch(formSource) {
        case 'events':
          return res.render("events", { 
            layout: "layouts/main", 
            title: "Events", 
            activeGallery: true, 
            isEventsPage: true, 
            error: "reCAPTCHA verification failed" 
          });
        case 'studio':
          return res.render("studio", { 
            layout: "layouts/main", 
            title: "Join the Studio", 
            activeJoin: true, 
            isStudioPage: true, 
            error: "reCAPTCHA verification failed" 
          });
        case 'homepage':
          return res.render("homepage", { 
            layout: "layouts/main", 
            title: "Home", 
            activeHome: true, 
            isHomepagePage: true, 
            error: "reCAPTCHA verification failed" 
          });
        case 'contact':
        default:
          return res.render("contact", { 
            layout: "layouts/main", 
            title: "Contact | FQA", 
            activeContact: true, 
            isContactPage: true, 
            error: "reCAPTCHA verification failed" 
          });
      }
    }
    
    next();
  } catch (err) {
    const formSource = req.body.formSource || 'contact';
    
    switch(formSource) {
      case 'events':
        return res.render("events", { 
          layout: "layouts/main", 
          title: "Events", 
          activeGallery: true, 
          isEventsPage: true, 
          error: "reCAPTCHA verification error" 
        });
      case 'studio':
        return res.render("studio", { 
          layout: "layouts/main", 
          title: "Join the Studio", 
          activeJoin: true, 
          isStudioPage: true, 
          error: "reCAPTCHA verification error" 
        });
      case 'homepage':
        return res.render("homepage", { 
          layout: "layouts/main", 
          title: "Home", 
          activeHome: true, 
          isHomepagePage: true, 
          error: "reCAPTCHA verification error" 
        });
      case 'contact':
      default:
        return res.render("contact", { 
          layout: "layouts/main", 
          title: "Contact | FQA", 
          activeContact: true, 
          isContactPage: true, 
          error: "reCAPTCHA verification error" 
        });
    }
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