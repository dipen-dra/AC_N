const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const { authenticateUser } = require("./middleware/auth");

// Load Environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Global Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true, // Allow any origin dynamically (useful for local IP testing)
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

// Start listening on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express MERN server is running on port ${PORT} (0.0.0.0)`);
});
