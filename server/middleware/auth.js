const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "autocare_secret_key_123456";

const authenticateUser = async (req, res, next) => {
  const token = req.cookies.auth_session;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.dbId);
    req.user = user;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized. Please login." });
  }
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Forbidden. Insufficient permissions." });
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  requireAuth,
  requireRole
};
