const { body, validationResult } = require('express-validator');
const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");
const axios = require('axios');
require("dotenv").config();

exports.validateContactForm = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isAlpha('en-US', { ignore: ' ' }).withMessage('First name must contain only letters'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isAlpha('en-US', { ignore: ' ' }).withMessage('Last name must contain only letters'),
  body('email')
    .isEmail().withMessage('Valid email is required'),
  body('contactNumber')
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Valid phone number required'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
];

// Gmail transport ayarı
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.submitContactForm = async (req, res) => {
  // İşlem takibi için benzersiz ID oluştur
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  console.log(`[${requestId}] Form işleniyor - Kaynak: ${req.body.formSource || 'bilinmiyor'}`);
  
  const errors = validationResult(req); 
  
  if (!errors.isEmpty()) {
    console.log(`[${requestId}] Form doğrulama hataları:`, errors.array());
    // Form kaynağına göre doğru sayfayı render et
    const formSource = req.body.formSource || 'contact';
    
    switch(formSource) {
      case 'events':
        return res.render("events", {
          layout: "layouts/main", 
          title: "Events",
          activeGallery: true,
          isEventsPage: true,
          errors: errors.array(),
          formSource: formSource
        });
      case 'studio':
        return res.render("studio", {
          layout: "layouts/main",
          title: "Join the Studio", 
          activeJoin: true,
          isStudioPage: true,
          errors: errors.array(),
          formSource: formSource
        });
      case 'homepage':
        return res.render("homepage", {
          layout: "layouts/main",
          title: "Home",
          activeHome: true,
          isHomepagePage: true,
          errors: errors.array(),
          formSource: formSource
        });
      case 'contact':
      default:
        return res.render("contact", {
          layout: "layouts/main",
          title: "Contact | FQA",
          activeContact: true,
          isContactPage: true,
          errors: errors.array()
        });
    }
  }
  
  try {
    // Hassas veri maskesi
    const safeLog = { ...req.body };
    if (safeLog.email) safeLog.email = '[MASKED]';
    if (safeLog.contactNumber) safeLog.contactNumber = '[MASKED]';
    console.log(`[${requestId}] 📥 Form Data (masked):`, safeLog);

    const {
      firstName,
      lastName,
      company,
      email,
      contactNumber,
      message,
    } = req.body;

    // Veritabanına kayıt
    const contactData = new Contact({
      firstName,
      lastName,
      company,
      email,
      contactNumber,
      message,
    });
    await contactData.save();
    console.log(`[${requestId}] ✅ Veritabanına kaydedildi`);

    // Mail gönderimi
    const mailOptions = {
      from: `"HeartPottery Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "New Contact Form Submission",
      html: `
        <h3>New Contact Form Submission</h3>
        <ul>
          <li><strong>First Name:</strong> ${firstName}</li>
          <li><strong>Last Name:</strong> ${lastName}</li>
          <li><strong>Company:</strong> ${company || "N/A"}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone Number:</strong> ${contactNumber}</li>
          <li><strong>Message:</strong> ${message}</li>
        </ul>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[${requestId}] ✅ E-posta gönderildi`);
    
    // Doğru sayfayı render et
    const formSource = req.body.formSource || 'contact';
    console.log(`[${requestId}] 🔄 İşlem tamamlandı, yönlendiriliyor: ${formSource}`);
      
    // TÜM form başarılarını /contact-success sayfasına yönlendir
    // Sadece 'events' için aynı sayfada başarı mesajı göster
    switch(formSource) {
      case 'events':
        console.log(`[${requestId}] ### EVENTS SAYFASINDAN GELEN FORM`);
        return res.render("events", {
          layout: "layouts/main",
          title: "Events",
          activeGallery: true,
          isEventsPage: true,
          success: true,
          formSource: formSource
        });
      default:
        // Tüm diğer formları contact-success sayfasına yönlendir
        console.log(`[${requestId}] ### ${formSource.toUpperCase()} SAYFASINDAN GELEN FORM`);
        return res.redirect('/contact-success');
    }
  } catch (error) {
    console.error(`[${requestId}] ❌ Form submission error:`, error);
    
    const formSource = req.body.formSource || 'contact';
    
    switch(formSource) {
      case 'events':
        return res.render("events", {
          layout: "layouts/main",
          title: "Events",
          activeGallery: true,
          isEventsPage: true,
          error: "Failed to submit form",
          formSource: formSource
        });
      case 'studio':
        return res.render("studio", {
          layout: "layouts/main",
          title: "Join the Studio",
          activeJoin: true,
          isStudioPage: true,
          error: "Failed to submit form",
          formSource: formSource
        });
      case 'homepage':
        return res.render("homepage", {
          layout: "layouts/main",
          title: "Home",
          activeHome: true,
          isHomepagePage: true,
          error: "Failed to submit form",
          formSource: formSource
        });
      case 'contact':
      default:
        return res.render("contact", {
          layout: "layouts/main",
          title: "Contact | FQA",
          activeContact: true,
          isContactPage: true,
          error: "Failed to submit form"
        });
    }
  }
};