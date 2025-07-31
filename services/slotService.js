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
 */
async function createTemporaryReservation(slotId, sessionId) {
  try {
    // İşlemi atomik olarak gerçekleştir (race condition önlemek için)
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Slot'u kontrol et ve müsait mi bak
      const slot = await ClassSlot.findById(slotId).session(session);
      
      if (!slot) {
        throw new Error(`Slot not found with ID: ${slotId}`);
      }
      
      if (slot.bookedSlots >= slot.totalSlots) {
        throw new Error(`Slot is already full: ${slotId}`);
      }
      
      // 2. Bu session için mevcut rezervasyon var mı kontrol et
      const existingReservation = await Reservation.findOne({
        slotId,
        sessionId,
        status: { $in: ['temporary', 'confirmed'] }
      }).session(session);
      
      if (existingReservation) {
        // Zaten rezervasyon var, güncel rezervasyonu döndür
        await session.abortTransaction();
        session.endSession();
        return existingReservation;
      }
      
      // 3. Yeni rezervasyon oluştur
      const reservation = new Reservation({
          slotId,
          sessionId,
          status: 'temporary',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 dakika geçerli
        });;
              
      await reservation.save({ session });
      
      // 4. Slot'un bookedSlots sayısını artır
      slot.bookedSlots += 1;
      await slot.save({ session });
      
      // İşlemi tamamla
      await session.commitTransaction();
      session.endSession();
      
      logger.info(`✅ Created temporary reservation for slot: ${slotId}, session: ${sessionId}`);
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
  try {
    const reservation = await Reservation.findById(reservationId);
    
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }
    
    if (reservation.status !== 'temporary') {
      throw new Error(`Cannot confirm reservation with status: ${reservation.status}`);
    }
    
    reservation.status = 'confirmed';
    reservation.confirmedAt = new Date();
    reservation.stripeSessionId = paymentDetails.stripeSessionId;
    reservation.customerInfo = paymentDetails.customerInfo;
    
    await reservation.save();
    
    logger.info(`✅ Confirmed reservation: ${reservationId}`);
    return reservation;
  } catch (error) {
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
      
      // Slot'un bookedSlots sayısını azalt
      const slot = await ClassSlot.findById(reservation.slotId).session(session);
      if (slot && slot.bookedSlots > 0) {
        slot.bookedSlots -= 1;
        await slot.save({ session });
      }
      
      await session.commitTransaction();
      session.endSession();
      
      logger.info(`✅ Cancelled reservation: ${reservationId}`);
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
        
        // Slot'un bookedSlots sayısını azalt
        const slot = await ClassSlot.findById(reservation.slotId).session(session);
        if (slot && slot.bookedSlots > 0) {
          slot.bookedSlots -= 1;
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