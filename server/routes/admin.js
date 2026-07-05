const express = require("express");
const User = require("../models/User");
const Booking = require("../models/Booking");
const AuditLog = require("../models/AuditLog");
const Service = require("../models/Service");
const Settings = require("../models/Settings");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ─── GLOBAL SEARCH ──────────────────────────────────────────────────────────
router.get("/search", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return res.json([]);
    }

    const regex = new RegExp(q.trim(), "i");
    const results = [];

    // Search Customers
    const users = await User.find({ role: "Customer", $or: [{ name: regex }, { email: regex }, { phone: regex }] }).limit(5);
    users.forEach(u => results.push({ type: "customer", id: u.id, title: u.name, subtitle: u.email, url: "/admin/customers" }));

    // Search Bookings
    const bookings = await Booking.find({ $or: [{ id: regex }, { customer: regex }, { customerEmail: regex }, { vehicle: regex }] }).limit(5);
    bookings.forEach(b => results.push({ type: "booking", id: b.id, title: b.id, subtitle: `${b.customer} - ${b.vehicle}`, url: "/admin/bookings" }));

    // Search Services
    const services = await Service.find({ $or: [{ name: regex }, { category: regex }] }).limit(5);
    services.forEach(s => results.push({ type: "service", id: s.id, title: s.name, subtitle: s.category, url: "/admin/services" }));

    res.json(results);
  } catch (err) {
    console.error("Global search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// ─── ANALYTICS ──────────────────────────────────────────────────────────────
router.get("/analytics", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    const bookings = await Booking.find({});
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === "Completed");
    const completedRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
    const customerCount = await User.countDocuments({ role: "Customer" });
    const servicesCount = await Service.countDocuments({});

    const serviceCounts = {};
    bookings.forEach(b => { serviceCounts[b.service] = (serviceCounts[b.service] || 0) + 1; });
    const totalServicesCount = Object.values(serviceCounts).reduce((a, b) => a + b, 0) || 1;
    const serviceMix = Object.keys(serviceCounts).map(name => ({
      name,
      value: Math.round((serviceCounts[name] / totalServicesCount) * 100)
    }));

    // Group bookings by month for the chart
    const monthMap = {
      0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun",
      6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec"
    };
    
    const nowTime = new Date();
    const currentMonthLabel = monthMap[nowTime.getMonth()];
    const prevMonthIdx = nowTime.getMonth() === 0 ? 11 : nowTime.getMonth() - 1;
    const prevMonthLabel = monthMap[prevMonthIdx];

    const revenueByMonth = {};
    revenueByMonth[prevMonthLabel] = { month: prevMonthLabel, revenue: 0, bookings: 0 };
    revenueByMonth[currentMonthLabel] = { month: currentMonthLabel, revenue: 0, bookings: 0 };

    bookings.forEach(b => {
      // Assuming b.date is parsable or b.createdAt exists
      const date = b.createdAt ? new Date(b.createdAt) : new Date(b.date || Date.now());
      const m = monthMap[date.getMonth()];
      if (!revenueByMonth[m]) revenueByMonth[m] = { month: m, revenue: 0, bookings: 0 };
      revenueByMonth[m].bookings += 1;
      if (b.status === "Completed") revenueByMonth[m].revenue += b.price;
    });

    const revenueData = Object.values(revenueByMonth);
    // Sort by month order roughly or just keep as is
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    revenueData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

    // Fill empty months up to current month if needed, but for now just return what we have
    if (revenueData.length === 0) {
      revenueData.push({ month: monthMap[new Date().getMonth()], revenue: 0, bookings: 0 });
    }

    // Deltas
    let revenueDelta = "0%";
    let bookingsDelta = "0%";
    if (revenueData.length >= 2) {
      const current = revenueData[revenueData.length - 1];
      const prev = revenueData[revenueData.length - 2];
      
      if (prev.revenue > 0) {
        revenueDelta = ((current.revenue - prev.revenue) / prev.revenue * 100).toFixed(1) + "%";
        if (parseFloat(revenueDelta) > 0) revenueDelta = "+" + revenueDelta;
      } else if (current.revenue > 0) {
        revenueDelta = "+100%";
      }

      if (prev.bookings > 0) {
        bookingsDelta = ((current.bookings - prev.bookings) / prev.bookings * 100).toFixed(1) + "%";
        if (parseFloat(bookingsDelta) > 0) bookingsDelta = "+" + bookingsDelta;
      } else if (current.bookings > 0) {
        bookingsDelta = "+100%";
      }
    }

    // Customer Delta
    const users = await User.find({ role: "Customer" });
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentMonthCustomers = 0;
    let prevMonthCustomers = 0;

    users.forEach(u => {
      const d = new Date(u.createdAt || u._id.getTimestamp());
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        currentMonthCustomers++;
      } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        prevMonthCustomers++;
      }
    });

    let customersDelta = "0%";
    if (prevMonthCustomers > 0) {
      customersDelta = ((currentMonthCustomers - prevMonthCustomers) / prevMonthCustomers * 100).toFixed(1) + "%";
      if (parseFloat(customersDelta) > 0) customersDelta = "+" + customersDelta;
    } else if (currentMonthCustomers > 0) {
      customersDelta = "+100%";
    }

    // Weekly bookings
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyMap = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0 };
    bookings.forEach(b => {
      const d = b.createdAt ? new Date(b.createdAt) : new Date(b.date || Date.now());
      weeklyMap[daysOfWeek[d.getDay()]] += 1;
    });
    const weeklyBookings = [
      { d: "Mon", v: weeklyMap["Mon"] },
      { d: "Tue", v: weeklyMap["Tue"] },
      { d: "Wed", v: weeklyMap["Wed"] },
      { d: "Thu", v: weeklyMap["Thu"] },
      { d: "Fri", v: weeklyMap["Fri"] },
      { d: "Sat", v: weeklyMap["Sat"] },
      { d: "Sun", v: weeklyMap["Sun"] }
    ];

    // Top technicians
    const techCounts = {};
    bookings.forEach(b => {
      if (b.technician && b.technician !== "-" && b.technician !== "Unassigned") {
        techCounts[b.technician] = (techCounts[b.technician] || 0) + 1;
      }
    });
    
    // Sort and take top 4
    const topTechnicians = Object.keys(techCounts)
      .map(name => ({
        n: name,
        j: techCounts[name],
        r: (4.5 + Math.random() * 0.5).toFixed(1) // Simulated rating between 4.5 and 5.0
      }))
      .sort((a, b) => b.j - a.j)
      .slice(0, 4);

    res.json({ 
      summary: { 
        completedRevenue, totalBookings, customerCount, servicesCount,
        revenueDelta, bookingsDelta, customersDelta, weeklyBookings
      }, 
      revenueData, 
      serviceMix,
      topTechnicians
    });
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
        avatar: u.avatar || null,
        initial: u.initial || u.name.charAt(0).toUpperCase(),
        address: u.address || "—",
        vehicles: u.vehicles || [],
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never",
        bookings: ubs.length,
        spend,
        tier: u.tier,
        points: u.points,
        status: u.status,
        joined: u._id.getTimestamp().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = 'REWARD-';
      for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      return code;
    };
    const promoCode = generateCode();

    user.points -= cost;
    user.redeemedRewards.push({ name: rewardName, code: promoCode, cost });
    await user.save();
    
    const log = new AuditLog({ id: `L-${Date.now()}`, userEmail: user.email, action: `Redeemed reward: ${rewardName} (-${cost} pts, Code: ${promoCode})`, entity: `User · ${user.id}`, ip: req.ip || "-", time: new Date().toLocaleString(), severity: "info" });
    await log.save();
    
    res.json({ success: true, points: user.points, code: promoCode });
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

// ─── SETTINGS ───────────────────────────────────────────────────────────────
router.get("/settings", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings." });
  }
});

router.patch("/settings", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    
    const log = new AuditLog({ 
      id: `L-${Date.now()}`, 
      userEmail: req.user.email, 
      action: `Updated global settings`, 
      entity: `Settings`, 
      ip: req.ip || "-", 
      time: new Date().toLocaleString(), 
      severity: "warn" 
    });
    await log.save();
    
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings." });
  }
});

module.exports = router;

