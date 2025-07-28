const slotService = require('../services/slotService');
const Class = require('../models/Class');
const logger = require('../utils/logger');

// Sepete ürün ekleme
exports.addToCart = async (req, res) => {
  try {
    const { slotId } = req.body;
    
    if (!slotId) {
      return res.status(400).render("error", {
        errorCode: 400,
        errorMessage: "Bad Request",
        errorDetail: "Slot ID is required."
      });
    }
    
    // Session ID'yi al veya oluştur
    const sessionId = req.session.id;
    
    // Slot bilgilerini getir
    const slot = await slotService.getSlotById(slotId);
    
    if (!slot) {
      return res.status(404).render("error", {
        errorCode: 404,
        errorMessage: "Slot Not Found",
        errorDetail: "The selected slot is not available."
      });
    }
    
    // Slot dolu mu kontrol et - virtual property olarak kontrol et
    if (slot.bookedSlots >= slot.totalSlots) {
      return res.status(409).render("error", {
        errorCode: 409,
        errorMessage: "Slot Full",
        errorDetail: "Sorry, this slot is already fully booked."
      });
    }
    
    // Kurs bilgilerini getir
    const classItem = await Class.findById(slot.classId);
    
    if (!classItem) {
      return res.status(404).render("error", {
        errorCode: 404,
        errorMessage: "Class Not Found",
        errorDetail: "The selected class is not available."
      });
    }
    
    // Geçici rezervasyon oluştur
    const reservation = await slotService.createTemporaryReservation(slotId, sessionId);
    
    // Sepet bilgilerini session'a kaydet
    req.session.cart = {
      classId: classItem._id,
      classSlug: classItem.slug,
      classTitle: classItem.title,
      classImage: classItem.image,
      classPrice: classItem.price.value,
      slotId: slot._id,
      slotDay: slot.dayOfWeek,
      slotDate: new Date(slot.startDate).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      slotTime: `${slot.time.start} – ${slot.time.end}`,
      reservationId: reservation._id,
      reservationExpiresAt: reservation.expiresAt
    };
    
    // Yeni ürün eklenince promo kodunu sıfırla
    req.session.promo = null;
    req.session.promoMessage = null;
    
    // Rezervasyon sayfasına yönlendir
    res.redirect('/reservation');
  } catch (error) {
    logger.error(`Error adding slot to cart: ${req.body.slotId}`, error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
};

// Sepeti görüntüle / Checkout
exports.viewCart = async (req, res) => {
  try {
    // Sepette ürün var mı kontrol et
    if (!req.session.cart) {
      return res.redirect('/learn');
    }
    
    const cart = req.session.cart;
    
    // Rezervasyon hala geçerli mi kontrol et
    const now = new Date();
    const expiresAt = new Date(cart.reservationExpiresAt);
    
    if (now > expiresAt) {
      // Rezervasyon süresi dolmuş, sepeti temizle
      delete req.session.cart;
      
      return res.render("cart-expired", {
        layout: "layouts/main",
        title: "Reservation Expired"
      });
    }
    
    // Kalan süreyi hesapla (dakika cinsinden)
    const remainingTime = Math.max(0, Math.floor((expiresAt - now) / 60000));
    
    // HST vergi oranı (%13)
    const taxRate = 0.13;
    const subtotal = cart.classPrice;
    
    // Promo kodu kontrolü
    const promo = req.session.promo || null;
    const promoMessage = req.session.promoMessage || null;
    
    // Promo kodu varsa indirim uygula
    let discountedSubtotal = subtotal;
    if (promo && promo.discount) {
      discountedSubtotal = subtotal * (1 - promo.discount);
    }
    
    // Tax hesapla
    const tax = discountedSubtotal * taxRate;
    const total = discountedSubtotal + tax;
    
    // Reservation.hbs şablonunu render et
    res.render("checkout", {
      layout: "layouts/main",
      title: "Complete Your Reservation",
      cart,
      remainingTime,
      promo,
      promoMessage,
      priceDetails: {
        subtotal: subtotal.toFixed(2),
        discountedSubtotal: discountedSubtotal.toFixed(2),
        discountAmount: (subtotal - discountedSubtotal).toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2)
      },
      step: 'cart', // Eklenen adım bilgisi
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    logger.error('Error viewing cart:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
};

// Sepetten ürün çıkar
exports.removeFromCart = async (req, res) => {
  try {
    // Sepette ürün var mı kontrol et
    if (!req.session.cart) {
      return res.redirect('/learn');
    }
    
    const { reservationId } = req.session.cart;
    
    // Rezervasyonu iptal et
    await slotService.cancelReservation(reservationId);
    
    // Sepeti temizle
    delete req.session.cart;
    req.session.promo = null;
    req.session.promoMessage = null;
    
    res.redirect('/learn');
  } catch (error) {
    logger.error('Error removing from cart:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
};

// Promo kodu uygula
exports.applyPromoCode = async (req, res) => {
  try {
    const { promo } = req.body;
    const validCode = "HEART10";
    const discount = 0.10; // %10 indirim

    // Sepette ürün var mı kontrol et
    if (!req.session.cart) {
      req.session.promoMessage = "Add items to cart before applying promo code.";
      return res.redirect('/reservation');
    }
    
    // Kod doğruysa session'a indirim bilgisini ekle
    if (promo && promo.trim().toUpperCase() === validCode) {
      req.session.promo = { code: promo, discount };
      req.session.promoMessage = "Promo code applied! 10% discount.";
    } else {
      req.session.promo = null;
      req.session.promoMessage = "Invalid promo code.";
    }
    
    res.redirect('/reservation');
  } catch (error) {
    logger.error('Error applying promo code:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
};

module.exports = exports;