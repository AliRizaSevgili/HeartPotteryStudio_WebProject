const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSlot',
    required: true
  },
  sessionId: String,  // Browser session ID
  stripeSessionId: String, // Stripe session ID
  status: {
    type: String,
    enum: ['temporary', 'confirmed', 'cancelled', 'expired'],
    default: 'temporary'
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  // YENİ ALAN: Quantity (kişi sayısı)
  quantity: {
    type: Number,
    default: 1,
    min: 1,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // 15 dakika sonra sona erer
      return new Date(Date.now() + 15 * 60 * 1000);
    }
  },
  confirmedAt: Date,
  cancelledAt: Date
});

// Rezervasyon hala geçerli mi?
ReservationSchema.virtual('isValid').get(function() {
  return this.status === 'temporary' && new Date() < this.expiresAt;
});

module.exports = mongoose.model('Reservation', ReservationSchema);