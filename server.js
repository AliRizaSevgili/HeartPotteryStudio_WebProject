require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const galleryRoutes = require("./routes/galleryRoutes");

const app = express();
const hbs = require("hbs");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false, 
  })
);

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

app.use(express.static(path.join(__dirname, "public")));

// MongoDB 
connectDB();

// API Routes
console.log("✅ Server loaded galleryRoutes!");
app.use("/api/gallery", galleryRoutes);

app.get("/favicon.ico", (req, res) => {
  res.redirect("https://res.cloudinary.com/dnemf1asq/image/upload/v1738886856/132204918_312399920214874_1423945434468733240_n_jf9vhp.ico");
});

// Main Pages Routes
app.get("/", (req, res) => {
  res.render("homepage", {
    layout: "layouts/main", 
    title: "Heart Pottery Studio",
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

app.get("/gallery", (req, res) => {
  res.render("gallery", { 
    layout: "layouts/main", 
    title: "Art Gallery",
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
  title: "Get in Touch",
  activeContact: true
   });
});

app.get("/login", (req, res) => {
  res.render("login", { layout: "layouts/main", title: "Sign In" });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
