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

// HELPER FOR ESEWA SIGNATURE
const crypto = require('crypto');
function generateEsewaSignature(secretKey, message) {
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

// VERIFY PAYMENT (eSewa or Khalti)
router.get("/verify-payment", requireAuth, async (req, res) => {
  try {
    const { method, bookingId, pidx, data } = req.query;

    if (!method || !bookingId) {
      return res.status(400).json({ error: "Missing required query parameters." });
    }

    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    // Handle payment failure or cancellation
    if (req.query.status === "failed" || req.query.status === "cancel") {
      booking.status = "Cancelled";
      booking.paymentStatus = "Failed";
      
      // Make applied promo code reusable again
      if (booking.promoCode) {
        const user = await User.findOne({ email: booking.customerEmail });
        if (user) {
          const promoIndex = user.redeemedRewards?.findIndex(r => r.code === booking.promoCode);
          if (promoIndex !== undefined && promoIndex > -1) {
            user.redeemedRewards[promoIndex].isUsed = false;
            await user.save();
          }
        }
      }
      await booking.save();
      return res.status(400).json({ error: "Payment was failed or cancelled. Booking has been cancelled." });
    }

    if (booking.paymentStatus === "Paid") {
      return res.json({ success: true, message: "Payment already verified.", booking });
    }

    if (method === "esewa" && data) {
      const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
      if (decoded.status !== "COMPLETE") {
        booking.paymentStatus = "Failed";
        await booking.save();
        return res.status(400).json({ error: "eSewa payment not completed." });
      }

      const esewaVerifyUrl = process.env.ESEWA_VERIFY_URL || "https://rc-epay.esewa.com.np/api/epay/transaction/status/";
      const verifyUrl = `${esewaVerifyUrl}?product_code=${encodeURIComponent(process.env.ESEWA_MERCHANT_CODE)}&total_amount=${encodeURIComponent(decoded.total_amount)}&transaction_uuid=${encodeURIComponent(decoded.transaction_uuid)}`;
      
      const verifyResponse = await fetch(verifyUrl);
      if (!verifyResponse.ok) {
        return res.status(400).json({ error: "Failed to verify payment with eSewa." });
      }

      const verifyJson = await verifyResponse.json();
      if (verifyJson.status !== "COMPLETE" || verifyJson.transaction_uuid !== decoded.transaction_uuid) {
        return res.status(400).json({ error: "Payment verification mismatched." });
      }

      if (Number(verifyJson.total_amount) !== booking.price) {
        return res.status(400).json({ error: "Payment amount mismatched." });
      }

      booking.paymentStatus = "Paid";
      booking.esewaTransactionUuid = decoded.transaction_uuid;
      await booking.save();

      return res.json({ success: true, message: "Payment verified successfully.", booking });
    }

    if (method === "khalti") {
      const token = req.query.token;
      const amount = req.query.amount;
      const pidx = req.query.pidx;

      if (token) {
        // KPG-1 (old API) Verification
        const khaltiSecret = "Key test_secret_key_3f78fb6364ef4bd1b5fc670ce33a06f5";
        const verifyResponse = await fetch("https://khalti.com/api/v2/payment/verify/", {
          method: "POST",
          headers: {
            "Authorization": khaltiSecret,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token, amount })
        });

        if (!verifyResponse.ok) {
          const rawErr = await verifyResponse.text();
          console.error("Khalti KPG-1 verification failure:", rawErr);
          return res.status(400).json({ error: "Failed to verify legacy Khalti payment." });
        }

        booking.paymentStatus = "Paid";
        booking.khaltiPidx = String(token);
        await booking.save();
        return res.json({ success: true, message: "Payment verified successfully.", booking });
      } else if (pidx) {
        // KPG-2 (new API) Verification
        const khaltiVerifyUrl = process.env.KHALTI_VERIFY_URL || "https://dev.khalti.com/api/v2/epayment/lookup/";
        const khaltiSecret = process.env.KHALTI_SECRET_KEY || "Key test_secret_key_3f78fb6364ef4bd1b5fc670ce33a06f5";

        const verifyResponse = await fetch(khaltiVerifyUrl, {
          method: "POST",
          headers: {
            "Authorization": khaltiSecret,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ pidx })
        });

        if (!verifyResponse.ok) {
          return res.status(400).json({ error: "Failed to verify payment with Khalti." });
        }

        const verifyJson = await verifyResponse.json();
        if (verifyJson.status !== "Completed") {
          return res.status(400).json({ error: "Khalti payment not completed." });
        }

        if (Math.abs((verifyJson.total_amount / 100) - booking.price) > 0.01) {
          return res.status(400).json({ error: "Payment amount mismatched." });
        }

        booking.paymentStatus = "Paid";
        booking.khaltiPidx = pidx;
        await booking.save();
        return res.json({ success: true, message: "Payment verified successfully.", booking });
      } else {
        return res.status(400).json({ error: "Missing pidx or token for Khalti verification." });
      }
    }

    return res.status(400).json({ error: "Invalid verification request." });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Server error during payment verification." });
  }
});

// CREATE NEW BOOKING
router.post("/", requireAuth, async (req, res) => {
  try {
    const { service, serviceName, vehicle, date, time, location, price, paymentMethod } = req.body;
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
      eta: "",
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentStatus: (paymentMethod === "eSewa" || paymentMethod === "Khalti") ? "Pending" : "Paid",
      promoCode: req.body.promoCode || ""
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
      message: `Your booking for ${finalService} on ${date} has been confirmed.`,
      type: "booking",
      relatedId: bookingId
    }).save();

    // Broadcast to Admins
    await new Notification({
      userId: "admin_broadcast",
      title: "New Booking Received",
      message: `${req.user.name} booked ${finalService} for ${date} at ${time}.`,
      type: "booking",
      relatedId: bookingId
    }).save();

    // IF ESEWA: Generate dynamic signature and payload
    if (paymentMethod === "eSewa") {
      const esewaSecret = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
      const esewaMerchant = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
      const signatureString = `total_amount=${price},transaction_uuid=${bookingId},product_code=${esewaMerchant}`;
      const signature = generateEsewaSignature(esewaSecret, signatureString);

      return res.json({
        success: true,
        booking: newBooking,
        paymentMethod: "eSewa",
        esewaConfig: {
          amount: price,
          tax_amount: 0,
          total_amount: price,
          transaction_uuid: bookingId,
          product_code: esewaMerchant,
          product_service_charge: 0,
          product_delivery_charge: 0,
          success_url: `http://localhost:5173/payment-success?method=esewa&bookingId=${bookingId}`,
          failure_url: `http://localhost:5173/payment-success?method=esewa&bookingId=${bookingId}&status=failed`,
          signed_field_names: "total_amount,transaction_uuid,product_code",
          signature
        }
      });
    }

    // IF KHALTI: Return KPG-1 parameters for frontend popup initiation
    if (paymentMethod === "Khalti") {
      return res.json({
        success: true,
        booking: newBooking,
        paymentMethod: "Khalti",
        khaltiConfig: {
          publicKey: "test_public_key_617c4c6fe77c441d88451ec1408a0c0e",
          productIdentity: bookingId,
          productName: `Service Booking: ${finalService}`,
          productUrl: `http://localhost:5173/book`,
          amount: Math.round(price * 100), // paisa
          bookingId: bookingId
        }
      });
    }

    res.json({ success: true, booking: newBooking });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ error: "Failed to create booking." });
  }
});

// UPDATE STATUS (Admin, Superadmin, or Customer owner cancellation)
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status, technician, eta } = req.body;
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const isAdminOrSuper = req.user.role === "Admin" || req.user.role === "Superadmin";
    
    if (!isAdminOrSuper) {
      if (booking.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied. You do not own this booking." });
      }
      if (status !== "Cancelled" || technician || eta) {
        return res.status(403).json({ error: "Insufficient permissions. Customers can only cancel their bookings." });
      }
    }

    if (status) booking.status = status;
    if (isAdminOrSuper) {
      if (technician) booking.technician = technician;
      if (eta !== undefined) booking.eta = eta;
    }

    // Release promo code if cancelled
    if (status === "Cancelled") {
      if (booking.promoCode) {
        const user = await User.findOne({ email: booking.customerEmail });
        if (user) {
          const promoIndex = user.redeemedRewards?.findIndex(r => r.code === booking.promoCode);
          if (promoIndex !== undefined && promoIndex > -1) {
            user.redeemedRewards[promoIndex].isUsed = false;
            await user.save();
          }
        }
      }
    }

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
      severity: status === "Cancelled" ? "warn" : "info"
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
