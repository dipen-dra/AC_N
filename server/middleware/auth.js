const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'autocare_secret_key_123456';

// Global middleware to populate req.user if a session exists
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies?.auth_session || req.headers.authorization?.split(' ')[1];
    console.log(`[AUTH DEBUG] Path: ${req.path}, Has Token: ${!!token}, Cookies:`, req.cookies);
    if (!token) {
      req.user = null;
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log(`[AUTH DEBUG] Decoded token:`, decoded);
    } catch (err) {
      console.log(`[AUTH DEBUG] JWT verify failed:`, err.message);
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.dbId);
    if (!user) {
      console.log(`[AUTH DEBUG] User not found by dbId: ${decoded.dbId}`);
      req.user = null;
      return next();
    }

    if (user.status === 'Inactive' || user.status === 'Suspended') {
      console.log(`[AUTH DEBUG] User inactive/suspended: status=${user.status}`);
      req.user = null;
      return next();
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    console.error(`[AUTH DEBUG] authenticateUser exception:`, err);
    req.user = null;
    next();
  }
};

const requireAuth = async (req, res, next) => {
  // If authenticateUser already ran and populated req.user, just check it
  if (req.user) {
    return next();
  }

  // Fallback direct check if authenticateUser was not run globally
  try {
    const token = req.cookies?.auth_session || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required. Please login.' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired session. Please login again.' 
      });
    }

    const user = await User.findById(decoded.dbId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found. Please login again.' 
      });
    }

    if (user.status === 'Inactive' || user.status === 'Suspended') {
      return res.status(403).json({ 
        success: false, 
        error: 'Your account has been disabled. Please contact support.' 
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed. Please try again.' 
    });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    // Support case insensitive role check
    const userRole = req.user.role;
    const hasRole = roles.some(r => r.toLowerCase() === userRole.toLowerCase());
    
    if (!hasRole) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

module.exports = { authenticateUser, requireAuth, requireRole };
