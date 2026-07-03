const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "autocare_secret_key_123456";

// REGISTER
router.post("/register", async (req, res) => {
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

// LOGIN
router.post("/login", async (req, res) => {
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
      role: req.user.role
    }
  });
});

module.exports = router;
