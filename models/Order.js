const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  sessionId: String,
  email: String,
  amount: Number,
  currency: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);