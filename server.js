require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const session = require('express-session');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

const galleryRoutes = require("./routes/galleryRoutes");
const contactRoutes = require('./routes/contactRoutes');
const { verifyRecaptcha } = require('./routes/contactRoutes'); // <-- EKLE
const classRoutes = require('./routes/classRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const infoRoutes = require("./routes/info");
const hbs = require("hbs");
const contactController = require('./controllers/contactController'); // <-- EKLE
const logger = require('./logger'); // Winston logger'ı ekle

// Rate limiting aktif:
const rateLimit = require('express-rate-limit');
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 20,
  message: "Too many payment requests from this IP, please try again later."
});
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many contact form submissions from this IP, please try again later."
});

// --- MIDDLEWARE SIRASI ÖNEMLİ ---

// HTTP'den HTTPS'ye yönlendirme (sadece production'da)
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// raw body parser (Stripe webhook için)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sıkılaştırılmış CORS ayarı (sadece Render domainine izin ver)
app.use(cors({
  origin: 'https://heartpotterystudio-webproject.onrender.com',
  credentials: true
}));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "https://res.cloudinary.com",
          "data:" // <-- Bunu ekle!
        ],
        mediaSrc: [
          "'self'",
          "https://res.cloudinary.com",
          "https://www.youtube.com",
          "https://player.vimeo.com"
        ],
        frameSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://www.google.com/recaptcha/",
          "https://www.recaptcha.net"
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://www.google.com/recaptcha/",
          "https://www.recaptcha.net"
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        connectSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://www.google.com/recaptcha/",
          "https://www.recaptcha.net"
        ]
      }
    }
  })
);

// Statik dosyalar
app.use(express.static(path.join(__dirname, "public")));
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));

// Handlebars 
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
hbs.registerPartials(path.join(__dirname, "views/partials"));

// Log
app.use(
  "/css",
  express.static(path.join(__dirname, "public/css"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
    },
  })
);

app.use(
  "/js",
  express.static(path.join(__dirname, "public/js"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

//Contact Routes
app.use(express.static(path.join(__dirname, "public")));

// MongoDB 
connectDB();

// --- SESSION MIDDLEWARE ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'heartpotterysecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // production'da true yapabilirsin
}));

// Cookie Parser Middleware
app.use(cookieParser());

// CSRF Middleware
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Pass CSRF token to views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// --- ROUTES ---
app.use('/api/payment', paymentLimiter);
app.use('/contact', contactLimiter);

app.use('/api/payment', paymentRoutes);
app.use('/contact', contactRoutes);
app.use('/class', classRoutes);
app.use(infoRoutes);
console.log("✅ Server loaded galleryRoutes!");
app.use("/api/gallery", galleryRoutes);

app.get("/favicon.ico", (req, res) => {
  res.redirect("https://res.cloudinary.com/dnemf1asq/image/upload/v1738886856/132204918_312399920214874_1423945434468733240_n_jf9vhp.ico");
});

// Main Pages Routes
app.get("/", (req, res) => {
  res.render("homepage", {
    layout: "layouts/main", 
    title: "Home",
    activeHome: true
   });
});

app.get("/about", (req, res) => {
  res.render("about", { 
    layout: "layouts/main", 
    title: "About",
    activeAbout: true
  });
});

app.get("/events", (req, res) => {
  res.render("events", { 
    layout: "layouts/main", 
    title: "Events",
    activeGallery: true
  });
});

app.get("/learn", (req, res) => {
  res.render("learn", { 
    layout: "layouts/main", 
    title: "Learn Pottery",
    activeLearn: true
  });
});

app.get("/join", (req, res) => {
  res.render("studio", { 
    layout: "layouts/main", 
    title: "Join the Studio", 
    activeJoin: true
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", { 
    layout: "layouts/main", 
    title: "Contact | FQA",
    activeContact: true
   });
});

app.get("/login", (req, res) => {
  res.render("login", { layout: "layouts/main", title: "Sign In" });
});

app.get("/terms", (req, res) => {
  res.render("terms", { 
    layout: "layouts/main", 
    title: "Terms & Conditions" 
  });
});

app.get("/privacy", (req, res) => {
  res.render("privacy", { 
    layout: "layouts/main", 
    title: "Privacy Policy" 
  });
});

app.get("/returns", (req, res) => {
  res.render("returns", { 
    layout: "layouts/main", 
    title: "Return & Refund" 
  });
});

// Checkout route'da promo ve mesajı view'a gönder
app.get("/checkout", (req, res) => {
  const cart = req.session.cart || [];
  const promo = req.session.promo || null;
  const promoMessage = req.session.promoMessage || null;
  res.render("checkout", {
    layout: "layouts/main",
    title: "Checkout",
    cart,
    promo,
    promoMessage
  });
});

// Payment success page
app.get("/payment-success", (req, res) => {
  res.render("payment-success", {
    layout: "layouts/main",
    title: "Payment Successful"
  });
});

// Sepete Ekleme Route'u
app.get("/add-to-cart", (req, res) => {
  const {
    classId,
    classTitle,
    classImage,
    classPrice,
    slotDay,
    slotDate,
    slotTime
  } = req.query;

  if (!classId || !classTitle || !classImage || !classPrice || !slotDay || !slotDate || !slotTime) {
    return res.redirect("/learn");
  }

  if (!req.session.cart) req.session.cart = [];

  // Aynı slot birden fazla eklenmesin
  const exists = req.session.cart.some(
    item =>
      item.classId === classId &&
      item.slotDay === slotDay &&
      item.slotDate === slotDate &&
      item.slotTime === slotTime
  );
  if (!exists) {
    req.session.cart.push({
      classId,
      classTitle,
      classImage,
      classPrice,
      slotDay,
      slotDate,
      slotTime
    });
  }

  // Yeni ürün eklenince promo kodunu sıfırla
  req.session.promo = null;
  req.session.promoMessage = null;

  res.redirect("/checkout");
});

app.post("/remove-from-cart", (req, res) => {
  const { classId, slotDay, slotDate, slotTime } = req.body;
  if (!req.session.cart) return res.redirect("/checkout");

  // Cart'tan item silindiğinde, eğer cart tamamen boşsa promo kodunu sıfırla
  req.session.cart = req.session.cart.filter(
    item =>
      !(
        item.classId === classId &&
        item.slotDay === slotDay &&
        item.slotDate === slotDate &&
        item.slotTime === slotTime
      )
  );
  if (!req.session.cart.length) {
    req.session.promo = null;
    req.session.promoMessage = null;
  }
  res.redirect("/checkout");
});

// Promo code application route (aktif ve sade)
app.post("/apply-promo", (req, res) => {
  const { promo } = req.body;
  const validCode = "HEART10";
  const discount = 0.10; // %10 indirim

  // Kod doğruysa session'a indirim bilgisini ekle
  if (promo && promo.trim().toUpperCase() === validCode && req.session.cart && req.session.cart.length > 0) {
    req.session.promo = { code: promo, discount };
    req.session.promoMessage = "Promo code applied! 10% discount.";
  } else if (!req.session.cart || req.session.cart.length === 0) {
    req.session.promo = null;
    req.session.promoMessage = "Add items to cart before applying promo code.";
  } else {
    req.session.promo = null;
    req.session.promoMessage = "Invalid promo code.";
  }
  res.redirect("/checkout");
});

// Homepage POST (form action="/")
app.post(
  "/",
  verifyRecaptcha,
  contactController.validateContactForm,
  (req, res) => {
    req.body.fromHomepage = true;
    contactController.submitContactForm(req, res);
  }
);

// Events POST (form action="/events")
app.post(
  "/events",
  verifyRecaptcha,
  contactController.validateContactForm,
  (req, res) => {
    req.body.fromEvents = true;
    contactController.submitContactForm(req, res);
  }
);

// Studio POST (form action="/join")
app.post(
  "/join",
  verifyRecaptcha,
  contactController.validateContactForm,
  (req, res) => {
    req.body.fromJoin = true;
    contactController.submitContactForm(req, res);
  }
);

// Contact POST (form action="/contact")
app.post(
  "/contact",
  verifyRecaptcha,
  contactController.validateContactForm,
  contactController.submitContactForm
);

// Test error route
app.get('/test-error', (req, res) => {
  throw new Error('Winston test error!');
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Genel hata yakalayıcı middleware (en sona ekle)
app.use((err, req, res, next) => {
  // Hassas veri maskesi
  if (req && req.body) {
    if (req.body.email) req.body.email = '[MASKED]';
    if (req.body.contactNumber) req.body.contactNumber = '[MASKED]';
    if (req.body.password) req.body.password = '[MASKED]';
    if (req.body.cardNumber) req.body.cardNumber = '[MASKED]';
  }
  logger.error(err);

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: "Something went wrong." });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Handlebars helper
hbs.registerHelper('sum', function(array, field) {
  let total = 0;
  if (Array.isArray(array)) {
    array.forEach(item => {
      let val = item[field];
      if (typeof val === "string") val = val.replace(/[^0-9.]/g, "");
      total += parseFloat(val) || 0;
    });
  }
  return total.toFixed(2);
});

hbs.registerHelper('discountedTotal', function(array, discount) {
  let total = 0;
  if (Array.isArray(array)) {
    array.forEach(item => {
      let val = item["classPrice"];
      if (typeof val === "string") val = val.replace(/[^0-9.]/g, "");
      total += parseFloat(val) || 0;
    });
  }
  return (total * (1 - (discount || 0))).toFixed(2);
});

hbs.registerHelper('discountAmount', function(array, discount) {
  let total = 0;
  if (Array.isArray(array)) {
    array.forEach(item => {
      let val = item["classPrice"];
      if (typeof val === "string") val = val.replace(/[^0-9.]/g, "");
      total += parseFloat(val) || 0;
    });
  }
  return (total * (discount || 0)).toFixed(2);
});

hbs.registerHelper('taxAmount', function(array, rate) {
  let total = 0;
  if (Array.isArray(array)) {
    array.forEach(item => {
      let val = item["classPrice"];
      if (typeof val === "string") val = val.replace(/[^0-9.]/g, "");
      total += parseFloat(val) || 0;
    });
  }
  return (total * (rate || 0)).toFixed(2);
});

hbs.registerHelper('totalCost', function(array, discount, taxRate) {
  let subtotal = 0;
  if (Array.isArray(array)) {
    array.forEach(item => {
      let val = item["classPrice"];
      if (typeof val === "string") val = val.replace(/[^0-9.]/g, "");
      subtotal += parseFloat(val) || 0;
    });
  }
  // İndirim varsa uygula
  if (discount) {
    subtotal = subtotal * (1 - discount);
  }
  // Vergiyi ekle
  let tax = subtotal * (taxRate || 0);
  // Toplamı döndür
  return (subtotal + tax).toFixed(2);
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));


