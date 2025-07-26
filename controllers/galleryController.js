const galleryService = require("../services/galleryService");
const logger = require('../utils/logger');

exports.createGalleryItem = async (req, res) => {
  try {
    logger.debug("📌 Gelen Request Body (JSON):", JSON.stringify(req.body, null, 2));
    logger.debug("📌 galleryService.addItem İçin Gönderilen Veri:", {
      title,
      description,
      imageUrl,
    });


    const { title, description, imageUrl } = req.body;

    if (!title || !description || !imageUrl) {
      logger.error("❌ Eksik Alan Hatası: title, description veya imageUrl eksik!");
      return res.status(400).json({ error: "Missing required fields." });
    }

    try {
      const newGalleryItem = await galleryService.addItem({
        title,
        description,
        imageUrl,
      });

      logger.info("✅ MongoDB'ye başarıyla kaydedildi:", newGalleryItem);
      res.status(201).json(newGalleryItem);
    } catch (dbError) {
      logger.error("❌ MongoDB Kaydetme Hatası:", dbError);  // Hata detaylarını göster
      res.status(500).json({ error: `MongoDB Save Error: ${dbError.message}` });
    }
  } catch (error) {
    logger.error("❌ Sunucu Hatası:", error);  // Hata detaylarını göster
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
};
