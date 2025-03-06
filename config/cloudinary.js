const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary için dosya depolama ayarı
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "heartpottery_gallery",  // Cloudinary'de oluşturulacak klasör adı
    allowed_formats: ["jpg", "png", "jpeg", "webp", "pdf"]

  }
});

// Multer yapılandırması
const upload = multer({ storage });

module.exports = { upload, cloudinary };
