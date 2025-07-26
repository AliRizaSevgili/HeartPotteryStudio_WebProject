const Gallery = require("../models/Gallery");
const logger = require('../utils/logger');

async function addItem(data) {
  try {
    logger.debug("📌 MongoDB'ye Kaydedilecek Veri:", JSON.stringify(data, null, 2));
    const newGalleryItem = new Gallery(data);
    return await newGalleryItem.save();
  } catch (error) {
    logger.error("❌ MongoDB Kaydetme Hatası:", error);
    throw new Error(`MongoDB Save Error: ${error.message}`);
  }
}

module.exports = {
  addItem,
};
