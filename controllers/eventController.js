// controllers/eventController.js
const Event = require('../models/Event');
const logger = require('../utils/logger');

// Tüm etkinlikleri göster
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true });
    
    res.render("events", {
      layout: "layouts/main",
      title: "Events",
      events,
      activeEvents: true,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
};

// Etkinlik detaylarını göster
exports.getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug, isActive: true });
    
    if (!event) {
      return res.status(404).render("error", {
        errorCode: 404,
        errorMessage: "Event Not Found",
        errorDetail: "The event you're looking for doesn't exist or has been removed."
      });
    }
    
    // Kalan koltuk sayısını hesapla
    const availableSlots = event.totalSlots - event.bookedSlots;
    const availabilityPercentage = Math.floor((availableSlots / event.totalSlots) * 100);
    
    res.render("event-details", {
      layout: "layouts/main",
      title: event.title,
      event: {
        ...event.toObject(),
        formattedDate: new Date(event.date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        formattedTime: `${event.time.start} - ${event.time.end}`
      },
      availableSlots,
      availabilityPercentage,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    logger.error(`Error fetching event by slug: ${req.params.slug}`, error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
};

// Etkinliği sepete ekle
exports.addEventToCart = async (req, res) => {
  try {
    const { eventId, quantity = 1 } = req.body;
    
    // Teste için sabit etkinlik bilgileri (veritabanından çekilmeden)
    let eventData;
    
    if (eventId === 'event1Id') {
      eventData = {
        _id: 'event1Id',
        title: 'Altin Gun Ceramic Workshop',
        date: new Date('2024-03-10'),
        time: { start: '6:00 PM', end: '8:00 PM' },
        location: 'Lokum Eats Restaurant, Toronto, ON M6P 1T7',
        price: { value: 85, display: '$85' },
        image: 'https://res.cloudinary.com/dnemf1asq/image/upload/v1743879029/020A0186_neobdk_c_fill_w_6016_h_4016_rzi9uo.jpg'
      };
    } 
    else if (eventId === 'event2Id') {
      eventData = {
        _id: 'event2Id',
        title: "Valentine's Day Handmade Ceramic Mug Workshop",
        date: new Date('2024-02-11'),
        time: { start: '6:00 PM', end: '8:00 PM' },
        location: 'Lokum Eats Restaurant, Toronto, ON M6P 1T7',
        price: { value: 75, display: '$75' },
        image: 'https://res.cloudinary.com/dnemf1asq/image/upload/v1743875345/https___cdn.evbuc.com_images_685848579_1658413204063_1_original_mfadc4.avif'
      };
    }
    else if (eventId === 'event3Id') {
      eventData = {
        _id: 'event3Id',
        title: "Mother's Day Event - Clay Workshop and Dinner Experience",
        date: new Date('2025-05-12'),
        time: { start: '5:00 PM', end: '7:00 PM' },
        location: 'Lokum Eats Restaurant, Toronto, ON M6P 1T7',
        price: { value: 95, display: '$95' },
        image: 'https://res.cloudinary.com/dnemf1asq/image/upload/v1744161394/WhatsApp_Image_2025-04-08_at_21.15.51_9c33ffee_ica1kt.jpg'
      };
    } else {
      req.flash('error', 'Event not found');
      return res.redirect('/events');
    }
    
    // Sepet kontrolü
    if (!req.session.cart) {
      req.session.cart = [];
    }
    
    // Sepete ekle
    req.session.cart.push({
      cartItemId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'event',
      eventId: eventData._id,
      eventTitle: eventData.title,
      eventImage: eventData.image,
      eventDate: new Date(eventData.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      }),
      eventTime: `${eventData.time.start} - ${eventData.time.end}`,
      eventLocation: eventData.location,
      quantity: parseInt(quantity),
      price: eventData.price.value,
      priceDisplay: eventData.price.display
    });
    
    req.flash('success', 'Event added to cart!');
    res.redirect('/checkout');
  } catch (error) {
    console.error('Error adding event to cart:', error);
    req.flash('error', 'Failed to add event to cart');
    res.redirect('/events');
  }
};