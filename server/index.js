const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/autocare_nepal";
const JWT_SECRET = process.env.JWT_SECRET || "autocare_secret_key_123456";

// 1. Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:8080", "http://localhost:8081"],
  credentials: true
}));

// 2. Mongoose Schemas & Models
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
  points: { type: Number, default: 0 },
  tier: { type: String, default: "Bronze" },
  initial: { type: String, required: true },
  status: { type: String, default: "Active" },
  role: { type: String, default: "Customer" } // Customer, Admin, Superadmin
});

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  customerEmail: { type: String, required: true },
  service: { type: String, required: true },
  vehicle: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, default: "Upcoming" }, // Upcoming, Confirmed, In Progress, Completed, Cancelled
  technician: { type: String, default: "-" },
  eta: { type: String, default: "" }
});

const serviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  desc: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true },
  category: { type: String, required: true },
  popular: { type: Boolean, default: false },
  features: [String]
});

const chatMessageSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  role: { type: String, required: true }, // user, bot
  text: { type: String, required: true },
  time: { type: String, required: true }
});

const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  ip: { type: String, default: "-" },
  time: { type: String, required: true },
  severity: { type: String, default: "info" } // info, warn, critical
});

const User = mongoose.model("User", userSchema);
const Booking = mongoose.model("Booking", bookingSchema);
const Service = mongoose.model("Service", serviceSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
const AuditLog = mongoose.model("AuditLog", auditLogSchema);

// 3. Database Seeding on boot
async function seedDatabase() {
  try {
    // 1. Seed Services
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      console.log("Seeding mock services in MongoDB...");
      const mockServices = [
        {
          id: "S-1",
          name: "Super Wash",
          desc: "Complete exterior foam wash, interior vacuuming, dashboard polishing & tire dressing.",
          price: 1200,
          duration: "45 mins",
          category: "Wash",
          popular: true,
          features: ["Foam Wash", "Vacuuming", "Dashboard Polish", "Tire dressing"]
        },
        {
          id: "S-2",
          name: "Oil & Filter Change",
          desc: "Premium engine oil replacement, new oil filter installation & multi-point fluid checks.",
          price: 4500,
          duration: "30 mins",
          category: "Maintenance",
          popular: false,
          features: ["Premium Engine Oil", "Filter Replacement", "Fluid Level Checks", "Coolant Top-up"]
        },
        {
          id: "S-3",
          name: "Brake Checkup",
          desc: "Full brake pad inspection, disc resurfacing, brake fluid flush & line bleed.",
          price: 2500,
          duration: "1 hour",
          category: "Repairs",
          popular: false,
          features: ["Pad Inspection", "Disc Resurfacing", "Fluid Flush", "Brake Line Bleed"]
        },
        {
          id: "S-4",
          name: "Full Servicing",
          desc: "Total inspection, air/cabin filters, engine check, basic alignment, complete detailing.",
          price: 9500,
          duration: "4 hours",
          category: "General",
          popular: true,
          features: ["Total Inspection", "Filters Swap", "Basic Alignment", "Detailing & Polish"]
        },
        {
          id: "S-5",
          name: "A/C Service",
          desc: "Refrigerant recharge, leak detection, cabin filter swap, blower vent sterilization.",
          price: 3200,
          duration: "1.5 hours",
          category: "Detailing",
          popular: false,
          features: ["AC Gas Refill", "Leak Test", "Cabin Filter Swap", "Blower Sterilization"]
        },
        {
          id: "S-6",
          name: "Wheel Alignment",
          desc: "3D computerized wheel alignment, camber/toe adjustment, tire rotation & pressure check.",
          price: 1800,
          duration: "45 mins",
          category: "Maintenance",
          popular: false,
          features: ["3D Alignment", "Camber Adjustments", "Tire Rotation", "Pressure Check"]
        }
      ];
      await Service.insertMany(mockServices);
    }

    // 2. Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("Seeding mock users in MongoDB...");
      const mockUsers = [
        {
          id: "U-1",
          name: "Admin User",
          email: "admin@autocare.com",
          phone: "9801234567",
          passwordHash: bcrypt.hashSync("password123", 10),
          points: 1200,
          tier: "Gold",
          initial: "A",
          status: "Active",
          role: "Admin"
        },
        {
          id: "U-2",
          name: "Super Admin",
          email: "super@autocare.com",
          phone: "9807654321",
          passwordHash: bcrypt.hashSync("password123", 10),
          points: 3000,
          tier: "Platinum",
          initial: "S",
          status: "Active",
          role: "Superadmin"
        },
        {
          id: "U-3",
          name: "Ram Kumar",
          email: "user@autocare.com",
          phone: "9841234567",
          passwordHash: bcrypt.hashSync("password123", 10),
          points: 450,
          tier: "Bronze",
          initial: "R",
          status: "Active",
          role: "Customer"
        }
      ];
      await User.insertMany(mockUsers);
    }

    // 3. Seed Bookings
    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0) {
      console.log("Seeding mock bookings in MongoDB...");
      const mockBookings = [
        {
          id: "AC-2026-0515-000123",
          customer: "Ram Kumar",
          customerEmail: "user@autocare.com",
          service: "Full Servicing",
          vehicle: "Toyota Yaris (BA 2 PA 5512)",
          date: "15 May, 2026",
          time: "10:00 AM",
          location: "Lalitpur, Nepal",
          price: 9500,
          status: "In Progress",
          technician: "Ramesh KC",
          eta: "03:30 PM - 04:00 PM"
        },
        {
          id: "AC-2026-0501-000098",
          customer: "Ram Kumar",
          customerEmail: "user@autocare.com",
          service: "Super Wash",
          vehicle: "Yamaha FZ (BA 92 PA 1120)",
          date: "01 May, 2026",
          time: "02:00 PM",
          location: "Kathmandu, Nepal",
          price: 1200,
          status: "Completed",
          technician: "Anil Thapa",
          eta: ""
        }
      ];
      await Booking.insertMany(mockBookings);
    }

    // 4. Seed Audit Logs
    const logCount = await AuditLog.countDocuments();
    if (logCount === 0) {
      console.log("Seeding mock audit logs in MongoDB...");
      const mockLogs = [
        {
          id: "L-101",
          userEmail: "super@autocare.com",
          action: "Initialize database schema",
          entity: "System Setup",
          ip: "127.0.0.1",
          time: new Date().toLocaleString(),
          severity: "info"
        }
      ];
      await AuditLog.insertMany(mockLogs);
    }

    console.log("MongoDB seeded successfully.");
  } catch (err) {
    console.error("Database seeding failed:", err);
  }
}

// 4. Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully.");
    seedDatabase();
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// 5. Auth Middleware
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

app.use(authenticateUser);

// 6. REST API Routes

// AUTHENTICATION ENDPOINTS
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "An account with this email already exists." });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const userId = `U-${randomNum}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const initial = name.charAt(0).toUpperCase() || "U";

    const newUser = new User({
      id: userId,
      name,
      email: email.toLowerCase().trim(),
      phone,
      passwordHash,
      points: 0,
      tier: "Bronze",
      initial,
      status: "Active",
      role: "Customer"
    });
    await newUser.save();

    // Drop cookie
    const token = jwt.sign({ id: userId, dbId: newUser._id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log Audit Trail
    const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLog = new AuditLog({
      id: logId,
      userEmail: email,
      action: "Registered account",
      entity: `User · ${userId}`,
      ip: req.ip || "-",
      time: new Date().toLocaleString(),
      severity: "info"
    });
    await newLog.save();

    res.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        points: newUser.points,
        tier: newUser.tier,
        initial: newUser.initial,
        status: newUser.status,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, error: "Registration failed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid email or password." });
    }

    if (user.status === "Suspended") {
      return res.status(403).json({ success: false, error: "Your account is suspended. Please contact support." });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      // Log failed audit log
      const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      const log = new AuditLog({
        id: logId,
        userEmail: email.toLowerCase().trim(),
        action: "Failed login attempt",
        entity: "Auth",
        ip: req.ip || "-",
        time: new Date().toLocaleString(),
        severity: "warn"
      });
      await log.save();
      return res.status(400).json({ success: false, error: "Invalid email or password." });
    }

    // Set cookie
    const token = jwt.sign({ id: user.id, dbId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Successful login audit trail
    const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
    const log = new AuditLog({
      id: logId,
      userEmail: user.email,
      action: "Logged in successfully",
      entity: `User · ${user.id}`,
      ip: req.ip || "-",
      time: new Date().toLocaleString(),
      severity: "info"
    });
    await log.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        points: user.points,
        tier: user.tier,
        initial: user.initial,
        status: user.status,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Login failed." });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    if (req.user) {
      const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      const log = new AuditLog({
        id: logId,
        userEmail: req.user.email,
        action: "Logged out",
        entity: `User · ${req.user.id}`,
        ip: req.ip || "-",
        time: new Date().toLocaleString(),
        severity: "info"
      });
      await log.save();
    }
    res.clearCookie("auth_session");
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, error: "Logout failed." });
  }
});

app.get("/api/auth/me", (req, res) => {
  if (!req.user) {
    return res.json({ success: true, user: null });
  }
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      points: req.user.points,
      tier: req.user.tier,
      initial: req.user.initial,
      status: req.user.status,
      role: req.user.role
    }
  });
});

// SERVICES ENDPOINTS
app.get("/api/services", async (req, res) => {
  try {
    const services = await Service.find({});
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch services." });
  }
});

// BOOKINGS ENDPOINTS
app.get("/api/bookings", requireAuth, async (req, res) => {
  try {
    let query = {};
    // If not admin, restrict to self
    if (req.user.role !== "Admin" && req.user.role !== "Superadmin") {
      query.customerEmail = req.user.email;
    }
    const bookings = await Booking.find(query).sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

app.get("/api/bookings/:id", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    // Access check
    if (req.user.role !== "Admin" && req.user.role !== "Superadmin" && booking.customerEmail !== req.user.email) {
      return res.status(403).json({ error: "Access denied." });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch booking." });
  }
});

app.post("/api/bookings", requireAuth, async (req, res) => {
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

app.patch("/api/bookings/:id/status", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
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

// SUPPORT CHAT ENDPOINTS
app.get("/api/chat", requireAuth, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userEmail: req.user.email }).sort({ _id: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat." });
  }
});

app.post("/api/chat", requireAuth, async (req, res) => {
  try {
    const { role, text } = req.body;
    if (!role || !text) {
      return res.status(400).json({ error: "Role and text are required." });
    }

    const newMessage = new ChatMessage({
      userEmail: req.user.email,
      role,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
    await newMessage.save();

    res.json({ success: true, message: newMessage });
  } catch (err) {
    res.status(500).json({ error: "Failed to save chat message." });
  }
});

// ANALYTICS ENDPOINTS
app.get("/api/admin/analytics", requireAuth, requireRole(["Admin", "Superadmin"]), async (req, res) => {
  try {
    // Calculate revenues and aggregates
    const bookings = await Booking.find({});
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === "Completed");
    const completedRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
    const customerCount = await User.countDocuments({ role: "Customer" });

    // Derive service mix percentage
    const serviceCounts = {};
    bookings.forEach(b => {
      serviceCounts[b.service] = (serviceCounts[b.service] || 0) + 1;
    });
    const totalServicesCount = Object.values(serviceCounts).reduce((a, b) => a + b, 0) || 1;
    const serviceMix = Object.keys(serviceCounts).map(name => ({
      name,
      value: Math.round((serviceCounts[name] / totalServicesCount) * 100)
    }));

    // Mock monthly trends to populate chart nicely
    const revenueData = [
      { month: "Jan", revenue: 450000, bookings: 32 },
      { month: "Feb", revenue: 580000, bookings: 41 },
      { month: "Mar", revenue: 480000, bookings: 35 },
      { month: "Apr", revenue: 720000, bookings: 53 },
      { month: "May", revenue: completedRevenue || 880000, bookings: totalBookings || 62 }
    ];

    res.json({
      summary: {
        completedRevenue,
        totalBookings,
        customerCount
      },
      revenueData,
      serviceMix
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load analytics." });
  }
});

// SUPERADMIN AUDIT LOGS ENDPOINT
app.get("/api/superadmin/audit", requireAuth, requireRole(["Superadmin"]), async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ _id: -1 }).limit(50);
    // Format to match client representation
    const formattedLogs = logs.map(l => ({
      id: l.id,
      severity: l.severity,
      time: l.time,
      user: l.userEmail,
      action: l.action,
      entity: l.entity,
      ip: l.ip
    }));
    res.json(formattedLogs);
  } catch (err) {
    res.status(500).json({ error: "Failed to load audit logs." });
  }
});

// Start Express App
app.listen(PORT, () => {
  console.log(`Express MERN server is running on port ${PORT}`);
});
