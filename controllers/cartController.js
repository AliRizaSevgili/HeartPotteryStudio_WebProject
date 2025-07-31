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
    
        // Sepeti dizi olarak başlat (eğer yoksa)
      if (!req.session.cart || !Array.isArray(req.session.cart)) {
        req.session.cart = [];
      }

      // Sepete yeni ürünü ekle
      req.session.cart.push({
        cartItemId: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Benzersiz ID
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
      });
    
    // Yeni ürün eklenince promo kodunu sıfırla
    req.session.promo = null;
    req.session.promoMessage = null;
    
    // Checkout sayfasına yönlendir
      res.redirect('/checkout');
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
    
    let cart = req.session.cart;
    let hasExpiredItems = false;
    let remainingTime = 30; // Varsayılan değer
    
    // HST vergi oranı (%13)
    const taxRate = 0.13;
    
    // Promo kodu kontrolü
    const promo = req.session.promo || null;
    const promoMessage = req.session.promoMessage || null;
    
    // Sepet bir dizi mi kontrol et
    if (Array.isArray(cart)) {
      // Sepet dizi formatında
      const now = new Date();
      
      // Süresi dolmuş öğeleri kontrol et
      hasExpiredItems = cart.some(item => {
        if (!item.reservationExpiresAt) return false;
        const expiresAt = new Date(item.reservationExpiresAt);
        return now > expiresAt;
      });
      
      if (hasExpiredItems) {
        // Süresi dolmuş öğeleri çıkar
        cart = cart.filter(item => {
          if (!item.reservationExpiresAt) return true;
          const expiresAt = new Date(item.reservationExpiresAt);
          const isValid = now <= expiresAt;
          
          if (!isValid && item.reservationId) {
            // Rezervasyonu iptal et
            try {
              slotService.cancelReservation(item.reservationId);
            } catch (err) {
              logger.error('Error canceling reservation:', err);
            }
          }
          
          return isValid;
        });
        
        // Sepeti güncelle
        req.session.cart = cart;
        
        // Sepet boşsa promo kodunu sıfırla
        if (cart.length === 0) {
          req.session.promo = null;
          req.session.promoMessage = null;
          return res.redirect('/learn');
        }
      }
      
      // En yakın süre dolma zamanını hesapla
      if (cart.length > 0 && cart[0].reservationExpiresAt) {
        const now = new Date();
        const expiresAt = new Date(cart[0].reservationExpiresAt);
        remainingTime = Math.max(0, Math.floor((expiresAt - now) / 60000));
      }
      
      // Toplam fiyatları hesapla
      let subtotal = 0;
      cart.forEach(item => {
        subtotal += parseFloat(item.classPrice);
      });
      
      // Promo kodu varsa indirim uygula
      let discountedSubtotal = subtotal;
      if (promo && promo.discount) {
        discountedSubtotal = subtotal * (1 - promo.discount);
      }
      
      // Tax ve toplam hesapla
      const tax = discountedSubtotal * taxRate;
      const total = discountedSubtotal + tax;
      
      const priceDetails = {
        subtotal: subtotal.toFixed(2),
        discountedSubtotal: discountedSubtotal.toFixed(2),
        discountAmount: (subtotal - discountedSubtotal).toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2)
      };
      
      // Checkout sayfasını render et
        return res.render("checkout", {
          layout: "layouts/main",
          title: "Complete Your Reservation",
          cart,
          remainingTime,
          promo,
          promoMessage,
          priceDetails,
          step: 'cart',
          lastVisitedClass: '/learn',
          csrfToken: req.csrfToken()
        });
    } 
    // Tek nesne formatında sepet
    else {
      // Eski rezervasyon süresi kontrolü
      const now = new Date();
      const expiresAt = cart.reservationExpiresAt ? new Date(cart.reservationExpiresAt) : null;
      
      if (expiresAt && now > expiresAt) {
        // Süresi dolmuş, rezervasyonu iptal et
        if (cart.reservationId) {
          try {
            slotService.cancelReservation(cart.reservationId);
          } catch (err) {
            logger.error('Error canceling reservation:', err);
          }
        }
        
        // Sepeti temizle
        delete req.session.cart;
        req.session.promo = null;
        req.session.promoMessage = null;
        
        return res.redirect('/learn');
      }
      
      // Kalan süreyi hesapla
      if (expiresAt) {
        remainingTime = Math.max(0, Math.floor((expiresAt - now) / 60000));
      }
      
      // Fiyat hesaplamaları
      const subtotal = parseFloat(cart.classPrice);
      
      // Promo kodu varsa indirim uygula
      let discountedSubtotal = subtotal;
      if (promo && promo.discount) {
        discountedSubtotal = subtotal * (1 - promo.discount);
      }
      
      // Tax ve toplam hesapla
      const tax = discountedSubtotal * taxRate;
      const total = discountedSubtotal + tax;
      
      const priceDetails = {
        subtotal: subtotal.toFixed(2),
        discountedSubtotal: discountedSubtotal.toFixed(2),
        discountAmount: (subtotal - discountedSubtotal).toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2)
      };
      
      // Checkout sayfasını render et
        return res.render("checkout", {
          layout: "layouts/main",
          title: "Complete Your Reservation",
          cart,
          remainingTime,
          promo,
          promoMessage,
          priceDetails,
          step: 'cart',
          lastVisitedClass: '/learn',
          csrfToken: req.csrfToken()
        });
    }
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
    
    const { cartItemId } = req.body;
    
    // Sepet bir dizi mi kontrol et
      if (Array.isArray(req.session.cart)) {
        
        
        // Kaldırılacak öğeyi bul (cartItemId ile)
        const itemIndex = req.session.cart.findIndex(item => 
          item.cartItemId === cartItemId
        );
        
        console.log("FOUND ITEM INDEX:", itemIndex);
      
      if (itemIndex !== -1) {
        // Rezervasyonu iptal et
        const itemToRemove = req.session.cart[itemIndex];
        if (itemToRemove.reservationId) {
          try {
            await slotService.cancelReservation(itemToRemove.reservationId);
          } catch (err) {
            logger.error('Error canceling reservation:', err);
          }
        }
        
        // Sepetten çıkar
        req.session.cart.splice(itemIndex, 1);
        
        // Sepet boşalırsa promo kodunu sıfırla
        if (req.session.cart.length === 0) {
          req.session.promo = null;
          req.session.promoMessage = null;
        }
      }
      
      return res.redirect('/checkout');
    }
    // Eski format sepet (nesne)
    else {
      const { reservationId } = req.session.cart;
      
      // Rezervasyonu iptal et
      if (reservationId) {
        await slotService.cancelReservation(reservationId);
      }
      
      // Sepeti temizle
      delete req.session.cart;
      req.session.promo = null;
      req.session.promoMessage = null;
      
      return res.redirect('/learn');
    }
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
    
    res.redirect('/checkout');
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