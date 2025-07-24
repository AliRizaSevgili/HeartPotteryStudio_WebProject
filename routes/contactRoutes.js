const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const axios = require('axios');

// reCAPTCHA middleware
async function verifyRecaptcha(req, res, next) {
  const recaptchaToken = req.body.recaptchaToken;
  if (!recaptchaToken) {
    // Hangi sayfadan geldiğini kontrol et
    if (req.body.fromEvents) {
      return res.render("events", { layout: "layouts/main", title: "Events", activeGallery: true, error: "reCAPTCHA token missing" });
    } else if (req.body.fromJoin) {
      return res.render("studio", { layout: "layouts/main", title: "Join the Studio", activeJoin: true, isStudioPage: true, error: "reCAPTCHA token missing" });
    } else if (req.body.fromHomepage) {
      return res.render("homepage", { layout: "layouts/main", title: "Home", activeHome: true, error: "reCAPTCHA token missing" });
    } else {
      return res.render("contact", { layout: "layouts/main", title: "Contact | FQA", activeContact: true, error: "reCAPTCHA token missing" });
    }
  }
  try {
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
    const response = await axios.post(verifyUrl);
    const data = response.data;
    if (!data.success || data.score < 0.1) {
      if (req.body.fromEvents) {
        return res.render("events", { layout: "layouts/main", title: "Events", activeGallery: true, error: "reCAPTCHA verification failed" });
      } else if (req.body.fromJoin) {
        return res.render("studio", { layout: "layouts/main", title: "Join the Studio", activeJoin: true, isStudioPage: true, error: "reCAPTCHA verification failed" });
      } else if (req.body.fromHomepage) {
        return res.render("homepage", { layout: "layouts/main", title: "Home", activeHome: true, error: "reCAPTCHA verification failed" });
      } else {
        return res.render("contact", { layout: "layouts/main", title: "Contact | FQA", activeContact: true, error: "reCAPTCHA verification failed" });
      }
    }
    next();
  } catch (err) {
    if (req.body.fromEvents) {
      return res.render("events", { layout: "layouts/main", title: "Events", activeGallery: true, error: "reCAPTCHA verification error" });
    } else if (req.body.fromJoin) {
      return res.render("studio", { layout: "layouts/main", title: "Join the Studio", activeJoin: true, isStudioPage: true, error: "reCAPTCHA verification error" });
    } else if (req.body.fromHomepage) {
      return res.render("homepage", { layout: "layouts/main", title: "Home", activeHome: true, error: "reCAPTCHA verification error" });
    } else {
      return res.render("contact", { layout: "layouts/main", title: "Contact | FQA", activeContact: true, error: "reCAPTCHA verification error" });
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