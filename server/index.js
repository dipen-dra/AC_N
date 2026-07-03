const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const { authenticateUser } = require("./middleware/auth");

// Load Environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Global Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:8080", "http://localhost:8081"],
  credentials: true
}));
app.use(authenticateUser);

// API Route Handlers
app.use("/api/auth", require("./routes/auth"));
app.use("/api/services", require("./routes/services"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/admin", require("./routes/admin"));

// Fallback error catcher
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Server error occurred." });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Express MERN server is running on port ${PORT}`);
});
