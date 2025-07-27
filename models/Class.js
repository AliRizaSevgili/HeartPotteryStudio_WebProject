const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  intro: [String],
  details: [String],
  price: {
    value: Number,  // 295, 535, 70 gibi sayısal değer
    currency: {
      type: String,
      default: 'CAD'
    },
    display: String  // "$295 + tax" gibi gösterim formatı
  },
  image: String,
  included: [String],
  pickupInfo: String,
  notes: [String],
  classRefund: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Class', ClassSchema);