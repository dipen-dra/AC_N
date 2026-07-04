const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Service = require("../models/Service");

async function seedDatabase() {
  try {
    // 1. Seed Services (Essential for catalog booking)
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      console.log("Seeding core services in MongoDB...");
      const coreServices = [
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
      await Service.insertMany(coreServices);
    }

    // 2. Seed Administrative Users (Required for dashboard verification)
    const adminCount = await User.countDocuments({ role: { $in: ["Admin", "Superadmin", "SuperAdmin"] } });
    if (adminCount === 0) {
      console.log("Seeding core administrative accounts in MongoDB...");
      const coreAdmins = [
        {
          id: "U-1",
          name: "Admin User",
          email: "admin@autocare.com",
          phone: "9801234567",
          passwordHash: bcrypt.hashSync("password123", 10),
          points: 0,
          tier: "Bronze",
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
          points: 0,
          tier: "Bronze",
          initial: "S",
          status: "Active",
          role: "Superadmin"
        }
      ];
      await User.insertMany(coreAdmins);
    }

    console.log("Core seed logic check completed.");
  } catch (err) {
    console.error("Database seed check failed:", err);
  }
}

module.exports = seedDatabase;
