const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
// Auth middleware şimdilik kaldırıldı
// const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");

// Genel Routes
// Ana class listesi sayfası
router.get("/", classController.showAllClasses);

// Class kategori filtreleme
router.get("/category/:category", classController.showClassesByCategory);

// Arama işlemi
router.get("/search", classController.searchClasses);

// Dinamik class detay sayfası
router.get("/:slug", classController.showClassBySlug);

// Admin Routes şimdilik kaldırıldı
/*
// Yeni class oluşturma
router.post("/", isAuthenticated, isAdmin, classController.createClass);

// Class güncelleme
router.put("/:id", isAuthenticated, isAdmin, classController.updateClass);

// Class silme
router.delete("/:id", isAuthenticated, isAdmin, classController.deleteClass);
*/

module.exports = router;