const slotService = require('../services/slotService');
const Class = require('../models/Class');
const logger = require('../utils/logger');

// Sepete ürün ekleme
exports.addToCart = async (req, res) => {
  try {
    const { slotId } = req.body;
    const quantity = parseInt(req.body.quantity || 1, 10); // Quantity parametresi eklendi
    
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
    
      // Kapasite kontrolü - quantity'ye göre kontrol
    if (slot.bookedSlots + quantity > slot.totalSlots) {
      return res.status(409).render("error", {
        errorCode: 409,
        errorMessage: "Not Enough Capacity",
        errorDetail: `Sorry, only ${slot.totalSlots - slot.bookedSlots} seats available for this slot.`
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
    
    // Sepeti dizi olarak başlat (eğer yoksa)
if (!req.session.cart || !Array.isArray(req.session.cart)) {
  req.session.cart = [];
}

// Sepette aynı slot var mı kontrol et
const existingItemIndex = req.session.cart.findIndex(item => 
  item.slotId && item.slotId.toString() === slotId.toString()
);

// Geçici rezervasyon oluştur veya güncelle (quantity parametresi eklendi)
const reservation = await slotService.createTemporaryReservation(slotId, sessionId, quantity);

if (existingItemIndex !== -1) {
  // Varolan öğeyi güncelle
  req.session.cart[existingItemIndex].quantity = quantity;
  req.session.cart[existingItemIndex].reservationId = reservation._id;
  req.session.cart[existingItemIndex].reservationExpiresAt = reservation.expiresAt;
  
  logger.info(`Updated cart item with new quantity: ${quantity} for slot: ${slotId}`);
} else {
  // Sepete yeni ürünü ekle (quantity alanı eklendi)
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
    reservationExpiresAt: reservation.expiresAt,
    quantity: quantity // Quantity eklendi
  });
}

      
    
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
      
      // Kurs ve etkinlikler için görüntüleme bilgileri ekle
      cart = cart.map(item => {
        // Event tipindeki ürünler için
        if (item.type === 'event') {
          return {
            ...item, // Mevcut tüm özellikleri koru
            displayType: 'Event',
            displayTitle: item.eventTitle,
            displayImage: item.eventImage,
            displayInfo: `${item.eventDate} · ${item.eventTime}`,
            displayLocation: item.eventLocation,
            displayPrice: item.priceDisplay,
            totalPrice: item.price * (item.quantity || 1),
            formattedTotalPrice: `$${(item.price * (item.quantity || 1)).toFixed(2)}`
          };
        }
        // Kurs/slot tipindeki ürünler için - quantity eklenmiş
        return {
          ...item,
          displayType: 'Class',
          displayTitle: item.classTitle,
          displayImage: item.classImage,
          displayInfo: `${item.slotDay}, ${item.slotDate} · ${item.slotTime}`,
          displayPrice: `$${item.classPrice}`,
          totalPrice: item.classPrice * (item.quantity || 1),
          formattedTotalPrice: `$${(parseFloat(item.classPrice) * (item.quantity || 1)).toFixed(2)}`
        };
      });



            // Toplam fiyatları hesapla - quantity dikkate alınacak şekilde güncellendi
      let subtotal = 0;
      cart.forEach(item => {
        // Event tipindeki ürünler için quantity ile çarp
        if (item.type === 'event') {
          subtotal += parseFloat(item.price) * (item.quantity || 1);
        } else {
          // Normal kurslar için - quantity ile çarp
          subtotal += parseFloat(item.classPrice) * (item.quantity || 1);
        }
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
      
            // Fiyat hesaplamaları - quantity'yi dikkate alarak
      const subtotal = parseFloat(cart.classPrice) * (cart.quantity || 1);
      
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
      req.session.promoMessage = "Add items to cart before applying promo code.";
      
      // Event için yapılan alışverişlerde /events sayfasına dönülsün
      const hasEventItems = Array.isArray(req.session.cart) && 
                          req.session.cart.some(item => item.type === 'event');
      
      return res.redirect(hasEventItems ? '/events' : '/learn');
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
        // Silinecek öğeyi al
        const itemToRemove = req.session.cart[itemIndex];
        
        // Event tipinde bir ürün değilse rezervasyon iptal et
        if (!itemToRemove.type || itemToRemove.type !== 'event') {
          if (itemToRemove.reservationId) {
            try {
              await slotService.cancelReservation(itemToRemove.reservationId);
            } catch (err) {
              logger.error('Error canceling reservation:', err);
            }
          }
        }
        
        // Sepetten çıkar
        req.session.cart.splice(itemIndex, 1);
        
        return res.redirect('/checkout');
      }
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