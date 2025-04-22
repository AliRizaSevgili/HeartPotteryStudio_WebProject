


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

       availableDates: {
        "April 2025": [
          {
            label: "April 7 – April 13",
            slots: [
              { day: "Monday", date: "April 7, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "April 8, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          },
          {
            label: "April 14 – April 20",
            slots: [
              { day: "Monday", date: "April 14, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "April 15, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          },
          {
            label: "April 21 – April 27",
            slots: [
              { day: "Monday", date: "April 21, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "April 22, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          },
          {
            label: "April 28 – May 4",
            slots: [
              { day: "Monday", date: "April 28, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "April 29, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          }
        ],
      
        "May 2025": [
          {
            label: "May 5 – May 11",
            slots: [
              { day: "Monday", date: "May 5, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "May 6, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          },
          {
            label: "May 12 – May 18",
            slots: [
              { day: "Monday", date: "May 12, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "May 13, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          },
          {
            label: "May 19 – May 25",
            slots: [
              { day: "Monday", date: "May 19, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "May 20, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          },
          {
            label: "May 26 – June 1",
            slots: [
              { day: "Monday", date: "May 26, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "May 27, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          }
        ],
      
        "June 2025": [
          {
            label: "June 2 – June 8",
            slots: [
              { day: "Monday", date: "June 2, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "June 3, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          },
          {
            label: "June 9 – June 15",
            slots: [
              { day: "Monday", date: "June 9, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "June 10, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          },
          {
            label: "June 16 – June 22",
            slots: [
              { day: "Monday", date: "June 16, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "June 17, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          },
          {
            label: "June 23 – June 29",
            slots: [
              { day: "Monday", date: "June 23, 2025", time: "6:00 PM – 8:00 PM" },
              { day: "Tuesday", date: "June 24, 2025", time: "6:00 PM – 8:00 PM" }
            ]
          }
        ]
      }
      
       

    },

      


    {
      slug: "8-week-wheel",
      title: "8-Week Beginner Wheel Throwing Class",
      date: "March 10, 2024 • 6–8 PM EST",
      image: "https://res.cloudinary.com/dnemf1asq/image/upload/v1745188067/courtney-cook-nXYmYO_-JUk-unsplash_epevjp.jpg",
      description: "Explore the pottery wheel deeply with extended guided practice and projects.",
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

  res.render("class-details", {
    layout: "layouts/main",
    title: selectedClass.title,
    classItem: selectedClass,
    aprilDates: selectedClass.availableDates["April 2025"],
    mayDates: selectedClass.availableDates["May 2025"],
    juneDates: selectedClass.availableDates["June 2025"]
  });
};
