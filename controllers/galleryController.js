const galleryService = require("../services/galleryService");

exports.createGalleryItem = async (req, res) => {
  try {
    console.log("📌 Gelen Request Body (JSON):", JSON.stringify(req.body, null, 2));
    console.log("📌 galleryService.addItem İçin Gönderilen Veri:", {
      title,
      description,
      imageUrl,
    });


    const { title, description, imageUrl } = req.body;

    if (!title || !description || !imageUrl) {
      console.error("❌ Eksik Alan Hatası: title, description veya imageUrl eksik!");
      return res.status(400).json({ error: "Missing required fields." });
    }

    try {
      const newGalleryItem = await galleryService.addItem({
        title,
        description,
        imageUrl,
      });

      console.log("✅ MongoDB'ye başarıyla kaydedildi:", newGalleryItem);
      res.status(201).json(newGalleryItem);
    } catch (dbError) {
      console.error("❌ MongoDB Kaydetme Hatası:", dbError);  // Hata detaylarını göster
      res.status(500).json({ error: `MongoDB Save Error: ${dbError.message}` });
    }
  } catch (error) {
    console.error("❌ Sunucu Hatası:", error);  // Hata detaylarını göster
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
};
