const express = require("express");
const Booking = require("../models/Booking");
const AuditLog = require("../models/AuditLog");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET ALL BOOKINGS (Self or Admin)
router.get("/", requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "Admin" && req.user.role !== "Superadmin") {
      query.customerEmail = req.user.email;
    }
    const bookings = await Booking.find(query).sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

// GET BOOKING BY ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    if (req.user.role !== "Admin" && req.user.role !== "Superadmin" && booking.customerEmail !== req.user.email) {
      return res.status(403).json({ error: "Access denied." });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch booking." });
  }
});

// CREATE NEW BOOKING
router.post("/", requireAuth, async (req, res) => {
  try {
    const { service, vehicle, date, time, location, price } = req.body;
    if (!service || !vehicle || !date || !time || !location || !price) {
      return res.status(400).json({ error: "All booking fields are required." });
    }

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const dateFormatted = date.replace(/-/g, "");
    const bookingId = `AC-${dateFormatted}-${randomNum}`;

    const newBooking = new Booking({
      id: bookingId,
      userId: req.user.id,
      customer: req.user.name,
      customerEmail: req.user.email,
      service,
      vehicle,
      date,
      time,
      location,
      price,
      status: "Upcoming",
      technician: "-",
      eta: ""
    });
    await newBooking.save();

    // Reward points: 10% of transaction price as points
    const earnedPoints = Math.round(price * 0.1);
    const updatedPoints = req.user.points + earnedPoints;
    
    // Tier calculations
    let updatedTier = req.user.tier;
    if (updatedPoints >= 2500) updatedTier = "Platinum";
    else if (updatedPoints >= 1000) updatedTier = "Gold";
    else if (updatedPoints >= 500) updatedTier = "Silver";
    
    req.user.points = updatedPoints;
    req.user.tier = updatedTier;
    await req.user.save();

    // Log audit log
    const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
    const log = new AuditLog({
      id: logId,
      userEmail: req.user.email,
      action: "Created booking",
      entity: `Booking · ${bookingId}`,
      ip: req.ip || "-",
      time: new Date().toLocaleString(),
      severity: "info"
    });
    await log.save();

    res.json({ success: true, booking: newBooking });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ error: "Failed to create booking." });
  }
});

// UPDATE STATUS (Admin only)
router.patch("/:id/status", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    const { status, technician, eta } = req.body;
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    if (status) booking.status = status;
    if (technician) booking.technician = technician;
    if (eta !== undefined) booking.eta = eta;

    await booking.save();

    // Log audit log
    const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
    const log = new AuditLog({
      id: logId,
      userEmail: req.user.email,
      action: `Updated booking status to ${status}`,
      entity: `Booking · ${booking.id}`,
      ip: req.ip || "-",
      time: new Date().toLocaleString(),
      severity: "info"
    });
    await log.save();

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: "Failed to update booking status." });
  }
});

module.exports = router;
