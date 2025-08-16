require("dotenv").config();
const express = require("express");
const app = express();
app.set('trust proxy', 1); // Render gibi reverse proxy kullanılan ortamlar için gerekli
const path = require("path");
const partialsPath = path.join(__dirname, 'views', 'partials');

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
const eventRoutes = require('./routes/eventRoutes');
const hbs = require("hbs");
const contactController = require('./controllers/contactController');
const logger = require('./utils/logger');
const slotService = require('./services/slotService'); // Slot servisini import et
const emailService = require('./services/emailService'); // Email servis
const Class = require('./models/Class'); // Class modelini import et

// Stripe modülü
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Rate limiting aktif:
const rateLimit = require('express-rate-limit');
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 20, // IP başına maksimum istek
  standardHeaders: true, // Standart RateLimit header'ları ekle
  legacyHeaders: false, // X-RateLimit-* header'larını kaldır
  message: "Too many payment requests from this IP, please try again later.",
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).render("error", {
      errorCode: options.statusCode,
      errorMessage: "Too Many Requests",
      errorDetail: options.message
    });
  }
});


const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 10, // IP başına maksimum istek
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many contact form submissions from this IP, please try again later.",
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for contact form from IP: ${req.ip}`);
    res.status(options.statusCode).render("error", {
      errorCode: options.statusCode,
      errorMessage: "Too Many Requests",
      errorDetail: options.message
    });
  }
});;

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

// Log POST requests
// Debug logları için
if (process.env.DEBUG_MODE === 'true') {
  app.use((req, res, next) => {
    if (req.method === 'POST') {
      logger.info(`POST Request to: ${req.path}`);
      logger.info(`Session ID: ${req.session.id}`);
    }
    next();
  });
}

// Debug endpoint'ini sadece development veya debug modunda aktif et
if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_MODE === 'true') {
  app.get('/debug-slot', (req, res) => { /* ... */ });
}

// Sıkılaştırılmış CORS ayarı
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://heartpotterystudio-webproject.onrender.com' // Canlı ortam
    : 'http://localhost:5000', // Yerel geliştirme ortamı
  credentials: true // Çerezlerin gönderilmesine izin ver
}));

// Nonce oluşturma middleware'i - HER İSTEK için benzersiz
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  // Helmet için nonce'u request nesnesine de ekleyelim
  req.nonce = nonce; 
  next();
});

// Helmet Middleware - Dinamik nonce ve Stripe kaynaklarıyla
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "https://res.cloudinary.com"],
        imgSrc: [
          "'self'",
          "https://res.cloudinary.com",
          "data:",
          "https://*.stripe.com"
        ],
        mediaSrc: [
          "'self'",
          "https://res.cloudinary.com"
        ],
        frameSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://checkout.stripe.com",
          "https://js.stripe.com",
          "https://hooks.stripe.com"
        ],
        scriptSrc: [
          "'self'",
          (req, res) => `'nonce-${req.nonce}'`, // Dinamik nonce
          "https://cdn.jsdelivr.net",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://www.google.com/recaptcha/",
          "https://www.recaptcha.net",
          "https://checkout.stripe.com",
          "https://*.stripe.com",
          "https://js.stripe.com",
          "https://www.google-analytics.com",      // Google Analytics için eklendi
          "https://*.googletagmanager.com" ,
          "https://cdn.tailwindcss.com"
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
          "https://fonts.googleapis.com",
          "https://checkout.stripe.com",
          "https://cdn.tailwindcss.com"
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
          "https://www.recaptcha.net",
          "https://checkout.stripe.com",
          "https://api.stripe.com",
          "https://*.stripe.com",
          "https://cdn.stripe.com",
          "https://www.google-analytics.com",      // Google Analytics için eklendi
          "https://*.googletagmanager.com",
          "https://cdn.tailwindcss.com" 
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

// Session store için MongoStore ekleyin
const MongoStore = require('connect-mongo');


// --- SESSION MIDDLEWARE ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'heartpotterysecret',
  resave: false,  // MongoStore kullanırken false olmalı
  saveUninitialized: false, // İhtiyaç olmayan oturumları oluşturmayalım
  rolling: true, // Her istekte session süresini yeniler
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60, // 1 gün (saniye cinsinden)
    crypto: {
      secret: process.env.SESSION_SECRET || 'heartpotterysecret'
    },
    touchAfter: 24 * 3600 // 1 günde bir güncelleme (performans için)
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production' ? 
      (process.env.DISABLE_SECURE_COOKIE === 'true' ? false : true) : false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Cookie Parser Middleware
app.use(cookieParser()); // CSRF'den önce

// Flash middleware'ini buraya ekleyin
const flash = require('connect-flash');
app.use(flash());


// CSRF Middleware - Render'da DISABLE_CSRF 
const csrfProtection = csrf({ cookie: true });

// Eğer DISABLE_CSRF=true ise CSRF korumasını devre dışı bırak (sadece test için)
if (process.env.DISABLE_CSRF === 'true') {
  console.warn('⚠️ CSRF protection is disabled! This should only be used for testing.');
  // CSRF token olmadan da çalışacak sahte middleware
  app.use((req, res, next) => {
    req.csrfToken = () => 'csrf-disabled';
    next();
  });
} else {
  app.use(csrfProtection);
}

app.use((req, res, next) => {
  if (req.session && req.session.cart && Array.isArray(req.session.cart)) {
    let changed = false;
    req.session.cart = req.session.cart.map(item => {
      if (!item.cartItemId) {
        item.cartItemId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        changed = true;
      }
      return item;
    });
    
  }
  next();
});

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Session değişkenlerini şablonlara aktar - BURAYA EKLEYİN
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.cart = req.session.cart;
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
app.use('/', eventRoutes);
logger.info("✅ Server loaded galleryRoutes!");
app.use("/api/gallery", galleryRoutes);

app.get("/favicon.ico", (req, res) => {
  res.redirect("https://res.cloudinary.com/dnemf1asq/image/upload/v1738886856/132204918_312399920214874_1423945434468733240_n_jf9vhp.ico");
});

// Main Pages Routes
app.get("/", csrfProtection, (req, res) => {
  res.render("homepage", { 
    layout: "layouts/main", 
    title: "Home",
    activeHome: true,
    isHomepagePage: true,
    csrfToken: req.csrfToken() // CSRF token eklendi
  });
});

app.get("/about", (req, res) => {
  res.render("about", { 
    layout: "layouts/main", 
    title: "About",
    activeAbout: true
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

app.get("/returns", csrfProtection, (req, res) => {
  res.render("returns", { 
    layout: "layouts/main", 
    title: "Return & Refund",
    csrfToken: req.csrfToken() 
  });
});


// Payment success page - Rezervasyon onayı ve Order oluşturma yedek mekanizması
app.get("/checkout-success", async (req, res) => {
  const { session_id } = req.query;
  
  if (!session_id) {
    return res.redirect('/');
  }
  
  try {
    // Session bilgisini al
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logger.info(`Success page loaded for session: ${session_id}`);
    
    // Rezervasyon ID kontrolü
    const reservationId = session.client_reference_id || 
                         (session.metadata && session.metadata.reservationId) || 
                         null;
    
    if (reservationId) {
      logger.info(`Found reservation ID: ${reservationId} in success page`);
      
      // Eğer webhook çalışmadıysa burada da işlem yapabilirsiniz
      try {
        // Rezervasyon durumunu kontrol et
        const Reservation = require('./models/Reservation');
        const reservation = await Reservation.findById(reservationId);
        
        if (reservation && reservation.status === 'temporary') {
          logger.info(`Manual update of reservation status for: ${reservationId}`);
          
          // Metadata'dan müşteri bilgilerini al
          const metadata = session.metadata || {};
          let customerInfo = {};
          try {
            if (metadata.customerInfo) {
              customerInfo = JSON.parse(metadata.customerInfo);
            }
          } catch (e) {
            logger.error(`Error parsing customer info: ${e.message}`);
          }
          
          // Rezervasyonu güncelle
          await slotService.confirmReservation(reservationId, {
            email: session.customer_email || metadata.email || '',
            paymentId: session.payment_intent,
            paymentStatus: 'completed',
            stripeSessionId: session.id,
            customerInfo: {
              firstName: metadata.firstName || customerInfo.firstName || '',
              lastName: metadata.lastName || customerInfo.lastName || '',
              contactNumber: metadata.contactNumber || customerInfo.contactNumber || '',
              address: metadata.address || customerInfo.address || '',
              company: metadata.company || customerInfo.company || ''
            }
          });
          
          // Order objesi oluştur
          const Order = require('./models/Order');
          const newOrder = new Order({
            reservationId: reservationId,
            customerInfo: {
              firstName: metadata.firstName || customerInfo.firstName || '',
              lastName: metadata.lastName || customerInfo.lastName || '',
              email: session.customer_email || metadata.email || '',
              contactNumber: metadata.contactNumber || customerInfo.contactNumber || '',
              address: metadata.address || customerInfo.address || '',
              company: metadata.company || customerInfo.company || ''
            },
            paymentDetails: {
              amount: session.amount_total / 100,
              currency: session.currency,
              paymentId: session.payment_intent,
              sessionId: session.id,
              paymentMethod: 'stripe',
              paymentStatus: 'completed'
            },
            productName: metadata.productName || 'Pottery Class'
          });
          
          await newOrder.save();
          logger.info(`Manual order creation for reservation: ${reservationId}`);
          // Sipariş onay e-postası gönder
          try {
            await emailService.sendOrderConfirmation(newOrder);
            logger.info(`✅ Order confirmation email sent to: ${newOrder.customerInfo.email}`);
          } catch (emailError) {
            logger.error(`❌ Failed to send confirmation email: ${emailError.message}`);
            // Email hatası olsa bile işleme devam et
          }
        }
      } catch (error) {
        logger.error(`Error in checkout-success fallback: ${error.message}`);
      }
    } else {
      logger.warn(`No reservation ID found in success page for session: ${session_id}`);
    }
    
    // Sepeti temizle
    req.session.cart = null;
    req.session.reservationToken = null;
    req.session.promo = null;
    
    // Başarı sayfasına yönlendir
    res.render('payment-success', {
      layout: false, // Ana layout'u devre dışı bırak
      title: 'Payment Successful',
      orderNumber: session.payment_intent ? session.payment_intent.slice(-8) : 'Unknown'
    });
  } catch (error) {
    logger.error(`Error retrieving session: ${error.message}`);
    res.redirect('/');
  }
});

// Payment success page - GÜNCELLENDİ: Rezervasyon onayı eklendi
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
    
    // Session ID'yi al
    const { session_id } = req.query;
    
    // Sipariş numarası oluştur
    const orderNumber = session_id ? session_id.slice(-8) : 'Unknown';
    
    // Başarılı ödeme sayfasını göster
    res.render("payment-success", {
      layout: false,  // Ana layout'u devre dışı bırak
      title: "Payment Successful",
      orderNumber: orderNumber // Order numarasını ekle
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



app.post("/apply-promo", validateReservationToken, (req, res) => {
  const { promo } = req.body;
  const validCode = "HEART10";
  const discount = 0.10; // %10 indirim
  const referer = req.headers.referer || '';
  const isReservationFlow = referer.includes('/reservation');

  // Sepet kontrolü - hem dizi hem de nesne formatını destekler
  const hasItems = req.session.cart && 
    (Array.isArray(req.session.cart) ? req.session.cart.length > 0 : true);
  
  if (!hasItems) {
    req.session.promoMessage = "Add items to cart before applying promo code.";
  }
  // Kod kontrolü  
  else if (promo && promo.trim().toUpperCase() === validCode) {
    req.session.promo = { code: promo, discount };
    req.session.promoMessage = "Promo code applied! 10% discount.";
  } else {
    req.session.promo = null;
    req.session.promoMessage = "Invalid promo code.";
  }
  
  // Referans URL'e göre yönlendirme
  res.redirect(isReservationFlow ? '/reservation' : '/checkout');
});



// Slot rezervasyon rotası
app.post('/reserve-slot', csrfProtection, async (req, res) => {
  try {
    const { slotId } = req.body;
    
    if (!slotId) {
      logger.error('No slot ID provided');
      return res.status(400).redirect('/learn');
    }
    
    logger.info(`Starting slot reservation for slotId: ${slotId}`);
    logger.info(`Session ID: ${req.session.id}`);
    
    // Slot bilgilerini al
    const slot = await slotService.getSlotById(slotId);
    if (!slot) {
      logger.error(`Slot not found with ID: ${slotId}`);
      return res.status(404).redirect('/learn');
    }
    
    // Class bilgilerini al
    const classItem = await Class.findById(slot.classId);
    if (!classItem) {
      logger.error(`Class not found for slot: ${slotId}`);
      return res.status(404).redirect('/learn');
    }
    
    // Geçici rezervasyon oluştur
    const sessionId = req.session.id;
    const reservation = await slotService.createTemporaryReservation(slotId, sessionId);
    
    // Sepet bilgilerini session'a kaydet
    // Sepeti dizi olarak başlat (eğer yoksa)
  if (!req.session.cart || !Array.isArray(req.session.cart)) {
    req.session.cart = [];
  }

// Sepete yeni ürünü ekle
    req.session.cart.push({
      slotId: slot._id,
      slotDate: slot.date,
      slotTime: `${slot.time.start} - ${slot.time.end}`,
      classId: classItem._id,
      classTitle: classItem.title,
      classPrice: classItem.price,
      classImage: classItem.images[0] || '',
      reservationId: reservation._id,
      reservationExpiresAt: reservation.expiresAt
    });
    
    logger.info(`Cart saved to session: ${JSON.stringify(req.session.cart)}`);
    
    // Session'ı kaydet ve sonra yönlendir
    req.session.save(err => {
      if (err) {
        logger.error('Error saving session:', err);
      }
      
      // Checkout sayfasına yönlendir
      return res.redirect('/checkout');
    });
  } catch (error) {
    logger.error(`Error in reserve-slot: ${error.message}`, error);
    return res.status(500).redirect('/learn');
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
  const quantity = parseInt(cart.quantity || 1, 10);
  return (price * quantity).toFixed(2);
});

hbs.registerHelper('cartDiscount', function(cart, promo) {
  if (!cart || !promo || !promo.discount) return "0.00";
  let price = parseFloat(cart.classPrice) || 0;
  return (price * promo.discount).toFixed(2);
});

hbs.registerHelper('cartDiscount', function(cart, promo) {
  if (!cart || !promo || !promo.discount) return "0.00";
  let price = parseFloat(cart.classPrice) || 0;
  const quantity = parseInt(cart.quantity || 1, 10);
  return (price * quantity * promo.discount).toFixed(2);
});


hbs.registerHelper('cartTax', function(cart, promo, taxRate = 0.13) {
  if (!cart) return "0.00";
  let price = parseFloat(cart.classPrice) || 0;
  const quantity = parseInt(cart.quantity || 1, 10);
  if (promo && promo.discount) {
    price = price * (1 - promo.discount);
  }
  return (price * quantity * taxRate).toFixed(2);
});

hbs.registerHelper('cartTotal', function(cart, promo, taxRate = 0.13) {
  if (!cart) return "0.00";
  let price = parseFloat(cart.classPrice) || 0;
  const quantity = parseInt(cart.quantity || 1, 10);
  if (promo && promo.discount) {
    price = price * (1 - promo.discount);
  }
  let tax = price * taxRate;
  return ((price + tax) * quantity).toFixed(2);
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
      const quantity = parseInt(item.quantity || 1, 10);
      total += (parseFloat(val) || 0) * quantity;
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
      const quantity = parseInt(item.quantity || 1, 10);
      total += (parseFloat(val) || 0) * quantity;
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

// Sepette ürün var mı kontrolü
hbs.registerHelper('cartHasItems', function() {
  const cart = this.cart || this.session?.cart;
  
  if (!cart) return false;
  
  if (Array.isArray(cart)) {
    return cart.length > 0;
  } else {
    return Object.keys(cart).length > 0;
  }
});

// Sepetteki ürün sayısını hesapla
hbs.registerHelper('cartItemCount', function() {
  const cart = this.cart || this.session?.cart;
  
  if (!cart) return 0;
  
  if (Array.isArray(cart)) {
    return cart.length;
  } else {
    return 1; // Tek öğeli sepet
  }
});

// EŞİTLİK KARŞILAŞTIRMASI İÇİN HELPER - BURAYA EKLEYİN
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});

// ÇARPMA İŞLEMİ İÇİN HELPER - BURAYA EKLEYİN
hbs.registerHelper('multiply', function(a, b) {
  return parseFloat(a) * parseFloat(b);
});


// Sepet subtotal hesaplama (event ve class tipi için)
hbs.registerHelper('calculateSubtotal', function(cart) {
  if (!cart || !Array.isArray(cart) || cart.length === 0) return "0.00";
  
  let subtotal = 0;
  cart.forEach(item => {
    if (item.type === 'event') {
      subtotal += parseFloat(item.price) * (parseInt(item.quantity || 1, 10));
    } else {
      subtotal += parseFloat(item.classPrice) * (parseInt(item.quantity || 1, 10));
    }
  });
  
  return subtotal.toFixed(2);
});

// İndirim tutarı hesaplama
hbs.registerHelper('calculateDiscount', function(cart, discount) {
  if (!cart || !Array.isArray(cart) || cart.length === 0 || !discount) return "0.00";
  
  let subtotal = 0;
  cart.forEach(item => {
    const quantity = parseInt(item.quantity || 1, 10);
    if (item.type === 'event') {
      subtotal += parseFloat(item.price) * quantity;
    } else {
      subtotal += parseFloat(item.classPrice) * quantity;
    }
  });
  
  return (subtotal * discount).toFixed(2);
});

hbs.registerHelper('calculateTax', function(cart, discount = 0, taxRate = 0.13) {
  if (!cart || !Array.isArray(cart) || cart.length === 0) return "0.00";
  
  let taxableAmount = 0;
  cart.forEach(item => {
    const quantity = parseInt(item.quantity || 1, 10);
    let itemPrice = 0;
    
    if (item.type === 'event') {
      itemPrice = parseFloat(item.price);
    } else {
      itemPrice = parseFloat(item.classPrice);
    }
    
    // İndirim varsa uygula
    if (discount > 0) {
      itemPrice = itemPrice * (1 - parseFloat(discount));
    }
    
    // Quantity ile çarp ve vergiye tabi tutara ekle
    taxableAmount += itemPrice * quantity;
  });
  
  return (taxableAmount * parseFloat(taxRate)).toFixed(2);
});

// Toplam hesaplama
hbs.registerHelper('calculateTotal', function(cart, discount = 0, taxRate = 0.13) {
  if (!cart || !Array.isArray(cart) || cart.length === 0) return "0.00";
  
  let total = 0;
  cart.forEach(item => {
    const quantity = parseInt(item.quantity || 1, 10);
    let itemPrice = 0;
    
    if (item.type === 'event') {
      itemPrice = parseFloat(item.price);
    } else {
      itemPrice = parseFloat(item.classPrice);
    }
    
    // İndirim varsa uygula
    if (discount > 0) {
      itemPrice = itemPrice * (1 - parseFloat(discount));
    }
    
    // Vergi ekle
    const withTax = itemPrice * (1 + parseFloat(taxRate));
    
    // Quantity ile çarp ve toplama ekle
    total += withTax * quantity;
  });
  
  return total.toFixed(2);
});


// Quantity için çarpma işlemi helper'ı
hbs.registerHelper('multiply', function(a, b) {
  return (parseFloat(a) * parseInt(b, 10)).toFixed(2);
});

// Quantity formatı için helper
hbs.registerHelper('formatQuantity', function(quantity) {
  const qty = parseInt(quantity, 10) || 1;
  return qty === 1 ? '1 Person' : `${qty} People`;
});

// Karşılaştırma helper'ı (quantity seçiminde kullanılacak)
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});

// For döngüsü helper'ı (select options oluşturmak için)
hbs.registerHelper('for', function(from, to, block) {
  let result = '';
  for (let i = from; i <= to; i++) {
    result += block.fn(i);
  }
  return result;
});


// GET alternative slot reservation route - ENGLISH ERROR MESSAGES
app.get('/select-slot/:slotId', async (req, res) => {
  try {
    const { slotId } = req.params;
    const quantity = parseInt(req.query.quantity || 1, 10); // Quantity parametresi eklendi
    
    logger.info(`====== SLOT SELECTION DEBUG ======`);
    logger.info(`Slot ID: ${slotId}`);
    logger.info(`Quantity: ${quantity}`);
    logger.info(`Session ID: ${req.session.id}`);
    logger.info(`Session cart before: ${JSON.stringify(req.session.cart)}`);

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
    
    // Kapasite kontrolü - quantity'ye göre kontrol
    if (slot.bookedSlots + quantity > slot.totalSlots) {
      return res.status(409).render("error", {
        errorCode: 409,
        errorMessage: "Not Enough Capacity",
        errorDetail: `Sorry, only ${slot.totalSlots - slot.bookedSlots} seats available for this slot.`
      });
    }
    
    // Get related class details
    const classItem = await Class.findById(slot.classId);
    
    // Sepeti dizi olarak başlat (eğer yoksa)
    if (!req.session.cart || !Array.isArray(req.session.cart)) {
      req.session.cart = [];
    }
    
    // Sepette aynı slot var mı kontrol et
    const existingItemIndex = req.session.cart.findIndex(item => 
      item.slotId && item.slotId.toString() === slotId.toString()
    );
    
    // Create temporary reservation with quantity
    const reservation = await slotService.createTemporaryReservation(slotId, sessionId, quantity);
    
    if (existingItemIndex !== -1) {
      // Varolan öğeyi güncelle
      req.session.cart[existingItemIndex].quantity = quantity;
      req.session.cart[existingItemIndex].reservationId = reservation._id;
      req.session.cart[existingItemIndex].reservationExpiresAt = reservation.expiresAt;
      
      logger.info(`Updated cart item with new quantity: ${quantity} for slot: ${slotId}`);
    } else {
      // Sepete yeni ürünü ekle
      req.session.cart.push({
        cartItemId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
        reservationExpiresAt: reservation.expiresAt,
        quantity: quantity // Quantity eklendi
      });
    }
    
    // Yeni ürün eklenince promo kodunu sıfırla
    req.session.promo = null;
    req.session.promoMessage = null;
    
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
  logger.info('CHECKOUT-INFO ROUTE HANDLER TRIGGERED');
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
    
    const taxRate = 0.13;
    
    // Rezervasyon ID'sini belirle - her iki sepet formatını destekleyecek şekilde
    let reservationId = null;
    let productName = '';
    
    // Sepet nesne ise
    if (req.session.cart && !Array.isArray(req.session.cart)) {
      let price = parseFloat(req.session.cart.classPrice);
      
      // Rezervasyon ID'sini al
      if (req.session.cart.reservationId) {
        reservationId = req.session.cart.reservationId;
        logger.info(`Found reservationId in cart object: ${reservationId}`);
      }
      
      productName = req.session.cart.classTitle;
      
      // Quantity değerini al (varsayılan olarak 1)
      const quantity = parseInt(req.session.cart.quantity || 1, 10);
      
      // Promo kodu indirimini uygula
      if (req.session.promo && req.session.promo.discount) {
        price = price * (1 - req.session.promo.discount);
      }
      
      // Vergiyi ekle
      const totalAmount = price + (price * taxRate);
      
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: req.session.cart.classTitle,
            description: `${req.session.cart.slotDate} ${req.session.cart.slotTime} (incl. 13% tax)`,
          },
          unit_amount: Math.round(totalAmount * 100), // Vergi dahil toplam
        },
        quantity: quantity, // Sepetteki quantity değerini kullan
      });
      
      logger.info(`Created line item for: ${req.session.cart.classTitle} with quantity: ${quantity}, tax, total: ${totalAmount}`);
} 
    // Sepet dizi ise
    else if (req.session.cart && Array.isArray(req.session.cart)) {
      // Dizi formatında ilk elemanda rezervasyon ID'si var mı kontrol et
      if (req.session.cart.length > 0 && req.session.cart[0].reservationId) {
        reservationId = req.session.cart[0].reservationId;
        logger.info(`Found reservationId in cart array: ${reservationId}`);
      }
      
      req.session.cart.forEach(item => {
        let price;
        let name;
        let description;
        let quantity = 1;
        
        // Event tipindeki ürünler için
        if (item.type === 'event') {
          price = parseFloat(item.price || 0);
          name = item.eventTitle || 'Event';
          description = `${item.eventDate || ''} ${item.eventTime || ''}`;
          quantity = parseInt(item.quantity) || 1;
          
          // Ürün adını güncelle
          if (!productName) productName = name;
          
          // Debug için
          logger.debug('Event item debug:', {
            title: name,
            originalPrice: item.price,
            parsedPrice: price,
            quantity: quantity
          });
        } 
        
        // Class tipindeki ürünler için
            else {
              price = parseFloat(item.classPrice || 0);
              name = item.classTitle || 'Class';
              description = `${item.slotDate || ''} ${item.slotTime || ''}`;
              quantity = parseInt(item.quantity || 1, 10); // Class tipi için quantity eklendi
              
              // Ürün adını güncelle
              if (!productName) productName = name;
              
              // Debug için
              logger.debug('Class item debug:', {
                title: name,
                originalPrice: item.classPrice,
                parsedPrice: price,
                quantity: quantity
              });
            }
        
        // NaN kontrolü ekle
        if (isNaN(price)) {
          logger.error('Invalid price detected:', item);
          price = 0; // Geçersiz fiyat durumunda 0 kullan
        }
        
        // Promo kodu indirimini uygula
        if (req.session.promo && req.session.promo.discount) {
          price = price * (1 - req.session.promo.discount);
        }
        
        // Vergiyi ekle
        const totalAmount = price + (price * taxRate);
        
        lineItems.push({
          price_data: {
            currency: 'cad',
            product_data: {
              name: name,
              description: `${description} (incl. 13% tax)`,
            },
            unit_amount: Math.round(totalAmount * 100), // Vergi dahil toplam
          },
          quantity: quantity
        });
      });
      
      logger.info(`Created ${lineItems.length} line items for cart with tax included`);
    }
    
    // Domain bilgisini kontrol et ve varsayılan değer atar
    const domain = process.env.NODE_ENV === 'production' 
      ? process.env.DOMAIN || 'https://heartpotterystudio-webproject.onrender.com'
      : 'http://localhost:5000';
    
    // Müşteri bilgileri JSON formatına çevir
    const customerInfoJSON = JSON.stringify({
      firstName,
      lastName,
      email: validEmail,
      contactNumber,
      address,
      company
    });
    
    // Checkout session oluştur
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      locale: 'auto', 
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      success_url: `${domain}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/checkout`,
      customer_email: validEmail,
      // Rezervasyon ID'si varsa client_reference_id olarak kullan, yoksa fallback olarak reservationToken'ı kullan
      client_reference_id: reservationId || req.session.reservationToken || undefined,
      metadata: {
        // Müşteri bilgileri
        firstName,
        lastName,
        email: validEmail,
        contactNumber,
        address,
        company,
        // Müşteri bilgilerinin JSON formatı (daha kolay parse etmek için)
        customerInfo: customerInfoJSON,
        // Rezervasyon ve ürün bilgileri
        reservationId: reservationId || '',
        productName: productName || 'Pottery Class',
        // İşlem detayları
        hasPromo: req.session.promo ? 'true' : 'false',
        promoDiscount: req.session.promo ? req.session.promo.discount.toString() : '',
        taxRate: taxRate.toString()
      }
    });
            
    logger.info(`Stripe session created: ${session.id}`);
    logger.info(`Redirecting to Stripe URL: ${session.url}`);
    logger.info(`Session data: ${JSON.stringify({
      id: session.id,
      payment_status: session.payment_status || 'unknown',
      url: session.url
    })}`);
    
    // Stripe checkout sayfasına yönlendir (düzeltilmiş indentasyon)
    
   return res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Redirecting to payment...</title>
    <meta http-equiv="refresh" content="0;url=${session.url}">
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
  // Doğrudan replace ile yönlendir (daha güvenilir)
  window.location.replace("${session.url}");
    </script>
  </body>
  </html>
`);
  } catch (error) {
    logger.error('Error in checkout process:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      stripeKey: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 8) + '...' : 'undefined'
    });
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

    // Aşağıdaki kodu ekleyin - Vergiyi hesapla ve toplam tutara ekle
      const taxRate = 0.13; // HST 13%
      const totalAmount = price + (price * taxRate);

      // Domain bilgisini tanımla (BURAYA EKLEYİN)
      const domain = process.env.NODE_ENV === 'production' 
        ? process.env.DOMAIN || 'https://heartpotterystudio-webproject.onrender.com'
        : 'http://localhost:5000';
          
            // Quantity değerini al (varsayılan olarak 1)
const quantity = parseInt(cartItem.quantity || 1, 10);

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
        description: `${cartItem.slotDate} ${cartItem.slotTime} (incl. 13% tax)`,
      },
      unit_amount: Math.round(totalAmount * 100),
    },
    quantity: quantity,
  }],
  mode: 'payment',
  locale: 'en',
  ...(reservationId ? { client_reference_id: reservationId } : {}),
  success_url: `${domain}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${req.protocol}://${req.get('host')}${cancelUrl}`,
});

// Session URL'ine yönlendir
res.redirect(303, session.url);

  } catch (error) {
    logger.error(`Error creating checkout session: ${error.message}`);
    res.status(500).render("error", {
      errorCode: 500,
      errorMessage: "Payment Error",
      errorDetail: "An error occurred while creating your checkout session. Please try again."
    });
  }
});

// Stripe Webhook Route - Artık ayrı bir rota olarak düzgün şekilde tanımlandı
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  logger.info('Webhook event received');
  
  try {
    // Daha ayrıntılı hata yakalama
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      logger.info(`Webhook event type: ${event.type}`);
    } catch (err) {
      logger.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Payment completion olayı
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      logger.info(`Payment completed for session: ${session.id}`);
      
      // Veri kontrolü ve logging
      logger.info(`Session client_reference_id: ${session.client_reference_id || 'NOT_FOUND'}`);
      logger.info(`Session metadata: ${JSON.stringify(session.metadata || {})}`);
      
      const reservationId = session.client_reference_id || 
                           (session.metadata && session.metadata.reservationId) || 
                           null;
      
      if (!reservationId) {
        logger.error('❌ No reservation ID found in session');
        return res.status(200).send('Webhook received but no reservation ID found');
      }
      
      logger.info(`✅ Processing reservation: ${reservationId}`);
      
      try {
        // 1. Müşteri bilgilerini al
        const metadata = session.metadata || {};
        let customerInfo = {};
        try {
          if (metadata.customerInfo) {
            customerInfo = JSON.parse(metadata.customerInfo);
          }
        } catch (e) {
          logger.error(`Error parsing customer info: ${e.message}`);
        }
        
        // 2. Rezervasyonu güncelle
        await slotService.confirmReservation(reservationId, {
          email: session.customer_email || metadata.email,
          paymentId: session.payment_intent,
          paymentStatus: 'completed',
          stripeSessionId: session.id,
          customerInfo: {
            firstName: metadata.firstName || customerInfo.firstName || '',
            lastName: metadata.lastName || customerInfo.lastName || '',
            contactNumber: metadata.contactNumber || customerInfo.contactNumber || '',
            address: metadata.address || customerInfo.address || '',
            company: metadata.company || customerInfo.company || ''
          }
        });
        
        // 3. Order objesi oluştur
        const Order = require('./models/Order');
        const newOrder = new Order({
          reservationId: reservationId,
          customerInfo: {
            firstName: metadata.firstName || customerInfo.firstName || '',
            lastName: metadata.lastName || customerInfo.lastName || '',
            email: session.customer_email || metadata.email || '',
            contactNumber: metadata.contactNumber || customerInfo.contactNumber || '',
            address: metadata.address || customerInfo.address || '',
            company: metadata.company || customerInfo.company || ''
          },
          paymentDetails: {
            amount: session.amount_total / 100,
            currency: session.currency,
            paymentId: session.payment_intent,
            sessionId: session.id,
            paymentMethod: 'stripe',
            paymentStatus: 'completed'
          },
          productName: metadata.productName || 'Pottery Class'
        });
        
        // 4. Order kaydet
        await newOrder.save();
        logger.info(`✅ Order created for reservation: ${reservationId}`);

        // 5. Sipariş onay e-postası gönder
        try {
          await emailService.sendOrderConfirmation(newOrder);
          logger.info(`✅ Order confirmation email sent to: ${newOrder.customerInfo.email}`);
        } catch (emailError) {
          logger.error(`❌ Failed to send confirmation email: ${emailError.message}`);
          // Email hatası olsa bile işleme devam et
        }
      } catch (error) {
        logger.error(`❌ Error processing webhook: ${error.message}`);
        logger.error(error.stack);
      }
    }
    
    res.status(200).send('Webhook processed successfully');
  } catch (err) {
    logger.error(`Unhandled webhook error: ${err.message}`);
    logger.error(err.stack);
    res.status(500).send('Internal Server Error');
  }
  
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





// CSRF Token fallback endpoint
app.post('/api/get-csrf-token', (req, res) => {
  res.json({ 
    csrfToken: req.csrfToken ? req.csrfToken() : 'csrf-disabled',
    success: true
  });
});