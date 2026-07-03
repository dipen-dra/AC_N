const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  ip: { type: String, default: "-" },
  time: { type: String, required: true },
  severity: { type: String, default: "info" } // info, warn, critical
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
