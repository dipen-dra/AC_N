const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  // Security
  require2FAForAdmins: { type: Boolean, default: false },
  inactivityTimeout: { type: Boolean, default: true },
  blockAfterFailedLogins: { type: Boolean, default: true },

  // Notifications
  bookingConfirmations: { type: Boolean, default: true },
  statusChangeAlerts: { type: Boolean, default: true },
  weeklyDigest: { type: Boolean, default: false },

  // Localization
  language: { type: String, default: 'English (Nepal)' },
  currency: { type: String, default: 'NPR' },
  timezone: { type: String, default: 'Asia/Kathmandu' },

  // API Access
  esewaLive: { type: Boolean, default: false },
  khaltiLive: { type: Boolean, default: false },
  twilioSms: { type: Boolean, default: true },
  aiChatbotAutoReply: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', SettingsSchema);
