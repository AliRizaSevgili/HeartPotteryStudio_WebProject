const mongoose = require("mongoose");
const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.CONTACT_ENCRYPTION_KEY || "default_32_byte_key_123456789012345"; // 32 karakter olmalı!
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  if (!text) return "";
  try {
    const parts = text.split(":");
    if (parts.length !== 2) return text; // Şifrelenmemişse düz döndür
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return text; // Hatalıysa düz döndür
  }
}

// AES şifreleme ile email ve contactNumber alanları için set/get fonksiyonları var.
// Şema tanımı:
const ContactSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    company: String,
    email: {
      type: String,
      set: encrypt,
      get: decrypt,
    },
    contactNumber: {
      type: String,
      set: encrypt,
      get: decrypt,
    },
    message: String,
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

module.exports = mongoose.model("Contact", ContactSchema);
