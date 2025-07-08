
const { body, validationResult } = require('express-validator');
const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");
require("dotenv").config(); // 🆕 .env dosyasını yükler


exports.validateContactForm = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('contactNumber').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
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
  const errors = validationResult(req); 
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
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

    res.status(200).json({ success: true, message: "Form submitted successfully" });
  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ success: false, message: "Failed to submit form" });
  }
};
