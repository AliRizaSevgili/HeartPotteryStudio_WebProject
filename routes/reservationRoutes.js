const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const logger = require('../utils/logger');
const slotService = require('../services/slotService');
const Class = require('../models/Class');
const ClassSlot = require('../models/ClassSlot');

/**
 * Rezervasyon token'ı doğrulama middleware
 */
const validateReservationToken = (req, res, next) => {
  // Sadece rezervasyon token'ı session'da varsa kontrol et
  if (req.session.reservationToken) {
    const { reservationToken } = req.body;
    
    if (!reservationToken || reservationToken !== req.session.reservationToken) {
      logger.warn('Invalid reservation token');
      return res.status(403).render("error", {
        errorCode: 403,
        errorMessage: "Invalid Request",
        errorDetail: "Please try again from the reservation page."
      });
    }
  }
  
  next();
};

/**
 * Slot rezervasyonu başlatma - POST /reserve-slot
 * Kullanıcı bir slot seçtiğinde çağrılır
 */
router.post('/reserve-slot', csrfProtection, async (req, res) => {
  try {
    const { slotId } = req.body;
    logger.info(`Starting slot reservation for slotId: ${slotId}`);
    logger.info(`Session ID: ${req.session.id}`);
    
    if (!slotId) {
      return res.status(400).json({ success: false, message: 'No slot ID provided' });
    }
    
    // Slot bilgisini getir
    const slot = await slotService.getSlotById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    
    // Slot dolu mu kontrol et
    if (slot.isFull) {
      return res.status(400).json({ success: false, message: 'Slot is fully booked' });
    }
    
    // İlgili sınıf bilgisini getir
    const classInfo = await Class.findById(slot.classId).lean();
    if (!classInfo) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    
    // Geçici rezervasyon oluştur
    const reservationId = await slotService.createReservation(slotId, {
      sessionId: req.session.id,
      status: 'temporary'
    });
    
    logger.info(`Created temporary reservation: ${reservationId}`);
    
    // Seçilen slot'u session'a kaydet (ileride kullanmak için)
    req.session.reservationSlotId = slotId;
    
    // Sepeti güncelle - Hem nesne formatında (yeni) hem de dizi formatında (eski, uyumluluk için)
    // Yeni nesne formatı
    req.session.cart = {
      classId: classInfo._id.toString(),
      classTitle: classInfo.title,
      classImage: classInfo.imageUrl,
      classPrice: classInfo.price.toFixed(2),
      slotId: slot._id.toString(),
      slotDate: new Date(slot.startDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      slotTime: new Date(slot.startDate).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      reservationId: reservationId
    };
    
    logger.info(`Updated cart with new format`);
    
    // Başarılı yanıt
    res.status(200).json({
      success: true,
      message: 'Slot reserved successfully',
      redirectUrl: '/reservation'
    });
    
  } catch (error) {
    logger.error('Error in reserve-slot route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reserve slot'
    });
  }
});

/**
 * Rezervasyon sayfası - GET /reservation
 * Kullanıcı slot seçtikten sonra, ödeme öncesi adım
 */
router.get('/reservation', async (req, res) => {
  try {
    // Rezervasyon yoksa ana sayfaya yönlendir
    if (!req.session.reservationSlotId || !req.session.cart) {
      return res.redirect('/learn');
    }
    
    // checkout.hbs şablonuyla görüntüle - özelleştirilmiş rezervasyon sayfası
    res.render('checkout', {
      layout: 'layouts/main',
      title: 'Complete Your Reservation',
      cart: req.session.cart,
      reservationToken: req.session.reservationToken,
      promo: req.session.promo || null,
      promoMessage: req.session.promoMessage || null,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    logger.error('Error in reservation page route:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
});

/**
 * Promo kod uygulama - POST /apply-promo
 */
router.post('/apply-promo', csrfProtection, validateReservationToken, async (req, res) => {
  try {
    const { promo } = req.body;
    
    // Sepet yoksa hata ver
    if (!req.session.cart) {
      return res.redirect('/learn');
    }
    
    // Promo kodu kontrolü (basit örnek)
    const promoCodes = {
      'WELCOME10': { discount: 0.10, message: '10% discount applied!' },
      'POTTERY20': { discount: 0.20, message: '20% discount applied!' },
      'SUMMER25': { discount: 0.25, message: '25% summer discount applied!' },
      'FRIEND15': { discount: 0.15, message: '15% friend discount applied!' }
    };
    
    // Promo kod geçerli mi kontrol et
    if (promo && promoCodes[promo.toUpperCase()]) {
      req.session.promo = {
        code: promo.toUpperCase(),
        discount: promoCodes[promo.toUpperCase()].discount
      };
      req.session.promoMessage = promoCodes[promo.toUpperCase()].message;
    } else {
      req.session.promo = null;
      req.session.promoMessage = promo ? 'Invalid promo code' : null;
    }
    
    // Kullanıcıyı rezervasyon sayfasına yönlendir
    return res.redirect('/reservation');
    
  } catch (error) {
    logger.error('Error applying promo code:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong while applying the promo code."
    });
  }
});

/**
 * Rezervasyon iptal - POST /cancel-reservation
 */
router.post('/cancel-reservation', csrfProtection, async (req, res) => {
  try {
    // Rezervasyon varsa iptal et
    if (req.session.cart && req.session.cart.reservationId) {
      const reservationId = req.session.cart.reservationId;
      await slotService.cancelReservation(reservationId);
      logger.info(`Cancelled reservation: ${reservationId}`);
    }
    
    // Sepeti ve promo bilgilerini temizle
    delete req.session.cart;
    delete req.session.reservationSlotId;
    delete req.session.promo;
    delete req.session.promoMessage;
    
    // Kullanıcıyı sınıflar sayfasına yönlendir
    res.redirect('/learn');
    
  } catch (error) {
    logger.error('Error cancelling reservation:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong while cancelling your reservation."
    });
  }
});

/**
 * Slot müsaitlik durumu API'si - GET /api/slots/:slotId
 */
router.get('/api/slots/:slotId', async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await slotService.getSlotById(slotId);
    
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    
    res.json({
      success: true,
      slot: {
        id: slot._id,
        availableSlots: slot.availableSlots,
        isFull: slot.isFull,
        startDate: slot.startDate,
        endDate: slot.endDate
      }
    });
  } catch (error) {
    logger.error('Error fetching slot status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;