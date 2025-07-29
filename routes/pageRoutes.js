const express = require('express');
const router = express.Router();

// Ana sayfalar
router.get("/", (req, res) => {
  res.render("homepage", { 
    layout: "layouts/main", 
    title: "Home",
    activeHome: true,
    isHomepagePage: true
  });
});

router.get("/about", (req, res) => {
  res.render("about", { 
    layout: "layouts/main", 
    title: "About",
    activeAbout: true
  });
});

router.get("/events", (req, res) => {
  res.render("events", { 
    layout: "layouts/main", 
    title: "Events",
    activeGallery: true,
    isEventsPage: true
  });
});

router.get("/learn", (req, res) => {
  res.render("learn", { 
    layout: "layouts/main", 
    title: "Learn Pottery",
    activeLearn: true
  });
});

router.get("/join", (req, res) => {
  res.render("studio", { 
    layout: "layouts/main", 
    title: "Join the Studio", 
    activeJoin: true,
    isStudioPage: true  
  });
});

router.get("/contact", (req, res) => {
  res.render("contact", { 
    layout: "layouts/main", 
    title: "Contact | FQA",
    activeContact: true,
    isContactPage: true
  });
});

router.get("/login", (req, res) => {
  res.render("login", { layout: "layouts/main", title: "Sign In" });
});

// Yasal sayfalar
router.get("/terms", (req, res) => {
  res.render("terms", { 
    layout: "layouts/main", 
    title: "Terms & Conditions" 
  });
});

router.get("/privacy", (req, res) => {
  res.render("privacy", { 
    layout: "layouts/main", 
    title: "Privacy Policy" 
  });
});

router.get("/returns", (req, res) => {
  res.render("returns", { 
    layout: "layouts/main", 
    title: "Return & Refund" 
  });
});

module.exports = router;