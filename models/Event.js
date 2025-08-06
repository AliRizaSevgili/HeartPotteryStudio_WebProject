// models/Event.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  date: Date, // Etkinlik tarihi
  time: {
    start: String,
    end: String
  },
  location: String,
  price: {
    value: Number,
    currency: {
      type: String,
      default: 'CAD'
    },
    display: String
  },
  image: String,
  totalSlots: {
    type: Number,
    default: 20
  },
  bookedSlots: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);