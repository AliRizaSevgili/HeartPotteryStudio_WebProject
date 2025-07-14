const { body, validationResult } = require('express-validator');
const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");
require("dotenv").config(); // 🆕 .env dosyasını yükler


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
    .optional()
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
  console.log("Formdan gelen fromEvents:", req.body.fromEvents);
  console.log("Formdan gelen fromJoin:", req.body.fromJoin);
  console.log("Formdan gelen fromHomepage:", req.body.fromHomepage);
  const errors = validationResult(req); 
  if (!errors.isEmpty()) {
    if (req.body.fromEvents) {
      return res.render("events", {
        layout: "layouts/main",
        title: "Events",
        activeGallery: true,
        errors: errors.array(),
        fromEvents: true // <-- ekle
      });
    } else if (req.body.fromJoin) {
      return res.render("studio", {
        layout: "layouts/main",
        title: "Join the Studio",
        activeJoin: true,
        errors: errors.array(),
        fromJoin: true // <-- ekle
      });
    } else if (req.body.fromHomepage) {
      return res.render("homepage", {
        layout: "layouts/main",
        title: "Home",
        activeHome: true,
        errors: errors.array(),
        fromHomepage: true // <-- ekle
      });
    } else {
      return res.render("contact", {
        layout: "layouts/main",
        title: "Contact | FQA",
        activeContact: true,
        errors: errors.array()
      });
    }
  }
  try {
    
    console.log("📥 Form Data:", req.body);

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

    // Mail gönderimi
    const mailOptions = {
      from: `"HeartPottery Contact Form" <alirizasevgili1@gmail.com>`,
      to: "alirizasevgili1@gmail.com",
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

    // Doğru sayfayı render et
    if (req.body.fromEvents) {
      
      return res.render("events", {
        layout: "layouts/main",
        title: "Events",
        activeGallery: true,
        success: true,
        fromEvents: true // <-- ekle
      });
    } else if (req.body.fromJoin) {
      console.log("### STUDIO SAYFASI RENDER EDİLİYOR");
      return res.render("studio", {
        layout: "layouts/main",
        title: "Join the Studio",
        activeJoin: true,
        success: true,
        fromJoin: true // <-- ekle
      });
    } else if (req.body.fromHomepage) {
      console.log("### HOMEPAGE RENDER EDİLİYOR");
      return res.render("homepage", {
        layout: "layouts/main",
        title: "Home",
        activeHome: true,
        success: true,
        fromHomepage: true // <-- ekle
      });
    } else {
      console.log("### CONTACT SAYFASI RENDER EDİLİYOR");
      return res.render("contact", {
        layout: "layouts/main",
        title: "Contact | FQA",
        activeContact: true,
        success: true
      });
    }
  } catch (error) {
    console.error("Form submission error:", error);
    if (req.body.fromJoin) {
      return res.render("studio", {
        layout: "layouts/main",
        title: "Join the Studio",
        activeJoin: true,
        error: "Failed to submit form",
        fromJoin: true // <-- ekle
      });
    } else if (req.body.fromHomepage) {
      return res.render("homepage", {
        layout: "layouts/main",
        title: "Home",
        activeHome: true,
        error: "Failed to submit form",
        fromHomepage: true // <-- ekle
      });
    } else if (req.body.fromEvents) {
      return res.render("events", {
        layout: "layouts/main",
        title: "Events",
        activeGallery: true,
        error: "Failed to submit form",
        fromEvents: true // <-- ekle
      });
    } else {
      return res.render("contact", {
        layout: "layouts/main",
        title: "Contact | FQA",
        activeContact: true,
        error: "Failed to submit form"
      });
    }
  }
};

