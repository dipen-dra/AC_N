const express = require("express");
const User = require("../models/User");
const Booking = require("../models/Booking");
const AuditLog = require("../models/AuditLog");
const Service = require("../models/Service");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ─── ANALYTICS ──────────────────────────────────────────────────────────────
router.get("/analytics", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    const bookings = await Booking.find({});
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === "Completed");
    const completedRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
    const customerCount = await User.countDocuments({ role: "Customer" });

    const serviceCounts = {};
    bookings.forEach(b => { serviceCounts[b.service] = (serviceCounts[b.service] || 0) + 1; });
    const totalServicesCount = Object.values(serviceCounts).reduce((a, b) => a + b, 0) || 1;
    const serviceMix = Object.keys(serviceCounts).map(name => ({
      name,
      value: Math.round((serviceCounts[name] / totalServicesCount) * 100)
    }));

    const revenueData = [
      { month: "Jan", revenue: 450000, bookings: 32 },
      { month: "Feb", revenue: 580000, bookings: 41 },
      { month: "Mar", revenue: 480000, bookings: 35 },
      { month: "Apr", revenue: 720000, bookings: 53 },
      { month: "May", revenue: completedRevenue || 880000, bookings: totalBookings || 62 }
    ];

    res.json({ summary: { completedRevenue, totalBookings, customerCount }, revenueData, serviceMix });
  } catch (err) {
    res.status(500).json({ error: "Failed to load analytics." });
  }
});

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
router.get("/audit", requireAuth, requireRole(["Superadmin"]), async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ _id: -1 }).limit(50);
    res.json(logs.map(l => ({ id: l.id, severity: l.severity, time: l.time, user: l.userEmail, action: l.action, entity: l.entity, ip: l.ip })));
  } catch (err) {
    res.status(500).json({ error: "Failed to load audit logs." });
  }
});

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
router.get("/customers", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    const users = await User.find({ role: "Customer" }).select("-passwordHash").sort({ _id: -1 });
    const bookings = await Booking.find({});
    const data = users.map(u => {
      const ubs = bookings.filter(b => b.customerEmail === u.email);
      const spend = ubs.reduce((s, b) => s + b.price, 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "—",
        bookings: ubs.length,
        spend,
        tier: u.tier,
        points: u.points,
        status: u.status,
        joined: u._id.getTimestamp().toLocaleDateString("en-US", { month: "short", year: "numeric" })
      };
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load customers." });
  }
});

router.patch("/customers/:id/status", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active", "Suspended"].includes(status)) return res.status(400).json({ error: "Invalid status." });
    const user = await User.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found." });
    const log = new AuditLog({ id: `L-${Date.now()}`, userEmail: req.user.email, action: `Set user ${user.email} to ${status}`, entity: `User · ${user.id}`, ip: req.ip || "-", time: new Date().toLocaleString(), severity: "warn" });
    await log.save();
    res.json({ success: true, status: user.status });
  } catch (err) {
    res.status(500).json({ error: "Failed to update customer status." });
  }
});

router.delete("/customers/:id", requireAuth, requireRole(["Superadmin"]), async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: req.params.id });
    if (!user) return res.status(404).json({ error: "User not found." });
    const log = new AuditLog({ id: `L-${Date.now()}`, userEmail: req.user.email, action: `Deleted user account ${user.email}`, entity: `User · ${user.id}`, ip: req.ip || "-", time: new Date().toLocaleString(), severity: "critical" });
    await log.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete customer." });
  }
});

// ─── SERVICES CRUD ──────────────────────────────────────────────────────────
router.post("/services", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    const { name, desc, price, duration, category, popular, features } = req.body;
    if (!name || !desc || !price || !duration || !category) return res.status(400).json({ error: "All fields required." });
    const id = `SVC-${Date.now()}`;
    const svc = new Service({ id, name, desc, price: Number(price), duration, category, popular: !!popular, features: features || [] });
    await svc.save();
    res.json({ success: true, service: svc });
  } catch (err) {
    res.status(500).json({ error: "Failed to create service." });
  }
});

router.patch("/services/:id", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    const svc = await Service.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!svc) return res.status(404).json({ error: "Service not found." });
    res.json({ success: true, service: svc });
  } catch (err) {
    res.status(500).json({ error: "Failed to update service." });
  }
});

router.delete("/services/:id", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    const svc = await Service.findOneAndDelete({ id: req.params.id });
    if (!svc) return res.status(404).json({ error: "Service not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete service." });
  }
});

// ─── ROLE UPDATE (Superadmin only) ──────────────────────────────────────────
router.patch("/customers/:id/role", requireAuth, requireRole(["Superadmin"]), async (req, res) => {
  try {
    const { role } = req.body;
    if (!["Customer", "Admin", "Superadmin"].includes(role)) return res.status(400).json({ error: "Invalid role." });
    const user = await User.findOneAndUpdate({ id: req.params.id }, { role }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found." });
    const log = new AuditLog({ id: `L-${Date.now()}`, userEmail: req.user.email, action: `Changed role of ${user.email} to ${role}`, entity: `User · ${user.id}`, ip: req.ip || "-", time: new Date().toLocaleString(), severity: "warn" });
    await log.save();
    res.json({ success: true, role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Failed to update role." });
  }
});

// ─── LOYALTY REDEEM ─────────────────────────────────────────────────────────
router.post("/loyalty/redeem", requireAuth, async (req, res) => {
  try {
    const { rewardName, cost } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found." });
    if (user.points < cost) return res.status(400).json({ error: "Insufficient points." });
    user.points -= cost;
    await user.save();
    const log = new AuditLog({ id: `L-${Date.now()}`, userEmail: user.email, action: `Redeemed reward: ${rewardName} (-${cost} pts)`, entity: `User · ${user.id}`, ip: req.ip || "-", time: new Date().toLocaleString(), severity: "info" });
    await log.save();
    res.json({ success: true, points: user.points });
  } catch (err) {
    res.status(500).json({ error: "Failed to redeem reward." });
  }
});

// ─── CONTACT FORM ────────────────────────────────────────────────────────────
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ error: "All fields required." });
    const log = new AuditLog({ id: `L-${Date.now()}`, userEmail: email, action: `Contact form: ${subject}`, entity: `Contact · ${name}`, ip: req.ip || "-", time: new Date().toLocaleString(), severity: "info" });
    await log.save();
    res.json({ success: true, message: "Your message has been received. We'll get back to you within 24 hours." });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message." });
  }
});

// ─── WORKSHOP DETAILS ───────────────────────────────────────────────────────
const Workshop = require("../models/Workshop");

router.get("/workshop", requireAuth, async (req, res) => {
  try {
    let ws = await Workshop.findOne({});
    if (!ws) {
      ws = new Workshop({});
      await ws.save();
    }
    res.json(ws);
  } catch (err) {
    res.status(500).json({ error: "Failed to load workshop details." });
  }
});

router.patch("/workshop", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    let ws = await Workshop.findOne({});
    if (!ws) ws = new Workshop({});
    
    const fields = ["name", "registrationNo", "owner", "manager", "phone", "email", "address", "city", "workingHours", "team", "baysCount"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) ws[f] = req.body[f];
    });
    
    await ws.save();
    res.json({ success: true, workshop: ws });
  } catch (err) {
    res.status(500).json({ error: "Failed to update workshop details." });
  }
});

module.exports = router;

