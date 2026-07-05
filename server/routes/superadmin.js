const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const Settings = require('../models/Settings');

const router = express.Router();

// Middleware to ensure all routes in this file are Superadmin only
router.use(requireAuth);
router.use(requireRole(['Superadmin', 'SuperAdmin']));

// ========== GET ANALYTICS ==========
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalAuditLogs = await AuditLog.countDocuments();
    
    // Calculate total revenue from Completed bookings
    const completedBookings = await Booking.find({ status: 'Completed' });
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    // Get active sessions (mocked dynamically for now since we use stateless JWTs)
    const activeSessions = Math.floor(totalUsers * 0.15) || 1;

    // Calculate real 2FA rate
    const usersWith2FA = await User.countDocuments({ twoFactorEnabled: true });
    const twoFactorRate = totalUsers > 0 ? Math.round((usersWith2FA / totalUsers) * 100) : 0;

    // Calculate real blocked threats (failed events in audit logs)
    const threatsBlocked = await AuditLog.countDocuments({ status: 'FAILED' });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalAuditLogs,
        totalRevenue,
        activeSessions,
        twoFactorRate,
        threatsBlocked
      }
    });
  } catch (error) {
    console.error('Error fetching superadmin analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics.' });
  }
});

// ========== GET ALL USERS ==========
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
});

// ========== UPDATE USER ROLE ==========
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Customer', 'Admin', 'Superadmin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role.' });
    }
    
    const user = await User.findOneAndUpdate(
      { id: req.params.id }, 
      { role }, 
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    // Log the role change
    await AuditLog.create({
      id: `AL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'UPDATE_ROLE',
      entity: `User:${req.params.id}`,
      details: { newRole: role },
      status: 'SUCCESS',
      severity: 'warn'
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update role.' });
  }
});

// ========== DELETE USER ==========
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: req.params.id });
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    // Log deletion
    await AuditLog.create({
      id: `AL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DELETE_USER',
      entity: `User:${req.params.id}`,
      status: 'SUCCESS',
      severity: 'critical'
    });

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user.' });
  }
});

// ========== GET SETTINGS ==========
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings.' });
  }
});

// ========== UPDATE SETTINGS ==========
router.put('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    await AuditLog.create({
      id: `AL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'UPDATE_SETTINGS',
      entity: 'System Settings',
      status: 'SUCCESS',
      severity: 'info'
    });

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings.' });
  }
});

// ========== GET AUDIT LOGS ==========
router.get('/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
  }
});

module.exports = router;
