const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { requireAuth } = require('../middleware/auth');
const Validation = require('../utils/validation');
const SecurityMonitor = require('../middleware/security');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'autocare_secret_key_123456';

// ========== STRICT AUTH RATE LIMIT (10s window) ==========
const authLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
  message: { success: false, error: 'Too many attempts. Please try again in 10 seconds.' },
  standardHeaders: true,
  legacyHeaders: false
});

// In-memory password reset tokens (keyed by email) — expires 1 hour
const resetTokens = new Map();

// ========== REGISTER ==========
router.post('/register', authLimiter, async (req, res) => {
  try {
    let { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and password are required.' 
      });
    }

    // Sanitize inputs
    name = Validation.sanitizeString(name);
    email = Validation.sanitizeString(email).toLowerCase().trim();
    phone = Validation.sanitizeString(phone || '');

    // Validate email
    if (!Validation.validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please enter a valid email address.' 
      });
    }

    // Validate phone (if provided)
    if (phone && !Validation.validatePhone(phone)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please enter a valid phone number.' 
      });
    }

    // Validate name
    if (!Validation.validateName(name)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name must be between 2 and 50 characters.' 
      });
    }

    // Validate password strength
    if (!Validation.validatePassword(password)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.' 
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'An account with this email already exists.' 
      });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const userId = `U-${randomNum}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const initial = name.charAt(0).toUpperCase() || 'U';

    const newUser = new User({
      id: userId,
      name,
      email,
      phone: phone || '',
      passwordHash,
      points: 0,
      tier: 'Bronze',
      initial,
      status: 'Active',
      role: 'Customer'
    });

    await newUser.save();

    // Log Audit Trail
    await SecurityMonitor.logEvent({
      userId,
      userEmail: email,
      action: 'REGISTER',
      ip: req.ip || '-',
      userAgent: req.headers['user-agent'] || '',
      details: { email },
      status: 'SUCCESS',
      severity: 'info'
    });

    // Generate JWT
    const token = jwt.sign(
      { id: userId, dbId: newUser._id, role: newUser.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Set secure cookie
    res.cookie('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.status(201).json({
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
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// ========== LOGIN ==========
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required.' 
      });
    }

    const sanitizedEmail = Validation.sanitizeString(email).toLowerCase().trim();

    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      // Log failed login
      await SecurityMonitor.logEvent({
        action: 'LOGIN',
        ip: req.ip || '-',
        userAgent: req.headers['user-agent'] || '',
        details: { email: sanitizedEmail },
        status: 'FAILED',
        severity: 'warn'
      });
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password.' 
      });
    }

    // Check suspicious brute force before password verification
    const checkSuspicious = await SecurityMonitor.checkSuspiciousActivity(user.id);
    if (checkSuspicious.suspended || user.status === 'Suspended') {
      return res.status(403).json({ 
        success: false, 
        error: 'Your account has been disabled/suspended. Please contact support.' 
      });
    }

    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      // Log failed login
      await SecurityMonitor.logEvent({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN',
        ip: req.ip || '-',
        userAgent: req.headers['user-agent'] || '',
        details: { email: sanitizedEmail },
        status: 'FAILED',
        severity: 'warn'
      });

      // Check brute force limits again
      await SecurityMonitor.checkSuspiciousActivity(user.id);

      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password.' 
      });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ 
        success: false, 
        error: 'Your account has been disabled. Please contact support.' 
      });
    }

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { tempId: user.id, tempDbId: user._id, is2FA: true }, 
        JWT_SECRET, 
        { expiresIn: '5m' }
      );
      return res.json({
        success: true,
        requiresTwoFactor: true,
        tempToken
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await SecurityMonitor.logEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN',
      ip: req.ip || '-',
      userAgent: req.headers['user-agent'] || '',
      status: 'SUCCESS',
      severity: 'info'
    });

    const token = jwt.sign(
      { id: user.id, dbId: user._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.cookie('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

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
        role: user.role,
        avatar: user.avatar || null,
        twoFactorEnabled: user.twoFactorEnabled || false
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed. Please try again.' 
    });
  }
});

// ========== VERIFY 2FA FOR LOGIN ==========
router.post('/login/verify-2fa', authLimiter, async (req, res) => {
  try {
    const { tempToken, otp } = req.body;
    if (!tempToken || !otp) return res.status(400).json({ success: false, error: 'Token and OTP are required' });
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
    }
    const user = await User.findById(decoded.tempDbId);
    if (!user || !user.twoFactorEnabled) return res.status(401).json({ success: false, error: 'Invalid request' });
    
    const isValid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: otp });
    if (!isValid) return res.status(401).json({ success: false, error: 'Invalid verification code' });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user.id, dbId: user._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    res.cookie('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled || false
      }
    });
  } catch (err) {
    console.error('Verify 2FA error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ========== 2FA MANAGEMENT ==========
router.post('/2fa/generate', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const secret = speakeasy.generateSecret({ name: 'AutoCare Nepal (' + user.email + ')' });
    const qrCode = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ success: true, secret: secret.base32, qrCode });
  } catch (err) {
    console.error('Generate 2FA error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate 2FA' });
  }
});

router.post('/2fa/enable', requireAuth, async (req, res) => {
  try {
    const { secret, token } = req.body;
    const isValid = speakeasy.totp.verify({ secret, encoding: 'base32', token });
    if (!isValid) return res.status(400).json({ success: false, error: 'Invalid token' });
    const user = await User.findById(req.user._id);
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Enable 2FA error:', err);
    res.status(500).json({ success: false, error: 'Failed to enable 2FA' });
  }
});

router.post('/2fa/disable', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    const isValid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token });
    if (!isValid) return res.status(400).json({ success: false, error: 'Invalid token' });
    user.twoFactorSecret = undefined;
    user.twoFactorEnabled = false;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Disable 2FA error:', err);
    res.status(500).json({ success: false, error: 'Failed to disable 2FA' });
  }
});

// ========== LOGOUT ==========
router.post('/logout', async (req, res) => {
  if (req.user) {
    await SecurityMonitor.logEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'LOGOUT',
      ip: req.ip || '-',
      userAgent: req.headers['user-agent'] || '',
      status: 'SUCCESS',
      severity: 'info'
    });
  }

  res.clearCookie('auth_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  res.json({ success: true, message: 'Logged out successfully' });
});

// ========== GET CURRENT USER ==========
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        vehicles: user.vehicles,
        points: user.points,
        tier: user.tier,
        redeemedRewards: user.redeemedRewards,
        initial: user.initial,
        status: user.status,
        role: user.role,
        avatar: user.avatar || null,
        twoFactorEnabled: user.twoFactorEnabled || false
      }
    });

  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user data.' 
    });
  }
});

// ========== UPDATE PROFILE ==========
router.post('/profile', requireAuth, async (req, res) => {
  try {
    const { phone, address } = req.body;
    const user = await User.findById(req.user._id);
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

// ========== ADD VEHICLE ==========
router.post('/vehicles', requireAuth, async (req, res) => {
  try {
    const { plate, model } = req.body;
    if (!plate || !model) return res.status(400).json({ error: 'Plate and model are required.' });
    const user = await User.findById(req.user._id);
    const isPrimary = user.vehicles.length === 0;
    user.vehicles.push({ plate, model, primary: isPrimary });
    await user.save();
    res.json({ success: true, vehicles: user.vehicles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add vehicle.' });
  }
});
// ========== EDIT VEHICLE ==========
router.put('/vehicles/:plate', requireAuth, async (req, res) => {
  try {
    const { newPlate, newModel } = req.body;
    if (!newPlate || !newModel) return res.status(400).json({ error: 'Plate and model are required.' });
    const user = await User.findById(req.user._id);
    const vehicleIndex = user.vehicles.findIndex(v => v.plate === req.params.plate);
    if (vehicleIndex === -1) return res.status(404).json({ error: 'Vehicle not found.' });
    
    user.vehicles[vehicleIndex].plate = newPlate;
    user.vehicles[vehicleIndex].model = newModel;
    await user.save();
    res.json({ success: true, vehicles: user.vehicles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to edit vehicle.' });
  }
});


// ========== REMOVE VEHICLE ==========
router.delete('/vehicles/:plate', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.vehicles = user.vehicles.filter(v => v.plate !== req.params.plate);
    if (user.vehicles.length > 0 && !user.vehicles.some(v => v.primary)) {
      user.vehicles[0].primary = true;
    }
    await user.save();
    res.json({ success: true, vehicles: user.vehicles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove vehicle.' });
  }
});

// ========== FILE UPLOAD - SECURE ==========
const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check MIME type
  if (!allowedFileTypes.includes(file.mimetype)) {
    return cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP)'), false);
  }
  
  // Check extension
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file extension. Only JPG, PNG, GIF, WEBP are allowed.'), false);
  }
  
  // Check for null bytes in filename
  if (file.originalname.includes('\x00')) {
    return cb(new Error('Invalid filename'), false);
  }
  
  // Limit filename length
  if (file.originalname.length > 255) {
    return cb(new Error('Filename is too long'), false);
  }
  
  // Remove path traversal attempts
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return cb(new Error('Invalid filename'), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: fileFilter
});

router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided.' 
      });
    }

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    await User.findByIdAndUpdate(req.user._id, { 
      avatar: base64 
    });

    await SecurityMonitor.logEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'UPDATE_AVATAR',
      ip: req.ip || '-',
      userAgent: req.headers['user-agent'] || '',
      status: 'SUCCESS',
      severity: 'info'
    });

    res.json({ 
      success: true, 
      avatar: base64 
    });

  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to upload avatar. Please try again.' 
    });
  }
});

// ========== GET NOTIFICATIONS ==========
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const Notification = require("../models/Notification");
    const isAdmin = req.user.role === "Admin" || req.user.role === "Superadmin";
    const userQuery = isAdmin ? { userId: { $in: [req.user.id, "admin_broadcast"] } } : { userId: req.user.id };
    
    const notifications = await Notification.find(userQuery)
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ ...userQuery, read: false });

    const formatted = notifications.map(n => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      time: n.createdAt,
      read: n.read,
      type: n.type,
      relatedId: n.relatedId
    }));

    res.json({ success: true, count: unreadCount, notifications: formatted });
  } catch (err) {
    console.error("Notifications error:", err);
    res.json({ success: true, count: 0, notifications: [] });
  }
});

// ========== MARK NOTIFICATIONS READ ==========
router.patch('/notifications/read', requireAuth, async (req, res) => {
  try {
    const Notification = require("../models/Notification");
    const isAdmin = req.user.role === "Admin" || req.user.role === "Superadmin";
    const userQuery = isAdmin ? { userId: { $in: [req.user.id, "admin_broadcast"] } } : { userId: req.user.id };

    await Notification.updateMany(
      { ...userQuery, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// ========== CLEAR NOTIFICATIONS ==========
router.delete('/notifications', requireAuth, async (req, res) => {
  try {
    const Notification = require("../models/Notification");
    const isAdmin = req.user.role === "Admin" || req.user.role === "Superadmin";
    const userQuery = isAdmin ? { userId: { $in: [req.user.id, "admin_broadcast"] } } : { userId: req.user.id };
    
    await Notification.deleteMany(userQuery);
    res.json({ success: true });
  } catch (err) {
    console.error("Clear notifications error:", err);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});

// ========== FORGOT PASSWORD ==========
router.post('/forgot', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });
    
    const sanitizedEmail = Validation.sanitizeString(email).toLowerCase().trim();
    if (!Validation.validateEmail(sanitizedEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }

    const user = await User.findOne({ email: sanitizedEmail });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = Date.now() + 60 * 60 * 1000; // 1 hour
      resetTokens.set(sanitizedEmail, { token, expires });
      console.log(`[PASSWORD RESET] Token for ${sanitizedEmail}: ${token}`);
      
      await SecurityMonitor.logEvent({
        userId: user.id,
        userEmail: sanitizedEmail,
        action: 'ADMIN_ACTION',
        ip: req.ip || '-',
        userAgent: req.headers['user-agent'] || '',
        details: { action: 'RESET_REQUEST' },
        status: 'SUCCESS',
        severity: 'info'
      });
    }
    
    res.json({ success: true, message: 'If that email exists, a reset link has been sent. Check console for dev token.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Failed to process request.' });
  }
});

// ========== RESET PASSWORD ==========
router.post('/reset', authLimiter, async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ success: false, error: 'Email, token, and new password are required.' });
    }

    const sanitizedEmail = Validation.sanitizeString(email).toLowerCase().trim();
    const stored = resetTokens.get(sanitizedEmail);
    if (!stored || stored.token !== token || Date.now() > stored.expires) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token.' });
    }

    if (!Validation.validatePassword(password)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.' 
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.findOneAndUpdate({ email: sanitizedEmail }, { passwordHash }, { new: true });
    
    resetTokens.delete(sanitizedEmail);

    if (user) {
      await SecurityMonitor.logEvent({
        userId: user.id,
        userEmail: sanitizedEmail,
        action: 'ADMIN_ACTION',
        ip: req.ip || '-',
        userAgent: req.headers['user-agent'] || '',
        details: { action: 'RESET_COMPLETE' },
        status: 'SUCCESS',
        severity: 'info'
      });
    }

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
});

module.exports = router;
