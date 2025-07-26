


exports.showClassBySlug = (req, res) => {
  const { slug } = req.params;

  const classes = [
    {
      slug: "4-week-wheel",
      title: "4-Week Beginner Wheel Throwing Class",
      date: "Feb 11, 2024 • 6–8 PM EST",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745189121/blake-cheek-IMU94a5QVLk-unsplash_fwa502.jpg",
      description: "Build a solid foundation in ceramics with this 4-week hands-on wheel throwing class.",
      intro: [
        "Ready to take your pottery journey to the next level? Our 4-Week Beginner Wheel Throwing Class is designed for those who want to build a solid foundation in ceramics.",
        "Whether you're completely new or have tried it once or twice, this immersive course will give you the skills and confidence to work with clay on the wheel. Throughout the 4 weeks, you’ll learn how to center, pull, trim, and glaze—plus explore a bit of hand-building. You'll finish the course with multiple unique pieces and a deeper understanding of the pottery process."
      ],
      details: [
        "Week 1: Introduction to the studio and tools, learning how the wheel works, centering clay, and practicing basic forms.",
        "Week 2: Throwing practice continues, introduction to trimming techniques.",
        "Week 3: Trimming your pieces, plus hand-building basics such as making handles and using slabs and molds.",
        "Week 4: Glazing your finished work and reviewing what you've learned!"
      ],
      price: "$295 + tax",
      included: [
        "All clay, tools, and glaze materials",
        "Up to 7–8 finished pieces, glazed and fired",
        "One-on-one instruction in a supportive small-group setting",
        "Use of studio tools and equipment",
        "Firings included"
      ],
      pickupInfo: "Your glazed and fired pieces will be ready for pick-up approximately 2–3 weeks after the last class. We’ll notify you by email when they’re ready. Pieces not picked up within 2 months will be discarded.",
      notes: [
        "This course is non-refundable",
        "Make-up classes and rescheduling are not available, so please ensure you're able to attend all sessions",
        "Aprons are provided",
        "Wear comfy clothes (avoid short skirts/dresses), and keep nails trimmed for better control at the wheel"
       ],
       classRefund: "At Heart Pottery Studio, we are dedicated to fostering a warm, inclusive, and creative environment where everyone feels welcome. As an artist-led space, we celebrate diversity and encourage artistic expression from individuals of all backgrounds.\nWe have a zero-tolerance policy for any form of discrimination, harassment, or disrespectful behavior. Ensuring a safe and positive space for all is our priority. Any violation of this policy will result in immediate removal from our studio, with no refund provided. Let's create a supportive and inspiring community together...",

      
    },

      


    {
      slug: "8-week-wheel",
      title: "8-Week Beginner Wheel Throwing Class",
      date: "March 10, 2024 • 6–8 PM EST",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745188067/courtney-cook-nXYmYO_-JUk-unsplash_epevjp.jpg",
      description: "Explore both traditional and contemporary pottery techniques over 8 weeks.",
      intro: [
        "Looking to dive deep into the world of clay? Our 8-Week Beginner Wheel Throwing Class is the perfect way to explore both traditional and contemporary pottery techniques.",
        "This immersive course blends hand-building and wheel throwing practices, allowing you to build confidence, strengthen your skills, and walk away with a collection of unique, finished pieces.",
        "Perfect for beginners, this class starts with foundational hand-building before gently introducing the pottery wheel—giving you time and space to really understand the craft."
      ],
      details: [
        "Week 1: Introduction to the studio and traditional hand-building techniques (pinch pot, coiling, slabbing)",
        "Week 2: First experience with wheel throwing—learning the basics",
        "Week 3: Introduction to trimming techniques, continued throwing practice",
        "Week 4: First glazing session for early hand-built or thrown pieces",
        "Week 5: More wheel throwing—refining your technique and form",
        "Week 6: Final throwing day",
        "Week 7: Final trimming and hand-building session",
        "Week 8: Final class: full glazing session"
      ],
      price: "$535 + tax",
      included: [
        "One 10 kg bag of clay",
        "Additional clay available for $25/bag",
        "All tools, glazes, and firing costs",
        "Up to 15–20 finished, glazed pieces",
        "Small group instruction with personalized support",
        "Use of studio tools and equipment during class time"
      ],
      pickupInfo: "Your glazed and fired pieces will be ready for pick-up approximately 2–3 weeks after the last class. We will notify you via email. Pieces not picked up within 2 months will be discarded.",
      notes: [
        "This course is non-refundable",
        "Rescheduling and make-up classes are not available",
        "Aprons are provided",
        "Please wear comfortable clothing and trim your nails for best results at the wheel"
      ],
      classRefund: "At Heart Pottery Studio, we are dedicated to fostering a warm, inclusive, and creative environment where everyone feels welcome. As an artist-led space, we celebrate diversity and encourage artistic expression from individuals of all backgrounds.\nWe have a zero-tolerance policy for any form of discrimination, harassment, or disrespectful behavior. Ensuring a safe and positive space for all is our priority. Any violation of this policy will result in immediate removal from our studio, with no refund provided. Let's create a supportive and inspiring community together..."
    },
    
    {
      slug: "tryout-wheel",
      title: "Pottery Tryout Class",
      date: "Various dates available",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745189420/jonathan-cosens-photography-eXSB6MsBB-w-unsplash_h8acag.jpg",
      description: "Try your hand at pottery in this fun, no-pressure 2-hour session—no experience needed!",
      intro: [
        "Curious about pottery but not ready for a long-term commitment? Our 2-hour Pottery Tryout Class is the perfect way to dive into the world of clay!",
        "In this relaxed, hands-on workshop, you'll learn the basics of wheel throwing and create your own unique piece to take home. No experience required—just bring your creativity and a willingness to get your hands a little dirty!"
      ],
      details: [
        "This 2-hour workshop is designed for beginners who want to try their hand at pottery in a no-pressure, fun environment.",
        "You’ll be guided through the basics of throwing on the wheel and crafting your own piece of art."
      ],
      price: "$70 + tax",
      included: [
        "One piece to keep (after glazing and firing)",
        "$10 for additional pieces",
        "All materials and tools provided",
        "A hands-on, guided experience with personal instruction"
      ],
      pickupInfo: "Your finished piece will be ready for pick-up at least 2 weeks after the class. We will notify you via email when it's ready. Please make sure to pick up your piece within 2 months, or it will no longer be available.",
      notes: [
        "No refunds for cancellations.",
        "Rescheduling requests must be made at least 3 days in advance. If less than 3 days’ notice is given, a $35 rescheduling fee will apply.",
        "Please arrive 5 minutes early to get settled, as the class will start promptly. The instructor will not repeat the demo.",
        "Late arrivals: If you're more than 15 minutes late, you won’t be allowed to join the class, and no refunds will be issued.",
        "Aprons are provided, so there's no need to bring your own.",
        "Dress comfortably—avoid short skirts or dresses as you'll be seated with your legs around the wheel. Long nails may affect your ability to work effectively."
      ],
      classRefund: "Please make sure to read our Terms & Conditions before signing up."
    }
    




  ];

  const selectedClass = classes.find(cls => cls.slug === slug);

  if (!selectedClass) {
    return res.status(404).render("error", {
  errorCode: 404,
  errorMessage: "Oops! Not Found",
  errorDetail: "The class you're looking for doesn't exist."
});

  }

  // 🔻 TAM BURAYA EKLE 🔻
  const availableDates = {
    "April 2025": [
      {
        label: "Monday April 7 – April 28",
        slots: [
          { day: "Monday", date: "April 7, 2025", time: "6:00 PM – 8:00 PM" }
        ]
      },
      {
        label: "Tuesday April 8 – April 29",
        slots: [
          { day: "Tuesday", date: "April 8, 2025", time: "6:00 PM – 8:00 PM" }
        ]
      }
    ],

    "May 2025": [
      {
        label: "Monday May 5 – May 26",
        slots: [
          { day: "Monday", date: "May 5, 2025", time: "6:00 PM – 8:00 PM" }
        ]
      },
      {
        label: "Tuesday May 6 – May 27",
        slots: [
          { day: "Tuesday", date: "May 6, 2025", time: "6:00 PM – 8:00 PM" }
        ]
      }
    ],
    "June 2025": [
      {
        label: "Monday June 2 – June 23",
        slots: [
          { day: "Monday", date: "June 2, 2025", time: "6:00 PM – 8:00 PM" }
        ]
      },
      {
        label: "Tuesday June 3 – June 24",
        slots: [
          { day: "Tuesday", date: "June 3, 2025", time: "6:00 PM – 8:00 PM" }
        ]
      }
    ]
  };


  const eightWeekDates = {

    "April 2025": [
      {
        label: "Wednesday April 9 – May 28",
        slots: [
          { day: "Wednesday", date: "April 9, 2025", time: "2:00 PM – 5:00 PM" }
        ]
      },
      {
        label: "Thursday April 10 – June 29",
        slots: [
          { day: "Thursday", date: "April 10, 2025", time: "6:30 PM – 9:30 PM" }
        ]
      }
    ],

    
    "June 2025": [
      {
        label: "Wednesday June 4 – July 23",
        slots: [
          { day: "Thursday", date: "June 4, 2025", time: "2:00 PM – 5:00 PM" }
        ]
      },
      {
        label: "Thursday June 5 – July 24",
        slots: [
          { day: "Thursday", date: "Thursday 5, 2025", time: "6:30 PM – 9:30 PM" }
        ]
      }
    ],

    "August 2025": [
      {
        label: "Wednesday July 30 – Sept. 17",
        slots: [
          { day: "Wednesday", date: "July 30, 2025", time: "2:00 PM – 5:00 PM" }
        ]
      },
      {
        label: "Thursday June 31 – July 24",
        slots: [
          { day: "Thursday", date: "June 31, 2025", time: "6:30 PM – 9:30 PM" }
        ]
      }
    ]
  };


  const tryoutDates = {
    "April 2025": [
      {
        label: "Friday April 4",
        slots: [
          { day: "Friday", date: "April 4, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
      {
        label: "Friday April 11",
        slots: [
          { day: "Friday", date: "April 11, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
      {
        label: "Friday April 18",
        slots: [
          { day: "Friday", date: "April 18, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
      {
        label: "Friday April 25",
        slots: [
          { day: "Friday", date: "April 4, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
    ],

    "May 2025": [
      {
        label: "Friday May 2",
        slots: [
          { day: "Friday", date: "May 2, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
      {
        label: "Friday May 9",
        slots: [
          { day: "Friday", date: "May 9, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
      {
        label: "Friday May 16",
        slots: [
          { day: "Friday", date: "May 16, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
      {
        label: "Friday May 23",
        slots: [
          { day: "Friday", date: "May 323, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
      {
        label: "Friday May 30",
        slots: [
          { day: "Friday", date: "May 30, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },

    ],
    "June 2025": [
      {
        label: "Friday June 6",
        slots: [
          { day: "Friday", date: "June 6, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
      {
        label: "Friday June 13",
        slots: [
          { day: "Friday", date: "June 13, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
      {
        label: "Friday June 20",
        slots: [
          { day: "Friday", date: "June 20, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      },
      {
        label: "Friday June 27",
        slots: [
          { day: "Friday", date: "June 27, 2025", time: "2:00 PM – 4:00 PM" }
        ]
      }
    ]
  };
  
  

  let dateData = {};

  if (selectedClass.slug === "4-week-wheel") {
    dateData = {
      aprilDates: availableDates["April 2025"],
      mayDates: availableDates["May 2025"],
      juneDates: availableDates["June 2025"]
    };
  } else if (selectedClass.slug === "8-week-wheel") {
    dateData = {
      aprilDates: eightWeekDates["April 2025"],
      juneDates: eightWeekDates["June 2025"],
      augustDates: eightWeekDates["August 2025"]
    };
  } else if (selectedClass.slug === "tryout-wheel") {
    dateData = {
      aprilDates: tryoutDates["April 2025"],
      mayDates: tryoutDates["May 2025"],
      juneDates: tryoutDates["June 2025"]
    };
  }
  


  

res.render("class-details", {
  layout: "layouts/main",
  title: selectedClass.title,
  classItem: selectedClass,
  ...dateData // 🔁 burası yukarıdaki koşula göre doğru tarihleri eklemiş olur
});

};


// Tüm sınıfları göster
exports.showAllClasses = (req, res) => {
  // Aynı sınıf listesini kullanıyoruz - showClassBySlug'daki verileri yeniden kullanıyoruz
  const classes = [
    {
      slug: "4-week-wheel",
      title: "4-Week Beginner Wheel Throwing Class",
      date: "Feb 11, 2024 • 6–8 PM EST",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745189121/blake-cheek-IMU94a5QVLk-unsplash_fwa502.jpg",
      description: "Build a solid foundation in ceramics with this 4-week hands-on wheel throwing class.",
      price: "$295 + tax"
    },
    {
      slug: "8-week-wheel",
      title: "8-Week Beginner Wheel Throwing Class",
      date: "March 10, 2024 • 6–8 PM EST",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745188067/courtney-cook-nXYmYO_-JUk-unsplash_epevjp.jpg",
      description: "Explore both traditional and contemporary pottery techniques over 8 weeks.",
      price: "$535 + tax"
    },
    {
      slug: "tryout-wheel",
      title: "Pottery Tryout Class",
      date: "Various dates available",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745189420/jonathan-cosens-photography-eXSB6MsBB-w-unsplash_h8acag.jpg",
      description: "Try your hand at pottery in this fun, no-pressure 2-hour session—no experience needed!",
      price: "$70 + tax"
    }
  ];

  res.render("class-list", {
    layout: "layouts/main",
    title: "Pottery Classes",
    classes: classes,
    activeClasses: true
  });
};

// Kategori bazlı sınıfları göster
exports.showClassesByCategory = (req, res) => {
  const { category } = req.params;
  
  // Basit kategori filtresi için örnek sınıflar
  const classes = [
    {
      slug: "4-week-wheel",
      title: "4-Week Beginner Wheel Throwing Class",
      date: "Feb 11, 2024 • 6–8 PM EST",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745189121/blake-cheek-IMU94a5QVLk-unsplash_fwa502.jpg",
      description: "Build a solid foundation in ceramics with this 4-week hands-on wheel throwing class.",
      price: "$295 + tax",
      category: "beginner"
    },
    {
      slug: "8-week-wheel",
      title: "8-Week Beginner Wheel Throwing Class",
      date: "March 10, 2024 • 6–8 PM EST",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745188067/courtney-cook-nXYmYO_-JUk-unsplash_epevjp.jpg",
      description: "Explore both traditional and contemporary pottery techniques over 8 weeks.",
      price: "$535 + tax",
      category: "intermediate"
    },
    {
      slug: "tryout-wheel",
      title: "Pottery Tryout Class",
      date: "Various dates available",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745189420/jonathan-cosens-photography-eXSB6MsBB-w-unsplash_h8acag.jpg",
      description: "Try your hand at pottery in this fun, no-pressure 2-hour session—no experience needed!",
      price: "$70 + tax",
      category: "beginner"
    }
  ];

  // Kategori filtreleme
  const filteredClasses = classes.filter(cls => 
    cls.category && cls.category.toLowerCase() === category.toLowerCase()
  );

  res.render("class-list", {
    layout: "layouts/main",
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Classes`,
    categoryName: category,
    classes: filteredClasses,
    activeClasses: true
  });
};

// Arama işlemi
exports.searchClasses = (req, res) => {
  const { query } = req.query;
  
  // Örnek sınıflar
  const classes = [
    {
      slug: "4-week-wheel",
      title: "4-Week Beginner Wheel Throwing Class",
      date: "Feb 11, 2024 • 6–8 PM EST",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745189121/blake-cheek-IMU94a5QVLk-unsplash_fwa502.jpg",
      description: "Build a solid foundation in ceramics with this 4-week hands-on wheel throwing class.",
      price: "$295 + tax"
    },
    {
      slug: "8-week-wheel",
      title: "8-Week Beginner Wheel Throwing Class",
      date: "March 10, 2024 • 6–8 PM EST",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745188067/courtney-cook-nXYmYO_-JUk-unsplash_epevjp.jpg",
      description: "Explore both traditional and contemporary pottery techniques over 8 weeks.",
      price: "$535 + tax"
    },
    {
      slug: "tryout-wheel",
      title: "Pottery Tryout Class",
      date: "Various dates available",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745189420/jonathan-cosens-photography-eXSB6MsBB-w-unsplash_h8acag.jpg",
      description: "Try your hand at pottery in this fun, no-pressure 2-hour session—no experience needed!",
      price: "$70 + tax"
    }
  ];

  // Basit arama işlevi
  const searchResults = query 
    ? classes.filter(cls => 
        cls.title.toLowerCase().includes(query.toLowerCase()) || 
        cls.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  res.render("class-list", {
    layout: "layouts/main",
    title: "Search Results",
    searchQuery: query,
    classes: searchResults,
    activeClasses: true
  });
};