const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const AuditLog = require("../models/AuditLog");

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

module.exports = seedDatabase;
