const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, 
    });
    logger.info("✅ MongoDB Connected Successfully!");
  } catch (error) {
    logger.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); 
  }
};

module.exports = connectDB;
