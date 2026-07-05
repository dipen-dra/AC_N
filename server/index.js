const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const helmet = require('helmet');
const dotenv = require('dotenv');

const connectDB = require("./config/db");
const { authenticateUser } = require("./middleware/auth");

// Load Environment variables
dotenv.config();

const app = express();

// ========== SECURITY HEADERS ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5173", "http://192.168.1.103:5173", "http://192.168.1.103:5001", "http://localhost:5001"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ========== CORS (SECURE) ==========
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.1.103:5173',
  'http://192.168.1.151:5173',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};
app.use(cors(corsOptions));

// ========== BODY PARSERS & COOKIES ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ========== HIDE SERVER TECHNOLOGY ==========
app.disable('x-powered-by');

// ========== TRUST PROXY (for rate limiting behind proxy/Burp/etc) ==========
app.set('trust proxy', 1);

// ========== DATABASE CONNECTION ==========
connectDB();

// Populate req.user
app.use(authenticateUser);

// ========== ROUTES ==========
app.use("/api/auth", require("./routes/auth"));
app.use("/api/services", require("./routes/services"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/superadmin", require("./routes/superadmin"));
app.use("/api/contact", (req, res, next) => { req.url = "/contact"; next(); }, require("./routes/admin"));

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express MERN server is running on port ${PORT} (0.0.0.0)`);
});


