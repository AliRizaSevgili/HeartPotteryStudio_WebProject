const mongoose = require("mongoose");

const GallerySchema = new mongoose.Schema({
  title: { type: String, required: true }, 
  description: { type: String, required: true }, 
  imageUrl: { type: String, required: true },  
  itemDate: { type: Date, default: Date.now },
  published: { type: Boolean, default: false },
});

module.exports = mongoose.model("Gallery", GallerySchema);
