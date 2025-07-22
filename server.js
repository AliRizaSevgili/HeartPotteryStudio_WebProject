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

// Stripe modülü
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Stripe modülü

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
    sameSite: 'strict' // CSRF saldırılarına karşı koruma
  }
}));

// Cookie Parser Middleware
app.use(cookieParser()); // CSRF'den önce

// CSRF Middleware
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Yeni CSRF tokeni sağlayan rota
app.get('/get-csrf-token', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('CSRF token requested');
  }
  res.json({ csrfToken: req.csrfToken() });
});

// Form gönderim loglarını kontrol et
app.post('/checkout-info', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Request body:', {
      ...req.body,
      _csrf: '[REDACTED]', // CSRF tokeni maskele
      recaptchaToken: req.body.recaptchaToken ? '[REDACTED]' : '', // reCAPTCHA tokeni maskele
    });
  }

  // `email` alanını işleme
  const { email, firstName, lastName, company, contactNumber, address } = req.body;
  const validEmail = Array.isArray(email) ? email.find(e => e.trim() !== '') : email;

  if (!validEmail) {
    return res.status(400).send('Invalid email address.');
  }

  // İşlenmiş verilerle devam edin
  console.log('Processed email:', validEmail);

  // ...form işleme kodları...
  res.status(200).send('Form submitted successfully.');
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
    promoMessage,
    csrfToken: req.csrfToken() // CSRF tokeni view'a gönderiliyor
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

// Stripe Checkout oturumu oluşturma route'u
app.post('/create-checkout-session', csrfProtection, async (req, res) => {
  try {
    const { email } = req.body;

    // Sepet kontrolü
    if (!req.session.cart || req.session.cart.length === 0) {
      return res.status(400).send('Cart is empty.');
    }

    // Stripe Checkout oturumu oluştur
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email, // Kullanıcıdan gelen email
      line_items: req.session.cart.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.classTitle,
            images: [item.classImage],
          },
          unit_amount: Math.round(parseFloat(item.classPrice) * 100), // Cent'e çevir
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/payment-success`,
      cancel_url: `${req.protocol}://${req.get('host')}/checkout`,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('Stripe session created:', session.id);
    }

    res.redirect(303, session.url);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error creating Stripe Checkout session:', error.message);
    }
    res.status(500).send('Internal Server Error');
  }
});

// Stripe Webhook Route
app.post('/api/payment/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Event türüne göre işlem yap
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Payment successful for session:', session.id);
    // Ödeme sonrası işlemler burada yapılabilir
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
      console.error('CSRF Token Validation Failed');
      console.error('Request Headers:', req.headers);
      console.error('Request Body:', {
        ...req.body,
        _csrf: '[REDACTED]', // CSRF tokeni maskele
        recaptchaToken: req.body.recaptchaToken ? '[REDACTED]' : '', // reCAPTCHA tokeni maskele
      });
      console.error('CSRF Cookie:', '[REDACTED]'); // CSRF cookie maskele
    }
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next(err);
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




