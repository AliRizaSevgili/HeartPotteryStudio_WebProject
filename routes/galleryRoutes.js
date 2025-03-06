const express = require("express");
const router = express.Router();
const galleryService = require("../services/galleryService");
const { upload } = require("../config/cloudinary"); // Cloudinary yükleme ayarlarını ekle

// Route to get all gallery items (no filtering)
router.get("/", async (req, res) => {
  console.log("📥 GET request received at /api/gallery");
  try {
    const items = await galleryService.getAllItems();
    console.log("📌 Items sent to client:", items); 
    res.json(items);
  } catch (err) {
    console.error("❌ Error fetching gallery items:", err.message);
    res.status(500).json({ error: "Error loading items" });
  }
});

// Route to add a new gallery item with image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description || !req.file) {
      return res.status(400).json({ error: "Title, description, and image are required." });
    }

    // Cloudinary tarafından dönen dosya URL'sini al
    const imageUrl = req.file.path;

    // Yeni öğeyi oluştur ve kaydet
    const newItem = await galleryService.addItem({
      title,
      description,
      imageUrl
    });

    res.status(201).json(newItem);
  } catch (err) {
    console.error("❌ Error adding gallery item:", err.message);
    res.status(500).json({ error: "Unable to create item." });
  }
});

module.exports = router;
