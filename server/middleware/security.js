const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

class SecurityMonitor {
  static async logEvent({ userId, userEmail, action, ip, userAgent, details, status = 'SUCCESS', severity = 'info' }) {
    try {
      const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      const log = new AuditLog({
        id: logId,
        userId: userId || "",
        userEmail: userEmail || "",
        action,
        ip: ip || "-",
        userAgent: userAgent || "",
        details,
        status,
        severity,
        time: new Date().toLocaleString(),
        entity: userId ? `User · ${userId}` : "Auth"
      });
      await log.save();
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  }

  static async checkSuspiciousActivity(userId) {
    if (!userId) return { suspended: false };
    const failedLogins = await AuditLog.countDocuments({
      userId,
      action: 'LOGIN',
      status: 'FAILED',
      timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
    });

    if (failedLogins >= 5) {
      await User.findOneAndUpdate({ id: userId }, { status: 'Suspended' });
      return { suspended: true, reason: 'Multiple failed login attempts' };
    }

    return { suspended: false };
  }
}

module.exports = SecurityMonitor;
