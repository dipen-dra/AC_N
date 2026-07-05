const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const AuditLog = require("../models/AuditLog");

async function seedDatabase() {
  try {
    // 1. Seed Services (Essential for catalog booking)
    const serviceCount = await Service.countDocuments();
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

    if (serviceCount === 0) {
      console.log("Seeding core services in MongoDB...");
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

    // 3. Seed Customers & Historical Bookings (if bookings are empty or less than 5)
    const bookingCount = await Booking.countDocuments();
    if (bookingCount < 5) {
      console.log("Empty or low bookings detected. Clearing and re-seeding historical customer data...");

      // Clear existing customers (leave admins intact)
      await User.deleteMany({ role: "Customer" });
      await Booking.deleteMany({});
      await AuditLog.deleteMany({});

      // Seed core customers
      const customers = [
        {
          id: "U-3",
          name: "User Customer",
          email: "user@autocare.com",
          phone: "9800000003",
          passwordHash: bcrypt.hashSync("password123", 10),
          points: 120,
          tier: "Bronze",
          initial: "U",
          status: "Active",
          role: "Customer"
        },
        {
          id: "U-4",
          name: "Ram Bahadur",
          email: "ram@gmail.com",
          phone: "9800000004",
          passwordHash: bcrypt.hashSync("password123", 10),
          points: 450,
          tier: "Silver",
          initial: "R",
          status: "Active",
          role: "Customer"
        },
        {
          id: "U-5",
          name: "Sita Sharma",
          email: "sita@gmail.com",
          phone: "9800000005",
          passwordHash: bcrypt.hashSync("password123", 10),
          points: 980,
          tier: "Gold",
          initial: "S",
          status: "Active",
          role: "Customer"
        },
        {
          id: "U-6",
          name: "Gita Adhikari",
          email: "gita@gmail.com",
          phone: "9800000006",
          passwordHash: bcrypt.hashSync("password123", 10),
          points: 1500,
          tier: "Platinum",
          initial: "G",
          status: "Active",
          role: "Customer"
        },
        {
          id: "U-7",
          name: "Shyam KC",
          email: "shyam@gmail.com",
          phone: "9800000007",
          passwordHash: bcrypt.hashSync("password123", 10),
          points: 250,
          tier: "Bronze",
          initial: "S",
          status: "Active",
          role: "Customer"
        }
      ];
      await User.insertMany(customers);
      console.log("Seeded customers.");

      // Create historical bookings spread over last 6 months
      const now = new Date();
      const monthOffsetData = [
        { offset: -5, count: 12 }, // 5 months ago
        { offset: -4, count: 15 }, // 4 months ago
        { offset: -3, count: 18 }, // 3 months ago
        { offset: -2, count: 14 }, // 2 months ago
        { offset: -1, count: 20 }, // 1 month ago
        { offset: 0, count: 10 }   // current month
      ];

      const technicians = ["Ramesh KC", "Bijay Shrestha", "Suman Rai", "Sabin Karki", "Any Available Mechanic"];
      const locations = ["Kathmandu", "Lalitpur", "Bhaktapur", "Kapan", "Chabahil", "Baneshwor", "Patan"];
      const times = ["10:00 AM - 12:00 PM", "12:00 PM - 02:00 PM", "04:00 PM - 06:00 PM", "06:00 PM - 08:00 PM"];
      const vehiclesList = [
        "Ba 3 Pa 4567 (Toyota Hilux)",
        "Ba 2 Pa 1234 (Hyundai i10)",
        "Ba 1 Pa 9876 (Suzuki Swift)",
        "Province 3-02-001 Pa 4321 (Honda Civic)",
        "Province 3-02-003 Pa 5566 (Ford Ranger)"
      ];

      const seededBookings = [];
      const seededAuditLogs = [];
      let bookingIndex = 1000;

      for (const mData of monthOffsetData) {
        const d = new Date(now.getFullYear(), now.getMonth() + mData.offset, 1);
        const year = d.getFullYear();
        const monthIdx = d.getMonth();

        for (let i = 0; i < mData.count; i++) {
          const randDay = Math.floor(Math.random() * 28) + 1;
          const randDayStr = String(randDay).padStart(2, "0");
          const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${randDayStr}`;
          
          const bookingDateObj = new Date(`${dateStr}T12:00:00Z`);

          const randomSvc = coreServices[Math.floor(Math.random() * coreServices.length)];
          const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
          const randomTech = technicians[Math.floor(Math.random() * technicians.length)];
          const randomLoc = locations[Math.floor(Math.random() * locations.length)];
          const randomTime = times[Math.floor(Math.random() * times.length)];
          const randomVeh = vehiclesList[Math.floor(Math.random() * vehiclesList.length)];

          const randStatusChance = Math.random();
          let status = "Completed";
          let paymentStatus = "Paid";
          
          if (mData.offset === 0) {
            // Current month has some upcoming and cancelled bookings too
            if (randStatusChance < 0.2) {
              status = "Upcoming";
              paymentStatus = "Pending";
            } else if (randStatusChance < 0.3) {
              status = "Cancelled";
              paymentStatus = "Failed";
            }
          } else {
            // Historic months are mostly completed or cancelled
            if (randStatusChance < 0.1) {
              status = "Cancelled";
              paymentStatus = "Failed";
            }
          }

          const methods = ["eSewa", "Khalti", "Cash on Delivery"];
          const paymentMethod = methods[Math.floor(Math.random() * methods.length)];

          const bookingId = `AC-${year}${String(monthIdx + 1).padStart(2, "0")}${randDayStr}-${bookingIndex++}`;

          seededBookings.push({
            id: bookingId,
            userId: randomCustomer.id,
            customer: randomCustomer.name,
            customerEmail: randomCustomer.email,
            service: randomSvc.name,
            vehicle: randomVeh,
            date: dateStr,
            time: randomTime,
            location: randomLoc,
            price: randomSvc.price,
            status,
            technician: status === "Upcoming" ? "-" : randomTech,
            eta: status === "Completed" ? "Completed" : "",
            paymentStatus,
            paymentMethod,
            createdAt: bookingDateObj,
            updatedAt: bookingDateObj
          });

          // Add corresponding audit log
          if (i % 2 === 0) {
            const auditTimeObj = new Date(bookingDateObj.getTime() - 10 * 60000); // 10 minutes earlier
            const severities = ["info", "info", "info", "warn"];
            const severity = severities[Math.floor(Math.random() * severities.length)];
            
            seededAuditLogs.push({
              id: `LOG-${bookingId}`,
              userEmail: randomCustomer.email,
              action: "Booking Created",
              entity: `Booking · ${bookingId}`,
              ip: "192.168.1.103",
              time: auditTimeObj.toISOString(),
              severity
            });
          }
        }
      }

      // Bypass Mongoose timestamps so the custom createdAt/updatedAt fields are preserved!
      await Booking.collection.insertMany(seededBookings);
      await AuditLog.collection.insertMany(seededAuditLogs);

      console.log(`Successfully seeded ${seededBookings.length} historical bookings.`);
      console.log(`Successfully seeded ${seededAuditLogs.length} historical audit logs.`);
    }

    console.log("Core seed logic check completed.");
  } catch (err) {
    console.error("Database seed check failed:", err);
  }
}

module.exports = seedDatabase;
