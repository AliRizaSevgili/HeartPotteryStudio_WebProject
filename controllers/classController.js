const Class = require('../models/Class');
const slotService = require('../services/slotService');
const logger = require('../utils/logger');


exports.showClassBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Veritabanından kurs bilgilerini çek
    const classItem = await Class.findOne({ slug, isActive: true });
    
    if (!classItem) {
      return res.status(404).render("error", {
        errorCode: 404,
        errorMessage: "Oops! Not Found",
        errorDetail: "The class you're looking for doesn't exist or has been removed."
      });
    }
    
    // Bu kurs için slot bilgilerini getir
    const allSlots = await slotService.getSlotsByClassSlug(slug);
    
    // Slotları aylara göre grupla
    const groupedSlots = {};
    
    allSlots.forEach(slot => {
      const startDate = new Date(slot.startDate);
      const month = startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groupedSlots[month]) {
        groupedSlots[month] = [];
      }
      
      groupedSlots[month].push({
        id: slot._id,
        label: slot.label,
        availableSlots: slot.totalSlots - slot.bookedSlots,
        isFull: (slot.totalSlots - slot.bookedSlots) <= 0,
        slots: [{
          day: slot.dayOfWeek,
          date: startDate.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          time: `${slot.time.start} – ${slot.time.end}`
        }]
      });
    });
    
    // Her bir ayın tüm slotlarını gönder (aprilDates, mayDates, vb.)
    const dateData = {};
    Object.keys(groupedSlots).forEach(month => {
      const monthName = month.split(' ')[0].toLowerCase() + 'Dates';
      dateData[monthName] = groupedSlots[month];
    });
    
    res.render("class-details", {
      layout: "layouts/main",
      title: classItem.title,
      classItem: {
        slug: classItem.slug,
        title: classItem.title,
        date: "Various dates available",
        image: classItem.image,
        description: classItem.description,
        intro: classItem.intro,
        details: classItem.details,
        price: classItem.price.display,
        included: classItem.included,
        pickupInfo: classItem.pickupInfo,
        notes: classItem.notes,
        classRefund: classItem.classRefund
      },
      ...dateData
    });
  } catch (error) {
    logger.error(`Error fetching class by slug: ${req.params.slug}`, error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
};

// Arama işlemi
exports.searchClasses = async (req, res) => {
  try {
    const { query } = req.query;
    
    // Arama sorgusu için filtreleme yap
    const searchFilter = query ? {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    } : { isActive: true };
    
    const classes = await Class.find(searchFilter);
    
    res.render("class-list", {
      layout: "layouts/main",
      title: "Search Results",
      searchQuery: query,
      classes,
      activeClasses: true
    });
  } catch (error) {
    logger.error(`Error searching classes: ${req.query.query}`, error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
};

// Tüm kursları göster (ana sayfa)
exports.showAllClasses = async (req, res) => {
  try {
    // Veritabanından aktif kursları çek
    const classes = await Class.find({ isActive: true });
    
    // Her kurs için mevcut slot bilgilerini ekle
    const classesWithSlotInfo = await Promise.all(classes.map(async (classItem) => {
      const classObj = classItem.toObject();
      
      // Bu kurs için slotları getir
      const slots = await slotService.getSlotsByClassSlug(classItem.slug);
      
      // Slot istatistiklerini hesapla
      const totalAvailableSlots = slots.reduce((total, slot) => 
        total + (slot.totalSlots - slot.bookedSlots), 0);
      
      // En yakın slot tarihini bul
      const upcomingSlots = slots.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      const nextDate = upcomingSlots.length > 0 ? upcomingSlots[0].startDate : null;
      
      return {
        ...classObj,
        hasAvailableSlots: totalAvailableSlots > 0,
        totalAvailableSlots,
        nextAvailableDate: nextDate,
        // date alanını en yakın slot tarihine göre güncelle
        date: nextDate ? new Date(nextDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) + ' • ' + (upcomingSlots[0].time?.start || '') : 'Various dates available'
      };
    }));
    
    res.render("learn", {
      layout: "layouts/main",
      title: "Classes & Workshops",
      classes: classesWithSlotInfo,
      activeClasses: true
    });
  } catch (error) {
    logger.error('Error fetching classes:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
};

// Kategoriye göre kursları filtrele
exports.showClassesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    // Burada kategoriye göre filtreleme yapılabilir
    // Şimdilik tüm kursları gösterelim
    
    const classes = await Class.find({ isActive: true });
    
    res.render("class-list", {
      layout: "layouts/main",
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Classes`,
      classes,
      activeClasses: true
    });
  } catch (error) {
    logger.error(`Error fetching classes by category: ${req.params.category}`, error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
};