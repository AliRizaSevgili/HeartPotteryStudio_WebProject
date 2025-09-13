# Heart Pottery Studios

Heart Pottery Studios is a full-stack web application for a Toronto-based ceramics studio. The project provides a robust platform for managing pottery classes, studio memberships, events, reservations, and customer communications. It is built with Node.js, Express, MongoDB, and Handlebars, and is optimized for performance, SEO, and scalability.

---

## 🛠️ Technologies Used

- **Backend:**  
  - Node.js (v18+)
  - Express.js (RESTful routing, middleware, error handling)
  - Mongoose (MongoDB ODM, schema validation, population)
  - Nodemailer (SMTP email integration)
  - dotenv (environment variable management)
  - Winston (logging utility)

- **Frontend:**  
  - Handlebars (HBS) templating engine
  - Tailwind CSS (utility-first CSS framework)
  - Vanilla JavaScript (dynamic UI, form validation, lazy loading)

- **Database:**  
  - MongoDB Atlas (cloud database)
  - Schemas for Class, Event, Reservation, Contact, Membership, etc.

- **Media & Assets:**  
  - Cloudinary (image CDN, transformation, optimization)
  - Static assets served from `/public`

- **DevOps & Deployment:**  
  - Render.com (cloud deployment)
  - GitHub Actions (CI/CD, automated tests)
  - Environment variables for secrets and configuration

- **SEO & Analytics:**  
  - Meta tags, canonical URLs, robots.txt, sitemap.xml
  - Google Search Console integration
  - Lighthouse & GTmetrix performance monitoring

---

## 📦 Project Structure

```
HeartPottery/
├── controllers/      # Route controllers (business logic)
├── models/           # Mongoose schemas and models
├── views/            # Handlebars templates (.hbs)
├── public/           # Static files (CSS, JS, images)
├── scripts/          # Seed and utility scripts
├── utils/            # Helper functions, logger
├── LICENSE           # Apache 2.0 license
├── README.md         # Project documentation
└── .env.example      # Example environment variables
```

---

## 🚀 Key Features

- **Class Management:**  
  - CRUD operations for pottery classes
  - Weekly schedules, pricing, included materials, pickup info
  - Dynamic slot generation and availability tracking

- **Event System:**  
  - Admins can create, update, and publish studio events
  - Public event listing and RSVP functionality

- **Online Reservation & Payment:**  
  - Secure reservation forms with validation
  - Email confirmation and reminders via Nodemailer
  - Stripe/PayPal integration ready (optional)

- **Membership Application:**  
  - Studio membership application form
  - Admin review and approval workflow

- **Contact & FAQ:**  
  - Contact form with encrypted email/phone fields
  - Automated email responses
  - Dynamic FAQ management

- **Admin Panel (WIP):**  
  - Protected routes for managing classes, events, reservations, and users

- **Performance & SEO:**  
  - Lazy loading for images
  - Cloudinary image optimization (`f_auto,q_auto,dpr_auto`)
  - Canonical URLs, meta tags, sitemap.xml, robots.txt

---

## ⚙️ Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/[your-username]/HeartPottery.git
   cd HeartPottery
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```


3. **Seed the database (optional):**
   ```bash
   node scripts/seedDB.js
   ```

4. **Start the application:**
   ```bash
   npm start
   ```

---

## 🧩 API Endpoints

- `/classes` — List all pottery classes
- `/class/:slug` — Class details and reservation form
- `/events` — Upcoming events
- `/membership` — Membership application
- `/contact` — Contact form
- `/admin/*` — Admin panel (protected)

---

## 🛡️ Security & Best Practices

- Sensitive data (passwords, API keys) stored in `.env` (never committed)
- Email fields encrypted in the database
- Input validation and sanitization on all forms
- HTTPS enforced in production
- Rate limiting and logging for critical endpoints

---

## 📈 Performance & SEO

- Lighthouse score: 85+ (desktop), 75+ (mobile)
- GTmetrix grade: B/A
- Optimized images and static assets
- Canonical URLs and meta tags for all pages
- Sitemap and robots.txt for search engine indexing

---

## 💡 Contribution

Contributions are welcome!  
- Fork the repo  
- Create a feature branch  
- Commit your changes  
- Open a pull request

Please read the [LICENSE](LICENSE) before contributing.

---

## 📬 Contact

For questions, feedback, or partnership inquiries:  
**info@heartpotterystudios.com**

---

## 🔗 Live Demo

[https://www.heartpotterystudios.com](https://www.heartpotterystudios.com)

---

> Heart Pottery Studios — Empowering creativity through clay and
