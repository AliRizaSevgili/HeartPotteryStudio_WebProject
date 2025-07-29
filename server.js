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
const crypto = require('crypto'); // Rezervasyon token'ı için eklendi

const galleryRoutes = require("./routes/galleryRoutes");
const contactRoutes = require('./routes/contactRoutes');
const { verifyRecaptcha } = require('./routes/contactRoutes');
const classRoutes = require('./routes/classRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const infoRoutes = require("./routes/info");
const cartRoutes = require('./routes/cartRoutes');
const hbs = require("hbs");
const contactController = require('./controllers/contactController');
const logger = require('./utils/logger');
const slotService = require('./services/slotService'); // Slot servisini import et

// Stripe modülü
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

// Sıkılaştırılmış CORS ayarı
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://heartpotterystudio-webproject.onrender.com' // Canlı ortam
    : 'http://localhost:5000', // Yerel geliştirme ortamı
  credentials: true // Çerezlerin gönderilmesine izin ver
}));

// Nonce oluşturma middleware'i
app.use((req, res, next) => {
  res.locals.nonce = Buffer.from(Date.now().toString()).toString('base64'); // Benzersiz nonce oluştur
  next();
});

// Helmet Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "https://res.cloudinary.com"],
        imgSrc: [
          "'self'",
          "https://res.cloudinary.com",
          "data:"
        ],
        mediaSrc: [
          "'self'",
          "https://res.cloudinary.com"
        ],
        frameSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.gstatic.com"
        ],
        scriptSrc: [
          "'self'",
          `'nonce-${Buffer.from(Date.now().toString()).toString('base64')}'`, // Statik nonce kullanımı
          "https://cdn.jsdelivr.net",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://www.google.com/recaptcha/",
          "https://www.recaptcha.net"
        ],
        scriptSrcAttr: [
          "'self'",
          "'unsafe-inline'" // Inline event handler'lar için unsafe-inline
        ],
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
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Production'da true olmalı
    httpOnly: true, // XSS saldırılarına karşı koruma
    sameSite: 'lax' // 'strict' yerine 'lax' kullanın - CSRF sorununu çözmek için
  }
}));

// Cookie Parser Middleware
app.use(cookieParser()); // CSRF'den önce

// CSRF Middleware
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Rezervasyon sayfası için özel token oluşturma middleware
app.use('/reservation', (req, res, next) => {
  // Benzersiz rezervasyon token'ı oluştur
  const reservationToken = crypto.randomBytes(16).toString('hex');
  
  // Token'ı session'a kaydet (karşılaştırma için)
  req.session.reservationToken = reservationToken;
  
  // Token'ı şablona aktar
  res.locals.reservationToken = reservationToken;
  
  next();
});

// Rezervasyon formları için token doğrulama middleware
const validateReservationToken = (req, res, next) => {
  // Sadece rezervasyon token'ı session'da varsa kontrol et
  if (req.session.reservationToken) {
    const { reservationToken } = req.body;
    
    if (!reservationToken || reservationToken !== req.session.reservationToken) {
      logger.warn('Invalid reservation token');
      return res.status(403).render("error", {
        errorCode: 403,
        errorMessage: "Invalid Request",
        errorDetail: "Please try again from the reservation page."
      });
    }
  }
  
  next();
};

// Yeni CSRF tokeni sağlayan rota
app.get('/get-csrf-token', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('CSRF token requested');
  }
  res.json({ csrfToken: req.csrfToken() });
});



// --- ROUTES ---
app.use('/api/payment', paymentLimiter);
app.use('/contact', contactLimiter);

// Client-side loglama endpoint'i
app.post('/api/client-logs', (req, res) => {
  const { level, message, url, userAgent, timestamp } = req.body;
  
  // Backend logger'a yönlendir
  if (level === 'error') {
    logger.error(`CLIENT ERROR [${url}]: ${message}`);
  } else {
    logger.info(`CLIENT LOG [${url}]: ${message}`);
  }
  
  res.status(200).send('Log received');
});

app.use('/api/payment', paymentRoutes);
app.use('/contact', contactRoutes);
app.use('/class', classRoutes);
app.use('/', cartRoutes); // Yeni cart rotaları
app.use(infoRoutes);
logger.info("✅ Server loaded galleryRoutes!");
app.use("/api/gallery", galleryRoutes);

app.get("/favicon.ico", (req, res) => {
  res.redirect("https://res.cloudinary.com/dnemf1asq/image/upload/v1738886856/132204918_312399920214874_1423945434468733240_n_jf9vhp.ico");
});

// Main Pages Routes
app.get("/", (req, res) => {
  res.render("homepage", { 
    layout: "layouts/main", 
    title: "Home",
    activeHome: true,
    isHomepagePage: true
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
    activeGallery: true,
    isEventsPage: true
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
    activeJoin: true,
    isStudioPage: true  
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", { 
    layout: "layouts/main", 
    title: "Contact | FQA",
    activeContact: true,
    isContactPage: true
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


// Checkout success sayfası - payment-success'e yönlendir
app.get("/checkout-success", async (req, res) => {
  // Session ID'yi alıp payment-success'e yönlendir
  const sessionId = req.query.session_id;
  res.redirect(`/payment-success${sessionId ? '?session_id=' + sessionId : ''}`);
});

// Payment success page - GÜNCELLENDİ: Rezervasyon onayı eklendi
app.get("/payment-success", async (req, res) => {
  try {
    // Rezervasyon ID'sini kontrol et ve rezervasyonu onayla
    if (req.session.cart) {
      // Eski sepet formatı (dizi)
      if (Array.isArray(req.session.cart) && req.session.cart.length > 0) {
        // Bu formatta rezervasyon ID'si olmadığı için doğrudan onay olmaz
        logger.info('Payment successful, but no reservation ID in old cart format');
      } 
      // Yeni sepet formatı (nesne)
      else if (req.session.cart.reservationId) {
        try {
          await slotService.confirmReservation(req.session.cart.reservationId, {
            email: req.body.email || 'customer@example.com'
          });
          logger.info(`Reservation confirmed: ${req.session.cart.reservationId}`);
        } catch (error) {
          logger.error('Error confirming reservation:', error);
        }
      }
      
      // Sepeti temizle
      delete req.session.cart;
      req.session.promo = null;
      req.session.promoMessage = null;
    }
    
    // Başarılı ödeme sayfasını göster
    res.render("payment-success", {
      layout: "layouts/main",
      title: "Payment Successful"
    });
  } catch (error) {
    logger.error('Error in payment success handler:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong on our end. Please try again later."
    });
  }
});

// Reservation expired page
app.get("/cart-expired", (req, res) => {
  // Sepeti temizle
  delete req.session.cart;
  req.session.promo = null;
  req.session.promoMessage = null;
  
  res.render("cart-expired", {
    layout: "layouts/main",
    title: "Reservation Expired"
  });
});

// Başarılı form gönderimi sonrası açılacak teşekkür sayfası için route
app.get("/contact-success", (req, res) => {
  res.render("contact-success", {
    layout: "layouts/main",
    title: "Submission Successful"
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

// Checkout route'u
app.get("/checkout", (req, res) => {
  const cart = req.session.cart || [];
  const promo = req.session.promo || null;
  const promoMessage = req.session.promoMessage || null;
  res.render("checkout", {
    layout: "layouts/main",
    title: "Checkout",
    cart,
    promo,
    promoMessage,
    csrfToken: req.csrfToken()
  });
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

// Eski promo code rotası - mevcut formlar için korunuyor
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

// Rezervasyon için yeni promo code rotası - rezervasyon token kontrolü ile
app.post("/apply-promo", validateReservationToken, (req, res) => {
  // Eğer buraya ulaşırsa, rezervasyon token'ı geçerli demektir
  const { promo } = req.body;
  const validCode = "HEART10";
  const discount = 0.10; // %10 indirim

  // Sepette ürün var mı kontrol et
  if (!req.session.cart) {
    req.session.promoMessage = "Add items to cart before applying promo code.";
    return res.redirect('/reservation');
  }
  
  // Kod doğruysa session'a indirim bilgisini ekle
  if (promo && promo.trim().toUpperCase() === validCode) {
    req.session.promo = { code: promo, discount };
    req.session.promoMessage = "Promo code applied! 10% discount.";
  } else {
    req.session.promo = null;
    req.session.promoMessage = "Invalid promo code.";
  }
  
  res.redirect('/reservation');
});

// Slot rezervasyon rotası
app.post('/reserve-slot', csrfProtection, async (req, res) => {
  try {
    const { slotId } = req.body;
    
    // Slot ID kontrol
    if (!slotId) {
      return res.status(400).render("error", {
        errorCode: 400,
        errorMessage: "Invalid Request",
        errorDetail: "Please select a time slot."
      });
    }
    
    // Slot bilgilerini al
    const slot = await slotService.getSlotById(slotId);
    if (!slot) {
      return res.status(404).render("error", {
        errorCode: 404,
        errorMessage: "Time Slot Not Found",
        errorDetail: "The selected time slot is no longer available."
      });
    }
    
    // Slot'u rezerve et
    const reservationId = await slotService.reserveSlot(slotId);
    
    // Sepeti oluştur (Array formatında)
    if (!req.session.cart) req.session.cart = [];
    
    req.session.cart.push({
      classId: slot.classId,
      classTitle: slot.className,
      classImage: slot.classImage,
      classPrice: slot.price,
      slotDay: slot.day,
      slotDate: slot.date,
      slotTime: slot.time
    });
    
    // Checkout sayfasına yönlendir
    res.redirect('/checkout');
  } catch (error) {
    logger.error('Error in slot reservation:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "An error occurred during time slot reservation. Please try again later."
    });
  }
});


// Sepet nesne tipini kontrol etmek için helper
hbs.registerHelper('isObject', function(item) {
  return !Array.isArray(item) && typeof item === 'object' && item !== null;
});

// Yeni sepet formatı için helperlar
hbs.registerHelper('cartSubtotal', function(cart) {
  if (!cart) return "0.00";
  let price = parseFloat(cart.classPrice) || 0;
  return price.toFixed(2);
});

hbs.registerHelper('cartDiscount', function(cart, promo) {
  if (!cart || !promo || !promo.discount) return "0.00";
  let price = parseFloat(cart.classPrice) || 0;
  return (price * promo.discount).toFixed(2);
});

hbs.registerHelper('cartDiscountedSubtotal', function(cart, promo) {
  if (!cart) return "0.00";
  let price = parseFloat(cart.classPrice) || 0;
  if (promo && promo.discount) {
    price = price * (1 - promo.discount);
  }
  return price.toFixed(2);
});

hbs.registerHelper('cartTax', function(cart, promo, taxRate = 0.13) {
  if (!cart) return "0.00";
  let price = parseFloat(cart.classPrice) || 0;
  if (promo && promo.discount) {
    price = price * (1 - promo.discount);
  }
  return (price * taxRate).toFixed(2);
});

hbs.registerHelper('cartTotal', function(cart, promo, taxRate = 0.13) {
  if (!cart) return "0.00";
  let price = parseFloat(cart.classPrice) || 0;
  if (promo && promo.discount) {
    price = price * (1 - promo.discount);
  }
  let tax = price * taxRate;
  return (price + tax).toFixed(2);
});

// Eski sepet formatı için helperlar
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

// taxAmount helper fonksiyonu
hbs.registerHelper('taxAmount', function(array, rate) {
  if (!array || !Array.isArray(array) || array.length === 0) return "0.00";
  
  let total = 0;
  array.forEach(item => {
    let val = item["classPrice"];
    if (typeof val === "string") val = val.replace(/[^0-9.]/g, "");
    total += parseFloat(val) || 0;
  });
  
  // 0 değerinde tax rate olmamalı
  const taxRate = (rate === undefined || rate === null || isNaN(rate)) ? 0.13 : rate;
  return (total * taxRate).toFixed(2);
});

// totalCost helper fonksiyonu
hbs.registerHelper('totalCost', function(array, discount, taxRate) {
  if (!array || !Array.isArray(array) || array.length === 0) return "0.00";
  
  let subtotal = 0;
  array.forEach(item => {
    let val = item["classPrice"];
    if (typeof val === "string") val = val.replace(/[^0-9.]/g, "");
    subtotal += parseFloat(val) || 0;
  });
  
  // İndirim varsa uygula
  discount = (discount === undefined || discount === null) ? 0 : discount;
  if (discount) {
    subtotal = subtotal * (1 - discount);
  }
  
  // 0 değerinde tax rate olmamalı
  const effectiveTaxRate = (taxRate === undefined || taxRate === null || isNaN(taxRate)) ? 0.13 : taxRate;
  
  // Vergiyi ekle
  let tax = subtotal * effectiveTaxRate;
  
  // Toplamı döndür
  return (subtotal + tax).toFixed(2);
});


// GET alternative slot reservation route - ENGLISH ERROR MESSAGES
app.get('/select-slot/:slotId', async (req, res) => {
  try {
    const { slotId } = req.params;
    
    if (!slotId) {
      return res.status(400).render("error", {
        errorCode: 400,
        errorMessage: "Invalid Request",
        errorDetail: "Please select a time slot."
      });
    }
    
    // Get session ID
    const sessionId = req.session.id;
    
    // Get slot details
    const slot = await slotService.getSlotById(slotId);
    if (!slot) {
      return res.status(404).render("error", {
        errorCode: 404,
        errorMessage: "Time Slot Not Found",
        errorDetail: "The selected time slot is no longer available."
      });
    }
    
    // Get related class details
    const classItem = await Class.findById(slot.classId);
    
    // Create temporary reservation
    const reservation = await slotService.createTemporaryReservation(slotId, sessionId);
    
    // Save cart info to session (new format)
    req.session.cart = {
      classId: classItem._id,
      classSlug: classItem.slug,
      classTitle: classItem.title,
      classImage: classItem.image,
      classPrice: classItem.price.value,
      slotId: slot._id,
      slotDay: slot.dayOfWeek,
      slotDate: new Date(slot.startDate).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      slotTime: `${slot.time.start} – ${slot.time.end}`,
      reservationId: reservation._id,
      reservationExpiresAt: reservation.expiresAt
    };
    
    // Redirect to checkout page
    res.redirect('/checkout');
  } catch (error) {
    logger.error(`Error adding slot to cart: ${req.params.slotId}`, error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDetail: "Something went wrong. Please try again later."
    });
  }
});

// Rezervasyon iptal rotası - rezervasyon token kontrolü ile
app.post('/cancel-reservation', validateReservationToken, (req, res) => {
  // Sepeti kontrol et
  if (!req.session.cart) {
    return res.redirect('/learn');
  }
  
  // Rezervasyon ID'si varsa iptal et
  if (!Array.isArray(req.session.cart) && req.session.cart.reservationId) {
    try {
      slotService.cancelReservation(req.session.cart.reservationId).catch(err => {
        logger.error('Error canceling reservation:', err);
      });
    } catch (error) {
      logger.error('Error in cancel reservation handler:', error);
    }
  }
  
  // Sepeti temizle
  delete req.session.cart;
  req.session.promo = null;
  req.session.promoMessage = null;
  
  res.redirect('/learn');
});

// Checkout bilgilerini işleme rotası
app.post('/checkout-info', csrfProtection, async (req, res) => {
  console.log('CHECKOUT-INFO ROUTE HANDLER TRIGGERED');
  try {
    // Debug için
    logger.debug('Checkout form data:', {
      ...req.body,
      _csrf: '[REDACTED]',
      recaptchaToken: req.body.recaptchaToken ? '[REDACTED]' : ''
    });
    logger.debug('Current session cart:', req.session.cart);
    logger.debug('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
    
    // Form verilerini al
    const { firstName, lastName, email, contactNumber, address, company } = req.body;
    
    // Email doğrulama
    const validEmail = Array.isArray(email) ? email.find(e => e.trim() !== '') : email;
    if (!validEmail) {
      return res.status(400).render("error", {
        errorCode: 400,
        errorMessage: "Invalid Email",
        errorDetail: "Please provide a valid email address."
      });
    }
    
    // Kullanıcı bilgilerini session'a kaydet
    req.session.checkoutInfo = {
      firstName, 
      lastName,
      email: validEmail,
      contactNumber,
      address,
      company
    };
    
    // Sepette ürün var mı kontrol et
    if (!req.session.cart) {
      logger.error('Checkout attempted with empty cart');
      return res.status(400).render("error", {
        errorCode: 400, 
        errorMessage: "Empty Cart",
        errorDetail: "Your cart is empty. Please add items before checkout."
      });
    }
    
    // Stripe checkout session oluştur ve yönlendir
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    let lineItems = [];
    
    // Sepet nesne ise
    if (req.session.cart && !Array.isArray(req.session.cart)) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: req.session.cart.classTitle,
            description: `${req.session.cart.slotDate} ${req.session.cart.slotTime}`,
          },
          unit_amount: Math.round(parseFloat(req.session.cart.classPrice) * 100),
        },
        quantity: 1,
      });
      
      logger.info(`Created line item for: ${req.session.cart.classTitle}`);
    } 
    // Sepet dizi ise
    else if (req.session.cart && Array.isArray(req.session.cart)) {
      req.session.cart.forEach(item => {
        lineItems.push({
          price_data: {
            currency: 'cad',
            product_data: {
              name: item.classTitle,
              description: `${item.slotDate} ${item.slotTime}`,
            },
            unit_amount: Math.round(parseFloat(item.classPrice) * 100),
          },
          quantity: 1,
        });
      });
      
      logger.info(`Created ${lineItems.length} line items for cart`);
    }
    
    // Domain bilgisini kontrol et ve varsayılan değer atar
    const domain = process.env.NODE_ENV === 'production' 
  ? process.env.DOMAIN || 'https://heartpotterystudio-webproject.onrender.com'
  : 'http://localhost:5000';
    
    // Checkout session oluştur
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${domain}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/checkout`,
      customer_email: validEmail,
      client_reference_id: req.session.reservationToken || '',
      metadata: {
        firstName,
        lastName,
        contactNumber
      }
    });
    
    logger.info(`Stripe session created: ${session.id}`);
    logger.info(`Redirecting to Stripe URL: ${session.url}`);
    
    // Stripe checkout sayfasına yönlendir (düzeltilmiş indentasyon)
    
    return res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Redirecting to payment...</title>
    <meta http-equiv="refresh" content="3;url=${session.url}">
    <style>
      body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
      .spinner { width: 40px; height: 40px; margin: 20px auto; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <h2>Redirecting to payment page...</h2>
    <div class="spinner"></div>
    <p>If you are not redirected automatically, <a href="${session.url}">click here</a>.</p>
    <script nonce="${res.locals.nonce}">
      // Hem setTimeout hem de meta refresh kullanıyoruz (yedek olarak)
      setTimeout(function() {
        window.location.href = "${session.url}";
      }, 1500);
    </script>
  </body>
  </html>
`);
  } catch (error) {
    logger.error('Error in checkout process:', error);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Payment Error",
      errorDetail: "An error occurred during checkout process. Please try again."
    });
  }
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

// Stripe Checkout oturumu oluşturma route'u - validateReservationToken ile
app.post('/create-checkout-session', csrfProtection, validateReservationToken, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Sepet boş mu kontrol et
    if (!req.session.cart) {
      return res.status(400).send('Cart is empty.');
    }
    
    let cartItem, price, reservationId, cancelUrl;
    
    // Eski format (dizi) kontrolü
    if (Array.isArray(req.session.cart)) {
      if (req.session.cart.length === 0) {
        return res.status(400).send('Cart is empty.');
      }
      
      cartItem = req.session.cart[0];
      price = parseFloat(cartItem.classPrice.replace(/[^0-9.]/g, ""));
      reservationId = null; // Eski formatta rezervasyon ID'si yok
      cancelUrl = "/checkout";
    } 
    // Yeni format (nesne) kontrolü
    else {
      cartItem = req.session.cart;
      price = parseFloat(cartItem.classPrice);
      reservationId = cartItem.reservationId;
      cancelUrl = "/reservation";
      
      // Müşteri email'ini session'a kaydet (payment-success endpoint'i için)
      req.session.customerEmail = email;
    }
    
    // Promo kodu indirimini uygula
    if (req.session.promo && req.session.promo.discount) {
      price = price * (1 - req.session.promo.discount);
    }
    
    // Stripe Checkout oturumu oluştur
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: cartItem.classTitle,
            images: [cartItem.classImage],
          },
          unit_amount: Math.round(price * 100), // Cent'e çevir
        },
        quantity: 1,
      }],
      mode: 'payment',
      client_reference_id: reservationId, // Rezervasyon ID'si, webhook için
      success_url: `${domain}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}${cancelUrl}`,
    });
    
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Created Stripe checkout session: ${session.id} with amount: ${price}`);
    }
    
    res.redirect(303, session.url);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      logger.error('Error creating Stripe Checkout session:', error.message);
    }
    res.status(500).send('Internal Server Error');
  }
});

// Stripe Webhook Route - GÜNCELLENDİ: Rezervasyon onayı eklendi
app.post('/api/payment/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Ödeme başarılı event'i
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    logger.info('Payment successful for session:', session.id);
    
    // Rezervasyon ID'si varsa rezervasyonu onayla
    const reservationId = session.client_reference_id;
    if (reservationId) {
      slotService.confirmReservation(reservationId, {
        email: session.customer_email
      }).then(() => {
        logger.info(`Webhook: Reservation confirmed: ${reservationId}`);
      }).catch(err => {
        logger.error(`Webhook: Error confirming reservation ${reservationId}:`, err);
      });
    } else {
      logger.info('Webhook: No reservation ID in session');
    }
  }

  res.status(200).send('Received webhook');
});

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
  if (err.code === 'EBADCSRFTOKEN') {
    if (process.env.NODE_ENV !== 'production') {
      logger.error('CSRF Token Validation Failed');
      logger.error('Request Headers:', req.headers);
      logger.error('Request Body:', {
        ...req.body,
        _csrf: '[REDACTED]', // CSRF tokeni maskele
        recaptchaToken: req.body.recaptchaToken ? '[REDACTED]' : '', // reCAPTCHA tokeni maskele
      });
      logger.error('CSRF Cookie:', '[REDACTED]'); // CSRF cookie maskele
    }
    
    // JSON yanıtı yerine kullanıcı dostu hata sayfası göster
    return res.status(403).render("error", {
      errorCode: 403,
      errorMessage: "Security Verification Failed",
      errorDetail: "Please refresh the page and try again."
    });
  }
  next(err);
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`🚀 Server is running on port ${PORT}`));