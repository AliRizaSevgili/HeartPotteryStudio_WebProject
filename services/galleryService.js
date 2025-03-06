const Gallery = require("../models/Gallery");

async function addItem(data) {
  try {
    console.log("📌 MongoDB'ye Kaydedilecek Veri:", JSON.stringify(data, null, 2));
    const newGalleryItem = new Gallery(data);
    return await newGalleryItem.save();
  } catch (error) {
    console.error("❌ MongoDB Kaydetme Hatası:", error);
    throw new Error(`MongoDB Save Error: ${error.message}`);
  }
}

module.exports = {
  addItem,
};
