require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Class = require('../models/Class');
const ClassSlot = require('../models/ClassSlot');
const Reservation = require('../models/Reservation');

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('✅ MongoDB connected for seeding'))
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Örnek kurs verileri
const classData = [
  {
    slug: "4-week-wheel",
    title: "4-Week Beginner Wheel Throwing Class",
    description: "Build a solid foundation in ceramics with this 4-week hands-on wheel throwing class.",
    intro: [
      "Ready to take your pottery journey to the next level? Our 4-Week Beginner Wheel Throwing Class is designed for those who want to build a solid foundation in ceramics.",
      "Whether you're completely new or have tried it once or twice, this immersive course will give you the skills and confidence to work with clay on the wheel. Throughout the 4 weeks, you'll learn how to center, pull, trim, and glaze—plus explore a bit of hand-building. You'll finish the course with multiple unique pieces and a deeper understanding of the pottery process."
    ],
    details: [
      "Week 1: Introduction to the studio and tools, learning how the wheel works, centering clay, and practicing basic forms.",
      "Week 2: Throwing practice continues, introduction to trimming techniques.",
      "Week 3: Trimming your pieces, plus hand-building basics such as making handles and using slabs and molds.",
      "Week 4: Glazing your finished work and reviewing what you've learned!"
    ],
    price: {
      value: 295,
      currency: "CAD",
      display: "$295 + tax"
    },
    image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745189121/blake-cheek-IMU94a5QVLk-unsplash_fwa502.jpg",
    included: [
      "All clay, tools, and glaze materials",
      "Up to 7–8 finished pieces, glazed and fired",
      "One-on-one instruction in a supportive small-group setting",
      "Use of studio tools and equipment",
      "Firings included"
    ],
    pickupInfo: "Your glazed and fired pieces will be ready for pick-up approximately 2–3 weeks after the last class.",
    notes: [
      "This course is non-refundable",
      "Make-up classes and rescheduling are not available"
    ],
    classRefund: "At Heart Pottery Studio, we are dedicated to fostering a warm, inclusive, and creative environment."
  },
  {
    slug: "8-week-wheel",
    title: "8-Week Beginner Wheel Throwing Class",
    description: "Explore both traditional and contemporary pottery techniques over 8 weeks.",
    intro: [
      "Our most comprehensive wheel throwing course—the perfect way to dive deep into the world of ceramics. This 8-week program gives you double the time to develop your skills and create a wider variety of pieces.",
      "From basic cylinder forms to more complex shapes, you'll have the space to experiment and find your unique style. With more sessions, you'll gain confidence on the wheel and learn to troubleshoot common challenges. By the end, you'll have an impressive collection of finished pieces and a solid technical foundation."
    ],
    details: [
      "Week 1-2: Introduction to the studio, tools, and wheel mechanics. Centering clay and creating basic forms.",
      "Week 3-4: Refining your throwing technique and exploring various forms. Introduction to trimming.",
      "Week 5-6: Advanced forms, adding handles, and combining pieces. Exploring textures and surface treatments.",
      "Week 7-8: Glazing techniques, finishing your pieces, and reviewing your progress."
    ],
    price: {
      value: 535,
      currency: "CAD",
      display: "$535 + tax"
    },
    image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745188067/courtney-cook-nXYmYO_-JUk-unsplash_epevjp.jpg",
    included: [
      "Double the clay, tools, and glaze materials of our 4-week course",
      "Up to 12-15 finished pieces, glazed and fired",
      "More personalized instruction time",
      "Full use of studio tools and equipment",
      "All firings included"
    ],
    pickupInfo: "Your glazed and fired pieces will be ready for pick-up approximately 2–3 weeks after the last class.",
    notes: [
      "This course is non-refundable",
      "Make-up classes and rescheduling are not available"
    ],
    classRefund: "At Heart Pottery Studio, we are dedicated to fostering a warm, inclusive, and creative environment."
  },
  {
    slug: "tryout-wheel",
    title: "Pottery Tryout Class",
    description: "Try your hand at pottery in this fun, no-pressure 2-hour session—no experience needed!",
    intro: [
      "Curious about pottery but not ready to commit to a full course? Our 2-hour Pottery Tryout Class is the perfect introduction to clay.",
      "This hands-on session gives you a taste of what it's like to work on the wheel without the commitment of a multi-week course. Our experienced instructors will guide you through the basics of centering and pulling up walls to create your very own small bowl or cup. It's a fun, relaxed way to see if pottery is right for you!"
    ],
    details: [
      "Introduction to clay and basic pottery tools",
      "Hands-on guidance with centering clay on the wheel",
      "Create your own small piece (typically a bowl or cup)",
      "Brief overview of the finishing process",
      "Discussion about our longer courses if you'd like to continue your pottery journey"
    ],
    price: {
      value: 70,
      currency: "CAD",
      display: "$70 + tax"
    },
    image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745189420/jonathan-cosens-photography-eXSB6MsBB-w-unsplash_h8acag.jpg",
    included: [
      "All clay and tools for use during the class",
      "One piece to be glazed and fired",
      "Professional instruction in a supportive environment",
      "Firing of your piece (available for pickup 2-3 weeks later)"
    ],
    pickupInfo: "Your glazed and fired piece will be ready for pick-up approximately 2–3 weeks after your class.",
    notes: [
      "This class is non-refundable",
      "Rescheduling with at least 48 hours notice is allowed"
    ],
    classRefund: "At Heart Pottery Studio, we are dedicated to fostering a warm, inclusive, and creative environment."
  },

  {
  slug: "4-week-hand-building",
  title: "4-Week Hand-Building Pottery Class",
  description: "Want to get creative with clay—without using the pottery wheel? Our 4-Week Hand-Building Class is the perfect place to start.",
  intro: [
    "In this fun and accessible course, you'll explore sculptural and functional techniques to create beautiful, one-of-a-kind ceramic pieces—like mugs, vases, and trays.",
    "This class is ideal for total beginners or anyone who wants to slow down, connect with their hands, and enjoy a mindful, hands-on experience with clay."
  ],
  details: [
    "Week 1: Introduction to the studio. Learning pinch pot and coiling techniques to create expressive, organic forms.",
    "Week 2: Slab-building basics: constructing mugs, trays, and functional forms using slabs and molds.",
    "Week 3: Last day of building: time to finish, refine, and decorate your pieces before firing.",
    "Week 4: Glazing and surface decoration—adding color and character to your work."
  ],
  price: {
    value: 285,
    currency: "CAD",
    display: "$285 + tax"
  },
  image: "https://res.cloudinary.com/dnemf1asq/image/upload/f_auto,q_auto,dpr_auto/v1745188095/pexels-cottonbro-6694308_xpabkn.jpg",
  included: [
    "One 5 kg bag of clay",
    "Additional clay available for $25/bag",
    "All tools, glazes, and firing costs",
    "Up to 6 finished glazed pieces",
    "Full use of studio tools and equipment",
    "Personalized instruction in a small group setting"
  ],
  pickupInfo: "Your glazed pieces will be ready for pick-up approximately 2–3 weeks after the last class. You'll be notified by email. Pieces not picked up within 2 months will be discarded.",
  notes: [
    "This course is non-refundable",
    "Rescheduling and make-up classes are not available",
    "Aprons are provided",
    "Please wear comfortable clothing and trim your nails for best results."
  ],
  classRefund: "At Heart Pottery Studio, we are dedicated to fostering a warm, inclusive, and creative environment."
}
];

// Slot örnekleri için tarih yardımcı fonksiyonu
function getDateForDayAndMonth(day, month, year) {
  return new Date(year, month - 1, day);
}

// Tarih formatlama fonksiyonu
function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startMonth = start.toLocaleString('en-US', { month: 'long' });
  const endMonth = end.toLocaleString('en-US', { month: 'long' });
  
  const dayOfWeek = start.toLocaleString('en-US', { weekday: 'long' });
  
  if (startMonth === endMonth) {
    return `${dayOfWeek} ${startMonth} ${start.getDate()} – ${end.getDate()}`;
  } else {
    return `${dayOfWeek} ${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`;
  }
}

// Veritabanını doldur
async function seedDatabase() {
  try {
    // Önce koleksiyonları temizle
    await Class.deleteMany({});
    await ClassSlot.deleteMany({});
    await Reservation.deleteMany({});
    logger.info('🧹 Existing data cleared');
    
    // Kursları ekle
    const classes = await Class.create(classData);
    logger.info(`✅ ${classes.length} classes created`);
    
    // Referansları kurs slug'larına göre bul
    const fourWeekClass = classes.find(c => c.slug === "4-week-wheel");
    const eightWeekClass = classes.find(c => c.slug === "8-week-wheel");
    const tryoutClass = classes.find(c => c.slug === "tryout-wheel");
    const handBuildingClass = classes.find(c => c.slug === "4-week-hand-building");
    
    // Slot nesnelerini oluştur (Ağustos 2025)
    const augustSlots = [
      // 4 haftalık kurs için Ağustos 2025 slotları
      {
        classId: fourWeekClass._id,
        startDate: getDateForDayAndMonth(4, 8, 2025),
        endDate: getDateForDayAndMonth(25, 8, 2025),
        time: { start: "6:00 PM", end: "8:00 PM" },
        dayOfWeek: "Monday",
        label: formatDateRange(getDateForDayAndMonth(4, 8, 2025), getDateForDayAndMonth(25, 8, 2025)),
        totalSlots: 8,
        bookedSlots: 0
      },
      {
        classId: fourWeekClass._id,
        startDate: getDateForDayAndMonth(6, 8, 2025),
        endDate: getDateForDayAndMonth(27, 8, 2025),
        time: { start: "6:00 PM", end: "8:00 PM" },
        dayOfWeek: "Wednesday",
        label: formatDateRange(getDateForDayAndMonth(6, 8, 2025), getDateForDayAndMonth(27, 8, 2025)),
        totalSlots: 8,
        bookedSlots: 0
      },
      // 8 haftalık kurs için Ağustos slotları
      {
        classId: eightWeekClass._id,
        startDate: getDateForDayAndMonth(5, 8, 2025),
        endDate: getDateForDayAndMonth(30, 9, 2025),
        time: { start: "6:30 PM", end: "8:30 PM" },
        dayOfWeek: "Tuesday",
        label: formatDateRange(getDateForDayAndMonth(5, 8, 2025), getDateForDayAndMonth(30, 9, 2025)),
        totalSlots: 8,
        bookedSlots: 2 // Önceden 2 rezervasyon var
      },
      // Deneme kursu için slotlar
      {
        classId: tryoutClass._id,
        startDate: getDateForDayAndMonth(2, 8, 2025),
        endDate: getDateForDayAndMonth(2, 8, 2025), // Aynı gün (tek oturum)
        time: { start: "10:00 AM", end: "12:00 PM" },
        dayOfWeek: "Saturday",
        label: "Saturday August 2",
        totalSlots: 8,
        bookedSlots: 3
      },
      {
        classId: tryoutClass._id,
        startDate: getDateForDayAndMonth(9, 8, 2025),
        endDate: getDateForDayAndMonth(9, 8, 2025),
        time: { start: "10:00 AM", end: "12:00 PM" },
        dayOfWeek: "Saturday",
        label: "Saturday August 9",
        totalSlots: 8,
        bookedSlots: 0
      }
    ];
    
    // Eylül 2025 slotları
    const septemberSlots = [
      
      // 4 haftalık kurs için Eylül slotları
        // Deneme kursu için Eylül slotları (mevcut slotu güncelle ve yeni slotlar ekle)
        {
          classId: tryoutClass._id,
          startDate: getDateForDayAndMonth(6, 9, 2025),
          endDate: getDateForDayAndMonth(6, 9, 2025),
          time: { start: "02:00 PM", end: "04:00 PM" }, // Saati güncellendi
          dayOfWeek: "Saturday",
          label: "Saturday September 6",
          totalSlots: 8, 
          bookedSlots: 0
        },
        {
          classId: tryoutClass._id,
          startDate: getDateForDayAndMonth(13, 9, 2025),
          endDate: getDateForDayAndMonth(13, 9, 2025),
          time: { start: "02:00 PM", end: "04:00 PM" },
          dayOfWeek: "Saturday",
          label: "Saturday September 13",
          totalSlots: 8, 
          bookedSlots: 0
        },
        {
          classId: tryoutClass._id,
          startDate: getDateForDayAndMonth(20, 9, 2025),
          endDate: getDateForDayAndMonth(20, 9, 2025),
          time: { start: "02:00 PM", end: "04:00 PM" },
          dayOfWeek: "Saturday",
          label: "Saturday September 20",
          totalSlots: 8, 
          bookedSlots: 0
        },
        {
          classId: tryoutClass._id,
          startDate: getDateForDayAndMonth(27, 9, 2025),
          endDate: getDateForDayAndMonth(27, 9, 2025),
          time: { start: "02:00 PM", end: "04:00 PM" },
          dayOfWeek: "Saturday",
          label: "Saturday September 27",
          totalSlots: 8, 
          bookedSlots: 0
        },

      // 8-WEEK sınıfı için yeni Eylül slotları
      {
        classId: eightWeekClass._id,  // 8-haftalık sınıf ID'si
        startDate: getDateForDayAndMonth(1, 9, 2025),
        endDate: getDateForDayAndMonth(20, 10, 2025),
        time: { start: "6:30 PM", end: "9:30 PM" },
        dayOfWeek: "Monday",
        label: formatDateRange(getDateForDayAndMonth(1, 9, 2025), getDateForDayAndMonth(20, 10, 2025)),
        totalSlots: 8,
        bookedSlots: 0
      },

      {
        classId: eightWeekClass._id,  // 8-haftalık sınıf ID'si
        startDate: getDateForDayAndMonth(2, 9, 2025),
        endDate: getDateForDayAndMonth(21, 10, 2025),
        time: { start: "6:30 PM", end: "9:30 PM" },
        dayOfWeek: "Tuesday",
        label: formatDateRange(getDateForDayAndMonth(2, 9, 2025), getDateForDayAndMonth(21, 10, 2025)),
        totalSlots: 8,
        bookedSlots: 0
      },
      
      {
        classId: eightWeekClass._id,  // 8-haftalık sınıf ID'si
        startDate: getDateForDayAndMonth(4, 9, 2025),
        endDate: getDateForDayAndMonth(23, 10, 2025),
        time: { start: "6:30 PM", end: "9:30 PM" },
        dayOfWeek: "Thursday",
        label: formatDateRange(getDateForDayAndMonth(4, 9, 2025), getDateForDayAndMonth(23, 10, 2025)),
        totalSlots: 8,
        bookedSlots: 0
      },


      // 4-Week Hand-Building için Eylül 2025 slotları
      {
        classId: handBuildingClass._id,
        startDate: getDateForDayAndMonth(2, 9, 2025),
        endDate: getDateForDayAndMonth(23, 9, 2025),
        time: { start: "1:30 PM", end: "4:30 PM" },
        dayOfWeek: "Tuesday",
        label: formatDateRange(getDateForDayAndMonth(2, 9, 2025), getDateForDayAndMonth(23, 9, 2025)),
        totalSlots: 8,
        bookedSlots: 0
      },
      {
        classId: handBuildingClass._id,
        startDate: getDateForDayAndMonth(30, 9, 2025),
        endDate: getDateForDayAndMonth(21, 10, 2025),
        time: { start: "1:30 PM", end: "4:30 PM" },
        dayOfWeek: "Tuesday",
        label: formatDateRange(getDateForDayAndMonth(30, 9, 2025), getDateForDayAndMonth(21, 10, 2025)),
        totalSlots: 8,
        bookedSlots: 0
      }
    ];


   // Ekim 2025 slotları
const octoberSlots = [
  // Ekim slot 1
  {
    classId: fourWeekClass._id,
    startDate: getDateForDayAndMonth(1, 10, 2025),
    endDate: getDateForDayAndMonth(22, 10, 2025), // 4 haftalık kurs
    time: { start: "6:30 PM", end: "9:30 PM" },
    dayOfWeek: "Wednesday",
    label: formatDateRange(getDateForDayAndMonth(1, 10, 2025), getDateForDayAndMonth(22, 10, 2025)),
    totalSlots: 8,
    bookedSlots: 0
  },
  // Ekim slot 2
  {
    classId: fourWeekClass._id,
    startDate: getDateForDayAndMonth(29, 10, 2025),
    endDate: getDateForDayAndMonth(19, 11, 2025), // 4 haftalık kurs (Kasım'a uzanıyor)
    time: { start: "6:30 PM", end: "9:30 PM" },
    dayOfWeek: "Wednesday",
    label: formatDateRange(getDateForDayAndMonth(29, 10, 2025), getDateForDayAndMonth(19, 11, 2025)),
    totalSlots: 8,
    bookedSlots: 0
  },

    // 8-WEEK sınıfı için Ekim-Aralık slotları
    {
      classId: eightWeekClass._id,
      startDate: getDateForDayAndMonth(27, 10, 2025),
      endDate: getDateForDayAndMonth(22, 12, 2025),
      time: { start: "6:30 PM", end: "9:30 PM" },
      dayOfWeek: "Monday",
      label: formatDateRange(getDateForDayAndMonth(27, 10, 2025), getDateForDayAndMonth(22, 12, 2025)),
      totalSlots: 8,
      bookedSlots: 0
    },

    {
      classId: eightWeekClass._id,
      startDate: getDateForDayAndMonth(28, 10, 2025),
      endDate: getDateForDayAndMonth(23, 12, 2025),
      time: { start: "6:30 PM", end: "9:30 PM" },
      dayOfWeek: "Tuesday",
      label: formatDateRange(getDateForDayAndMonth(28, 10, 2025), getDateForDayAndMonth(23, 12, 2025)),
      totalSlots: 8,
      bookedSlots: 0
    },

    {
      classId: eightWeekClass._id,
      startDate: getDateForDayAndMonth(30, 10, 2025),
      endDate: getDateForDayAndMonth(25, 12, 2025),
      time: { start: "6:30 PM", end: "9:30 PM" },
      dayOfWeek: "Thursday",
      label: formatDateRange(getDateForDayAndMonth(30, 10, 2025), getDateForDayAndMonth(25, 12, 2025)),
      totalSlots: 8,
      bookedSlots: 0
    },


    // Deneme kursu için Ekim 2025 slotları
  {
    classId: tryoutClass._id,
    startDate: getDateForDayAndMonth(4, 10, 2025),
    endDate: getDateForDayAndMonth(4, 10, 2025),
    time: { start: "02:00 PM", end: "04:00 PM" },
    dayOfWeek: "Saturday",
    label: "Saturday October 4",
    totalSlots: 8, 
    bookedSlots: 0
  },
  {
    classId: tryoutClass._id,
    startDate: getDateForDayAndMonth(11, 10, 2025),
    endDate: getDateForDayAndMonth(11, 10, 2025),
    time: { start: "02:00 PM", end: "04:00 PM" },
    dayOfWeek: "Saturday",
    label: "Saturday October 11",
    totalSlots: 8, 
    bookedSlots: 0
  },
  {
    classId: tryoutClass._id,
    startDate: getDateForDayAndMonth(18, 10, 2025),
    endDate: getDateForDayAndMonth(18, 10, 2025),
    time: { start: "02:00 PM", end: "04:00 PM" },
    dayOfWeek: "Saturday",
    label: "Saturday October 18",
    totalSlots: 8, 
    bookedSlots: 0
  },
  {
    classId: tryoutClass._id,
    startDate: getDateForDayAndMonth(25, 10, 2025),
    endDate: getDateForDayAndMonth(25, 10, 2025),
    time: { start: "02:00 PM", end: "04:00 PM" },
    dayOfWeek: "Saturday",
    label: "Saturday October 25",
    totalSlots: 8, 
    bookedSlots: 0
  },

  // 4-Week Hand-Building için Ekim 2025 slotu
  {
    classId: handBuildingClass._id,
    startDate: getDateForDayAndMonth(28, 10, 2025),
    endDate: getDateForDayAndMonth(18, 11, 2025),
    time: { start: "1:30 PM", end: "4:30 PM" },
    dayOfWeek: "Tuesday",
    label: formatDateRange(getDateForDayAndMonth(28, 10, 2025), getDateForDayAndMonth(18, 11, 2025)),
    totalSlots: 8,
    bookedSlots: 0
  }
];



// Kasım 2025 slotları
const novemberSlots = [
  // Deneme kursu için Kasım 2025 slotları
  {
    classId: tryoutClass._id,
    startDate: getDateForDayAndMonth(1, 11, 2025),
    endDate: getDateForDayAndMonth(1, 11, 2025),
    time: { start: "02:00 PM", end: "04:00 PM" },
    dayOfWeek: "Saturday",
    label: "Saturday November 1",
    totalSlots: 8, 
    bookedSlots: 0
  },
  {
    classId: tryoutClass._id,
    startDate: getDateForDayAndMonth(8, 11, 2025),
    endDate: getDateForDayAndMonth(8, 11, 2025),
    time: { start: "02:00 PM", end: "04:00 PM" },
    dayOfWeek: "Saturday",
    label: "Saturday November 8",
    totalSlots: 8, 
    bookedSlots: 0
  },
  {
    classId: tryoutClass._id,
    startDate: getDateForDayAndMonth(15, 11, 2025),
    endDate: getDateForDayAndMonth(15, 11, 2025),
    time: { start: "02:00 PM", end: "04:00 PM" },
    dayOfWeek: "Saturday",
    label: "Saturday November 15",
    totalSlots: 8, 
    bookedSlots: 0
  },
  {
    classId: tryoutClass._id,
    startDate: getDateForDayAndMonth(22, 11, 2025),
    endDate: getDateForDayAndMonth(22, 11, 2025),
    time: { start: "02:00 PM", end: "04:00 PM" },
    dayOfWeek: "Saturday",
    label: "Saturday November 22",
    totalSlots: 8, 
    bookedSlots: 0
  },
  {
    classId: tryoutClass._id,
    startDate: getDateForDayAndMonth(29, 11, 2025),
    endDate: getDateForDayAndMonth(29, 11, 2025),
    time: { start: "02:00 PM", end: "04:00 PM" },
    dayOfWeek: "Saturday",
    label: "Saturday November 29",
    totalSlots: 8, 
    bookedSlots: 0
  },

  // 4-Week Hand-Building için Kasım 2025 slotu
  {
    classId: handBuildingClass._id,
    startDate: getDateForDayAndMonth(25, 11, 2025),
    endDate: getDateForDayAndMonth(16, 12, 2025),
    time: { start: "1:30 PM", end: "4:30 PM" },
    dayOfWeek: "Tuesday",
    label: formatDateRange(getDateForDayAndMonth(25, 11, 2025), getDateForDayAndMonth(16, 12, 2025)),
    totalSlots: 8,
    bookedSlots: 0
  }
];

    
    // Tüm slotları birleştir
    const allSlots = [...augustSlots,...septemberSlots,...octoberSlots,...novemberSlots];
    
    // Slotları veritabanına kaydet
    await ClassSlot.create(allSlots);
    logger.info(`✅ ${allSlots.length} slots created`);
    
    logger.info('🌱 Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

// Seed işlemini başlat
seedDatabase();