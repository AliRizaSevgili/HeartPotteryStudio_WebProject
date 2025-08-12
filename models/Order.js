const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  // İlişkilendirme
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  
  // Müşteri bilgileri
  customerInfo: {
    firstName: String,
    lastName: String,
    email: {
      type: String,
      required: true,
      trim: true
    },
    contactNumber: String,
    company: String,
    address: String
  },
  
  // Ödeme bilgileri
  paymentDetails: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'cad'
    },
    paymentId: String,
    sessionId: String,
    paymentMethod: {
      type: String,
      default: 'stripe'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  
  // Ürün bilgileri
  productName: String,
  
  // Tarih bilgileri
  orderNumber: {
    type: String,
    unique: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Sipariş numarası oluşturma (pre-save hook)
OrderSchema.pre('save', function(next) {
  if (this.isNew) {
    // YYYYMMDD-XXXX formatında sipariş numarası
    const date = new Date();
    const dateStr = date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    
    const randomStr = Math.floor(1000 + Math.random() * 9000); // 4 basamaklı sayı
    this.orderNumber = `${dateStr}-${randomStr}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);

