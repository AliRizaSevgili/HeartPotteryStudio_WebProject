const ClassSlot = require('../models/ClassSlot');
const Reservation = require('../models/Reservation');
const Class = require('../models/Class');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Bir sınıf slug'ına göre tüm aktif slotları getirir
 */
async function getSlotsByClassSlug(classSlug) {
  try {
    // Önce class ID'sini bul
    const classDoc = await Class.findOne({ slug: classSlug });
    if (!classDoc) {
      throw new Error(`Class not found with slug: ${classSlug}`);
    }
    
    // Bu class ID'sine ait slotları getir (bugünden sonraki ve aktif olanlar)
    const currentDate = new Date();
    const slots = await ClassSlot.find({ 
      classId: classDoc._id, 
      isActive: true,
      startDate: { $gte: currentDate }
    }).sort({ startDate: 1 });
    
    // Slot'lara virtual alanları ekle (MongoDB'den doğrudan gelmiyor)
    const enrichedSlots = slots.map(slot => {
      const doc = slot.toObject({ virtuals: true });
      doc.availableSlots = slot.totalSlots - slot.bookedSlots;
      doc.isFull = doc.availableSlots <= 0;
      return doc;
    });
    
    logger.info(`✅ Retrieved ${enrichedSlots.length} slots for class: ${classSlug}`);
    return enrichedSlots;
  } catch (error) {
    logger.error(`❌ Error fetching slots for class: ${classSlug}`, error);
    throw error;
  }
}

/**
 * Slot ID'ye göre slot detaylarını getirir
 */
async function getSlotById(slotId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      throw new Error('Invalid slot ID format');
    }
    
    const slot = await ClassSlot.findById(slotId);
    if (!slot) {
      throw new Error(`Slot not found with ID: ${slotId}`);
    }
    
    const slotObj = slot.toObject({ virtuals: true });
    slotObj.availableSlots = slot.totalSlots - slot.bookedSlots;
    slotObj.isFull = slotObj.availableSlots <= 0;
    
    return slotObj;
  } catch (error) {
    logger.error(`❌ Error fetching slot by ID: ${slotId}`, error);
    throw error;
  }
}

/**
 * Geçici rezervasyon oluşturur
 * @param {string} slotId - Slot ID
 * @param {string} sessionId - Session ID
 * @param {number} quantity - Rezervasyon kişi sayısı (varsayılan: 1)
 */
async function createTemporaryReservation(slotId, sessionId, quantity = 1) {
  try {
    // Quantity'nin sayı olduğundan emin ol
    quantity = parseInt(quantity, 10) || 1;
    
    // İşlemi atomik olarak gerçekleştir (race condition önlemek için)
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Slot'u kontrol et ve müsait mi bak
      const slot = await ClassSlot.findById(slotId).session(session);
      
      if (!slot) {
        throw new Error(`Slot not found with ID: ${slotId}`);
      }
      
      // Quantity için kapasite kontrolü
      if (slot.bookedSlots + quantity > slot.totalSlots) {
        throw new Error(`Not enough available slots. Requested: ${quantity}, Available: ${slot.totalSlots - slot.bookedSlots}`);
      }
      
      // 2. Bu session için mevcut rezervasyon var mı kontrol et
      const existingReservation = await Reservation.findOne({
        slotId,
        sessionId,
        status: { $in: ['temporary', 'confirmed'] }
      }).session(session);
      
      if (existingReservation) {
        // Mevcut rezervasyonu güncelle - önce eski miktarı geri al
        slot.bookedSlots -= (existingReservation.quantity || 1);
        
        // Rezervasyonu güncelle
        existingReservation.quantity = quantity;
        existingReservation.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Süreyi yenile
        await existingReservation.save({ session });
        
        // Slot kapasitesini yeni quantity'ye göre ayarla
        slot.bookedSlots += quantity;
        if (slot.bookedSlots >= slot.totalSlots) {
          slot.isFull = true;
        } else {
          slot.isFull = false;
        }
        await slot.save({ session });
        
        // İşlemi tamamla
        await session.commitTransaction();
        session.endSession();
        
        logger.info(`✅ Updated temporary reservation for slot: ${slotId}, session: ${sessionId}, quantity: ${quantity}`);
        return existingReservation;
      }
      
      // 3. Yeni rezervasyon oluştur
      const reservation = new Reservation({
          slotId,
          sessionId,
          status: 'temporary',
          quantity: quantity, // Quantity değerini ekle
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 dakika geçerli
        });
              
      await reservation.save({ session });
      
      // 4. Slot'un bookedSlots sayısını quantity kadar artır
      slot.bookedSlots += quantity;
      if (slot.bookedSlots >= slot.totalSlots) {
        slot.isFull = true;
      }
      await slot.save({ session });
      
      // İşlemi tamamla
      await session.commitTransaction();
      session.endSession();
      
      logger.info(`✅ Created temporary reservation for slot: ${slotId}, session: ${sessionId}, quantity: ${quantity}`);
      return reservation;
    } catch (error) {
      // Hata durumunda işlemi geri al
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    logger.error(`❌ Error creating temporary reservation for slot: ${slotId}`, error);
    throw error;
  }
}

/**
 * Rezervasyonu onayla (ödeme sonrası)
 */
async function confirmReservation(reservationId, paymentDetails) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const reservation = await Reservation.findById(reservationId).session(session);
    
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }
    
    if (reservation.status === 'confirmed') {
      // Zaten onaylanmış, işlem yapmaya gerek yok
      await session.abortTransaction();
      session.endSession();
      return reservation;
    }
    
    if (reservation.status !== 'temporary') {
      throw new Error(`Cannot confirm reservation with status: ${reservation.status}`);
    }
    
    // Rezervasyonu güncelle
    reservation.status = 'confirmed';
    reservation.confirmedAt = new Date();
    reservation.paymentId = paymentDetails.paymentId;
    reservation.paymentStatus = paymentDetails.paymentStatus;
    reservation.stripeSessionId = paymentDetails.stripeSessionId;
    
    // Müşteri bilgilerini kaydet
    reservation.customerInfo = {
      email: paymentDetails.email,
      firstName: paymentDetails.customerInfo?.firstName,
      lastName: paymentDetails.customerInfo?.lastName,
      contactNumber: paymentDetails.customerInfo?.contactNumber
    };
    
    await reservation.save({ session });
    
    // İşlemi tamamla
    await session.commitTransaction();
    session.endSession();
    
    logger.info(`✅ Confirmed reservation: ${reservationId} with quantity: ${reservation.quantity || 1}`);
    return reservation;
  } catch (error) {
    // Hata durumunda işlemi geri al
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`❌ Error confirming reservation: ${reservationId}`, error);
    throw error;
  }
}

/**
 * Rezervasyonu iptal et
 */
async function cancelReservation(reservationId) {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const reservation = await Reservation.findById(reservationId).session(session);
      
      if (!reservation) {
        throw new Error(`Reservation not found: ${reservationId}`);
      }
      
      if (reservation.status === 'cancelled') {
        // Zaten iptal edilmiş
        await session.abortTransaction();
        session.endSession();
        return reservation;
      }
      
      // Rezervasyon durumunu güncelle
      reservation.status = 'cancelled';
      reservation.cancelledAt = new Date();
      await reservation.save({ session });
      
      // Slot'un bookedSlots sayısını quantity kadar azalt
      const slot = await ClassSlot.findById(reservation.slotId).session(session);
      if (slot) {
        // Quantity'ye göre azalt
        slot.bookedSlots -= (reservation.quantity || 1);
        if (slot.bookedSlots < 0) slot.bookedSlots = 0; // Negatif değer olmamasını sağla
        
        // isFull değerini güncelle
        if (slot.bookedSlots < slot.totalSlots) {
          slot.isFull = false;
        }
        
        await slot.save({ session });
      }
      
      await session.commitTransaction();
      session.endSession();
      
      logger.info(`✅ Cancelled reservation: ${reservationId} with quantity: ${reservation.quantity || 1}`);
      return reservation;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    logger.error(`❌ Error cancelling reservation: ${reservationId}`, error);
    throw error;
  }
}

/**
 * Süresi dolan geçici rezervasyonları temizle
 */
async function cleanupExpiredReservations() {
  try {
    const currentTime = new Date();
    
    // Süresi dolmuş ve geçici durumda olan rezervasyonları bul
    const expiredReservations = await Reservation.find({
      status: 'temporary',
      expiresAt: { $lt: currentTime }
    });
    
    logger.info(`Found ${expiredReservations.length} expired reservations to clean up`);
    
    // Her biri için işlem yap
    for (const reservation of expiredReservations) {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Rezervasyon durumunu güncelle
        reservation.status = 'expired';
        await reservation.save({ session });
        
        // Slot'un bookedSlots sayısını quantity kadar azalt
        const slot = await ClassSlot.findById(reservation.slotId).session(session);
        if (slot && slot.bookedSlots > 0) {
          // Quantity'ye göre azalt
          slot.bookedSlots -= (reservation.quantity || 1);
          if (slot.bookedSlots < 0) slot.bookedSlots = 0; // Negatif değer olmamasını sağla
          
          // isFull değerini güncelle
          if (slot.bookedSlots < slot.totalSlots) {
            slot.isFull = false;
          }
          
          await slot.save({ session });
        }
        
        await session.commitTransaction();
        session.endSession();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`Error processing expired reservation: ${reservation._id}`, error);
      }
    }
    
    logger.info(`✅ Cleaned up ${expiredReservations.length} expired reservations`);
    return expiredReservations.length;
  } catch (error) {
    logger.error('❌ Error cleaning up expired reservations', error);
    throw error;
  }
}

module.exports = {
  getSlotsByClassSlug,
  getSlotById,
  createTemporaryReservation,
  confirmReservation,
  cancelReservation,
  cleanupExpiredReservations
};