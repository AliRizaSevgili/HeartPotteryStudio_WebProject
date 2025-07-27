const mongoose = require('mongoose');

const ClassSlotSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  time: {
    start: String,  // "6:00 PM"
    end: String     // "8:00 PM"
  },
  dayOfWeek: String, // "Monday", "Tuesday", etc.
  label: String,     // "Monday April 7 – April 28"
  totalSlots: {
    type: Number,
    default: 8
  },
  bookedSlots: {
    type: Number,
    default: 0
  },
  // Slot dolu mu?
  isFull: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // createdAt ve updatedAt ekler
});

// Kullanılabilir slot sayısını hesapla
ClassSlotSchema.virtual('availableSlots').get(function() {
  return this.totalSlots - this.bookedSlots;
});

// Her kayıt öncesi isFull değerini güncelle
ClassSlotSchema.pre('save', function(next) {
  if (this.bookedSlots >= this.totalSlots) {
    this.isFull = true;
  } else {
    this.isFull = false;
  }
  next();
});

module.exports = mongoose.model('ClassSlot', ClassSlotSchema);