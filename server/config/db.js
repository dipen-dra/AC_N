const mongoose = require("mongoose");
const seedDatabase = require("../utils/seed");

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/autocare_nepal";
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully.");
    // Run seed checking
    await seedDatabase();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
