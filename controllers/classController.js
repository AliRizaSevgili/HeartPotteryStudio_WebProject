const Class = require('../models/Class');
const slotService = require('../services/slotService');
const logger = require('../utils/logger');

/**
 * Display class details by slug with available slots
 */
exports.showClassBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get class details from database
    const classItem = await Class.findOne({ slug, isActive: true });
    
    if (!classItem) {
      return res.status(404).render("error", {
        errorCode: 404,
        errorMessage: "Oops! Not Found",
        errorDetail: "The class you're looking for doesn't exist or has been removed."
      });
    }
    
    // Get all slots for this class
    const allSlots = await slotService.getSlotsByClassSlug(slug);
    
    // Group slots by month
    const groupedSlots = {};
    
    allSlots.forEach(slot => {
      const startDate = new Date(slot.startDate);
      const month = startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groupedSlots[month]) {
        groupedSlots[month] = [];
      }
      
      // Calculate availability
      const availableSlots = slot.totalSlots - slot.bookedSlots;
      const isFull = availableSlots <= 0;
      
      groupedSlots[month].push({
        id: slot._id, // Important for reservation system
        label: slot.label,
        availableSlots: availableSlots,
        isFull: isFull,
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
    
    // Create date data for each month (aprilDates, mayDates, etc.)
    const dateData = {};
    Object.keys(groupedSlots).forEach(month => {
      const monthName = month.split(' ')[0].toLowerCase() + 'Dates';
      dateData[monthName] = groupedSlots[month];
    });
    
    // Render the class details page with all data
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
      csrfToken: req.csrfToken(), // Essential for secure form submission
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

/**
 * Search for classes
 */
exports.searchClasses = async (req, res) => {
  try {
    const { query } = req.query;
    
    // Create search filter
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
      activeClasses: true,
      csrfToken: req.csrfToken() // Include CSRF token for any forms
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

/**
 * Show all available classes (main class listing page)
 */
exports.showAllClasses = async (req, res) => {
  try {
    // Get all active classes
    const classes = await Class.find({ isActive: true });
    
    // Add slot information to each class
    const classesWithSlotInfo = await Promise.all(classes.map(async (classItem) => {
      const classObj = classItem.toObject();
      
      // Get slots for this class
      const slots = await slotService.getSlotsByClassSlug(classItem.slug);
      
      // Calculate slot statistics
      const totalAvailableSlots = slots.reduce((total, slot) => 
        total + Math.max(0, slot.totalSlots - slot.bookedSlots), 0);
      
      // Find the earliest upcoming slot
      const upcomingSlots = slots.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      const nextDate = upcomingSlots.length > 0 ? upcomingSlots[0].startDate : null;
      
      return {
        ...classObj,
        hasAvailableSlots: totalAvailableSlots > 0,
        totalAvailableSlots,
        nextAvailableDate: nextDate,
        // Update date field with next available slot
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
      activeClasses: true,
      csrfToken: req.csrfToken() // Include CSRF token for any forms
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

/**
 * Filter classes by category
 */
exports.showClassesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    // TODO: Add category filtering when categories are implemented
    const classes = await Class.find({ isActive: true });
    
    res.render("class-list", {
      layout: "layouts/main",
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Classes`,
      classes,
      activeClasses: true,
      csrfToken: req.csrfToken() // Include CSRF token for any forms
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

module.exports = exports;