const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "autocare_secret_key_123456";

// Rate limiter: max 10 requests per 10 seconds on auth endpoints
const authLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
  message: { success: false, error: "Too many attempts. Please try again in 10 seconds." },
  standardHeaders: true,
  legacyHeaders: false
});

// In-memory password reset tokens (keyed by email) — expires 1 hour
const resetTokens = new Map();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  }
});

// REGISTER (rate limited)
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "An account with this email already exists." });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const userId = `U-${randomNum}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const initial = name.charAt(0).toUpperCase() || "U";

    const newUser = new User({
      id: userId,
      name,
      email: email.toLowerCase().trim(),
      phone,
      passwordHash,
      points: 0,
      tier: "Bronze",
      initial,
      status: "Active",
      role: "Customer"
    });
    await newUser.save();

    // Drop cookie
    const token = jwt.sign({ id: userId, dbId: newUser._id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log Audit Trail
    const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLog = new AuditLog({
      id: logId,
      userEmail: email,
      action: "Registered account",
      entity: `User · ${userId}`,
      ip: req.ip || "-",
      time: new Date().toLocaleString(),
      severity: "info"
    });
    await newLog.save();

    res.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        points: newUser.points,
        tier: newUser.tier,
        initial: newUser.initial,
        status: newUser.status,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, error: "Registration failed." });
  }
});

// LOGIN (rate limited)
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid email or password." });
    }

    if (user.status === "Suspended") {
      return res.status(403).json({ success: false, error: "Your account is suspended. Please contact support." });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      const log = new AuditLog({
        id: logId,
        userEmail: email.toLowerCase().trim(),
        action: "Failed login attempt",
        entity: "Auth",
        ip: req.ip || "-",
        time: new Date().toLocaleString(),
        severity: "warn"
      });
      await log.save();
      return res.status(400).json({ success: false, error: "Invalid email or password." });
    }

    // Set cookie
    const token = jwt.sign({ id: user.id, dbId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
    const log = new AuditLog({
      id: logId,
      userEmail: user.email,
      action: "Logged in successfully",
      entity: `User · ${user.id}`,
      ip: req.ip || "-",
      time: new Date().toLocaleString(),
      severity: "info"
    });
    await log.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        points: user.points,
        tier: user.tier,
        initial: user.initial,
        status: user.status,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Login failed." });
  }
});

// LOGOUT
router.post("/logout", async (req, res) => {
  try {
    if (req.user) {
      const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      const log = new AuditLog({
        id: logId,
        userEmail: req.user.email,
        action: "Logged out",
        entity: `User · ${req.user.id}`,
        ip: req.ip || "-",
        time: new Date().toLocaleString(),
        severity: "info"
      });
      await log.save();
    }
    res.clearCookie("auth_session");
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, error: "Logout failed." });
  }
});

// GET PROFILE INFO
router.get("/me", (req, res) => {
  if (!req.user) {
    return res.json({ success: true, user: null });
  }
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      points: req.user.points,
      tier: req.user.tier,
      initial: req.user.initial,
      status: req.user.status,
      role: req.user.role,
      avatar: req.user.avatar || null
    }
  });
});

// UPLOAD AVATAR
router.post("/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image file provided." });
    }
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    await User.findByIdAndUpdate(req.user._id, { avatar: base64 });
    res.json({ success: true, avatar: base64 });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ success: false, error: "Failed to upload avatar." });
  }
});

// GET NOTIFICATIONS (derived from recent bookings)
router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const Booking = require("../models/Booking");
    // Find user's bookings updated in the last 7 days with active statuses
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const bookings = await Booking.find({
      userId: req.user.id,
      updatedAt: { $gte: since }
    }).sort({ updatedAt: -1 }).limit(10);

    const notifications = bookings.map(b => ({
      id: b.id,
      title: `Booking ${b.id}`,
      message: `Status: ${b.status}`,
      time: b.updatedAt,
      read: false
    }));

    res.json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    console.error("Notifications error:", err);
    res.json({ success: true, count: 0, notifications: [] });
  }
});

// FORGOT PASSWORD — generates a reset token
router.post("/forgot", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email is required." });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond success to not leak existence of emails
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = Date.now() + 60 * 60 * 1000; // 1 hour
      resetTokens.set(email.toLowerCase().trim(), { token, expires });
      // In production you'd send via nodemailer. For now log it:
      console.log(`[PASSWORD RESET] Token for ${email}: ${token}`);
      const log = new AuditLog({ id: `L-${Date.now()}`, userEmail: email, action: "Password reset requested", entity: "Auth", ip: req.ip || "-", time: new Date().toLocaleString(), severity: "warn" });
      await log.save();
    }
    res.json({ success: true, message: "If that email exists, a reset link has been sent. Check console for dev token." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, error: "Failed to process request." });
  }
});

// RESET PASSWORD — validates token and sets new password
router.post("/reset", authLimiter, async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) return res.status(400).json({ success: false, error: "Email, token, and new password are required." });
    const stored = resetTokens.get(email.toLowerCase().trim());
    if (!stored || stored.token !== token || Date.now() > stored.expires) {
      return res.status(400).json({ success: false, error: "Invalid or expired reset token." });
    }
    if (password.length < 6) return res.status(400).json({ success: false, error: "Password must be at least 6 characters." });
    const passwordHash = bcrypt.hashSync(password, 10);
    await User.findOneAndUpdate({ email: email.toLowerCase().trim() }, { passwordHash });
    resetTokens.delete(email.toLowerCase().trim());
    const log = new AuditLog({ id: `L-${Date.now()}`, userEmail: email, action: "Password reset completed", entity: "Auth", ip: req.ip || "-", time: new Date().toLocaleString(), severity: "info" });
    await log.save();
    res.json({ success: true, message: "Password reset successful. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, error: "Failed to reset password." });
  }
});

module.exports = router;
