const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    default: ""
  },
  userEmail: {
    type: String,
    default: ""
  },
  action: {
    type: String,
    required: true
  },
  entity: {
    type: String,
    default: ""
  },
  ip: {
    type: String,
    default: "-"
  },
  userAgent: {
    type: String,
    default: ""
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'info', 'warn', 'critical'],
    default: 'SUCCESS'
  },
  severity: {
    type: String,
    enum: ['info', 'warn', 'critical'],
    default: 'info'
  },
  time: {
    type: String,
    default: function() { return new Date().toLocaleString(); }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ userEmail: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
