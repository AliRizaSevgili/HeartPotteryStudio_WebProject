const express = require("express");
const router = express.Router();
const Info = require("../models/Info");
const nodemailer = require("nodemailer");

router.post("/checkout-info", async (req, res) => {
  try {
    console.log("Request body:", req.body); // Gelen verileri logla
    const { email, firstName, lastName, company, contactNumber, address } = req.body;

    // `email` alanını düzelt
    const validEmail = Array.isArray(email) ? email.find((e) => e.trim() !== "") : email;

    if (!validEmail) {
      throw new Error("Invalid email address.");
    }

    // Yeni bilgi oluştur
    const info = new Info({
      email: validEmail,
      firstName,
      lastName,
      company,
      contactNumber,
      address,
    });

    // Veritabanına kaydet
    await info.save().catch((err) => {
      console.error("Database save error:", err);
      throw new Error("Failed to save info to the database.");
    });

    // E-posta gönderimi
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Alıcı adresi olarak EMAIL_USER kullanılıyor
      subject: "New Info Form Submission",
      text: `New info form submitted:\n\nName: ${firstName} ${lastName}\nCompany: ${company || "N/A"}\nEmail: ${validEmail}\nPhone: ${contactNumber}\nAddress: ${address}`,
    };

    await transporter.sendMail(mailOptions).catch((err) => {
      console.error("Email send error:", err);
      throw new Error("Failed to send email.");
    });

    res.status(200).json({ message: "Info submitted successfully!" });
  } catch (error) {
    console.error("Error processing /checkout-info:", error);
    res.status(500).json({ message: "An error occurred." });
  }
});

module.exports = router;
