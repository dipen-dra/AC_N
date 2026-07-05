const express = require("express");
const Booking = require("../models/Booking");
const AuditLog = require("../models/AuditLog");
const Workshop = require("../models/Workshop");
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

// VALIDATE PROMO CODE
const User = require("../models/User");
router.post("/validate-promo", requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const promo = user.redeemedRewards?.find(r => r.code === code);
    if (!promo) return res.status(400).json({ error: "Invalid promo code." });
    if (promo.isUsed) return res.status(400).json({ error: "Promo code already used." });

    // Calculate discount value based on the reward name
    let discountAmount = 0;
    let isPercentage = false;

    if (promo.name.includes("Rs. ")) {
      // E.g., "Rs. 500 Service Credit"
      const match = promo.name.match(/Rs\.\s*(\d+)/);
      if (match) discountAmount = parseInt(match[1], 10);
    } else if (promo.name.includes("% Off")) {
      // E.g., "20% Off Full Service"
      const match = promo.name.match(/(\d+)%\s*Off/);
      if (match) {
        discountAmount = parseInt(match[1], 10);
        isPercentage = true;
      }
    } else if (promo.name.includes("Free Car Wash")) {
      // Hardcoded value for a standard wash if we don't know the exact price dynamically
      discountAmount = 1500; 
    } else if (promo.name.includes("Free Oil Change")) {
      discountAmount = 3000;
    }

    res.json({
      success: true,
      promo: {
        code: promo.code,
        name: promo.name,
        discountAmount,
        isPercentage
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to validate promo." });
  }
});
// GET BOOKED SLOTS
router.get("/booked-slots", requireAuth, async (req, res) => {
  try {
    const { date, technician } = req.query;
    if (!date) return res.status(400).json({ error: "Date is required" });

    const workshop = await Workshop.findOne();
    const baysCount = workshop ? (workshop.baysCount || 12) : 12;
    
    // Find all active bookings on this date
    const dayBookings = await Booking.find({ date, status: { $ne: "Cancelled" } });
    
    const slotsMap = {};
    const bookedForMech = new Set();
    
    dayBookings.forEach(b => {
      // Count total bookings per time slot to check bay capacity
      slotsMap[b.time] = (slotsMap[b.time] || 0) + 1;
      
      // If a specific mechanic is requested, mark slots they are busy
      if (technician && technician !== "Any Available Mechanic" && b.technician === technician) {
        bookedForMech.add(b.time);
      }
    });

    const fullyBookedSlots = [];
    const allPossibleSlots = ["10:00 AM - 12:00 PM", "12:00 PM - 02:00 PM", "04:00 PM - 06:00 PM", "06:00 PM - 08:00 PM"];
    
    for (const slot of allPossibleSlots) {
      // Slot is unavailable if the specific mechanic is busy, OR if all physical bays are full
      if (bookedForMech.has(slot) || (slotsMap[slot] >= baysCount)) {
        fullyBookedSlots.push(slot);
      }
    }

    res.json(fullyBookedSlots);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch booked slots." });
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
    const { service, serviceName, vehicle, date, time, location, price } = req.body;
    const finalService = service || serviceName;
    if (!finalService || !vehicle || !date || !time || !location || price === undefined || price === null) {
      return res.status(400).json({ error: "All booking fields are required." });
    }
    
    let assignedTechnician = req.body.technician || "-";

    if (assignedTechnician && assignedTechnician !== "-" && assignedTechnician !== "Any Available Mechanic") {
      const conflict = await Booking.findOne({
        technician: assignedTechnician,
        date,
        time,
        status: { $ne: "Cancelled" }
      });
      if (conflict) {
        return res.status(400).json({ error: "Mechanic isn't available in their current time." });
      }
    }

    // Verify physical bays capacity
    const workshop = await Workshop.findOne();
    const baysCount = workshop ? (workshop.baysCount || 12) : 12;
    
    const concurrentBookings = await Booking.countDocuments({
      date,
      time,
      status: { $ne: "Cancelled" }
    });
    
    if (concurrentBookings >= baysCount) {
      return res.status(400).json({ error: "All service bays are fully booked at this time." });
    }

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const dateFormatted = date.replace(/-/g, "");
    const bookingId = `AC-${dateFormatted}-${randomNum}`;

    const newBooking = new Booking({
      id: bookingId,
      userId: req.user.id,
      customer: req.user.name,
      customerEmail: req.user.email,
      service: finalService,
      vehicle,
      date,
      time,
      location,
      price,
      status: "Upcoming",
      technician: assignedTechnician,
      eta: ""
    });
    await newBooking.save();
    
    const user = await User.findById(req.user._id);

    // If a promo code was applied, mark it as used
    if (req.body.promoCode && user) {
      const promoIndex = user.redeemedRewards?.findIndex(r => r.code === req.body.promoCode);
      if (promoIndex !== undefined && promoIndex > -1) {
        user.redeemedRewards[promoIndex].isUsed = true;
      }
    }

    // Reward points: 10% of transaction price as points
    const earnedPoints = Math.round(price * 0.1);
    const updatedPoints = user.points + earnedPoints;
    
    // Tier calculations
    let updatedTier = user.tier;
    if (updatedPoints >= 2500) updatedTier = "Platinum";
    else if (updatedPoints >= 1000) updatedTier = "Gold";
    else if (updatedPoints >= 500) updatedTier = "Silver";
    
    user.points = updatedPoints;
    user.tier = updatedTier;
    await user.save();

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

    const Notification = require("../models/Notification");
    // Notify Customer
    await new Notification({
      userId: req.user.id,
      title: "Booking Confirmed",
      message: `Your booking for ${service} on ${date} has been confirmed.`,
      type: "booking",
      relatedId: bookingId
    }).save();

    // Broadcast to Admins
    await new Notification({
      userId: "admin_broadcast",
      title: "New Booking Received",
      message: `${req.user.name} booked ${service} for ${date} at ${time}.`,
      type: "booking",
      relatedId: bookingId
    }).save();

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

    if (status) {
      const Notification = require("../models/Notification");
      await new Notification({
        userId: booking.userId,
        title: "Booking Update",
        message: `Your booking ${booking.id} status is now ${status}.`,
        type: "booking",
        relatedId: booking.id
      }).save();
    }

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: "Failed to update booking status." });
  }
});

module.exports = router;
