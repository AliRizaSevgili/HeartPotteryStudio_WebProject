


const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");

// Dinamik class detay sayfası
router.get("/:slug", classController.showClassBySlug);

module.exports = router;
