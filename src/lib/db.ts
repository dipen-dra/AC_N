import { createClient } from "@libsql/client";
import crypto from "crypto";

// Initialize LibSQL Client pointing to a local SQLite database file
export const db = createClient({
  url: "file:autocare.db",
});

// Password hashing utility (pure JS, Node/Bun compatible)
export function hashPassword(password: string): string {
  const salt = "autocare_nepal_salt_2026";
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Function to initialize tables and seed mock data
export async function initializeDatabase() {
  try {
    // 1. Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        points INTEGER DEFAULT 0,
        tier TEXT DEFAULT 'Bronze',
        initial TEXT,
        status TEXT DEFAULT 'Active',
        role TEXT DEFAULT 'Customer',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        desc TEXT,
        price REAL NOT NULL,
        duration TEXT,
        rating REAL DEFAULT 5.0,
        reviews INTEGER DEFAULT 0,
        icon TEXT,
        features TEXT -- JSON string array
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        service_name TEXT NOT NULL,
        service_desc TEXT,
        vehicle TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        location TEXT,
        status TEXT DEFAULT 'Upcoming',
        technician TEXT,
        price REAL,
        eta TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL, -- 'user' or 'bot' or 'technician'
        text TEXT NOT NULL,
        time TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_email TEXT,
        action TEXT NOT NULL,
        entity TEXT,
        ip TEXT,
        time TEXT NOT NULL,
        severity TEXT DEFAULT 'info',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Check if we need to seed services
    const servicesCheck = await db.execute("SELECT count(*) as count FROM services");
    const servicesCount = Number(servicesCheck.rows[0]?.count ?? 0);

    if (servicesCount === 0) {
      console.log("Seeding services database...");
      const mockServices = [
        { id: "full", name: "Full Service", desc: "Complete inspection and servicing for optimal performance.", price: 4000, duration: "4-5 Hours", rating: 4.8, reviews: 256, icon: "wrench", features: JSON.stringify(["Engine Check", "Oil Change", "Brake Inspection", "Multi-point Check"]) },
        { id: "oil", name: "Oil Change", desc: "High quality oil change for better engine life.", price: 1200, duration: "30-45 Min", rating: 4.6, reviews: 182, icon: "droplet", features: JSON.stringify(["Oil Drain", "New Oil", "Oil Filter", "Safety Check"]) },
        { id: "brake", name: "Brake Service", desc: "Ensure your safety with our brake inspection service.", price: 1500, duration: "1-2 Hours", rating: 4.7, reviews: 146, icon: "disc", features: JSON.stringify(["Brake Pads Check", "Disc Check", "Fluid Top-up", "Safety Check"]) },
        { id: "engine", name: "Engine Repair", desc: "Expert engine diagnostics and repair service.", price: 6000, duration: "1 Day", rating: 4.9, reviews: 98, icon: "cog", features: JSON.stringify(["Engine Diagnosis", "Parts Replace", "Performance Test", "Safety Check"]) },
        { id: "ac", name: "AC Service", desc: "AC performance check and cooling optimization.", price: 2000, duration: "1-2 Hours", rating: 4.6, reviews: 120, icon: "snowflake", features: JSON.stringify(["Gas Top-up", "Filter Cleaning", "Performance Check", "Leak Test"]) },
        { id: "wash", name: "Car Wash & Detailing", desc: "Exterior wash and interior cleaning service.", price: 500, duration: "20-30 Min", rating: 4.5, reviews: 210, icon: "sparkles", features: JSON.stringify(["Exterior Wash", "Interior Cleaning", "Dashboard Polish", "Vacuum Cleaning"]) },
      ];

      for (const s of mockServices) {
        await db.execute({
          sql: "INSERT INTO services (id, name, desc, price, duration, rating, reviews, icon, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [s.id, s.name, s.desc, s.price, s.duration, s.rating, s.reviews, s.icon, s.features],
        });
      }
    }

    // 3. Check if we need to seed users
    const usersCheck = await db.execute("SELECT count(*) as count FROM users");
    const usersCount = Number(usersCheck.rows[0]?.count ?? 0);

    if (usersCount === 0) {
      console.log("Seeding users database...");
      const defaultHash = hashPassword("password123");
      const mockUsers = [
        { id: "U-1001", name: "Rehan Sharma", email: "rehan@autocare.np", phone: "+977 980-1234567", password_hash: defaultHash, points: 1240, tier: "Gold", initial: "R", status: "Active", role: "Customer" },
        { id: "U-1002", name: "Aayusha KC", email: "aayusha.kc@gmail.com", phone: "+977 981-2345678", password_hash: defaultHash, points: 540, tier: "Silver", initial: "A", status: "Active", role: "Customer" },
        { id: "U-1003", name: "Bikash Thapa", email: "bikash.t@gmail.com", phone: "+977 982-3456789", password_hash: defaultHash, points: 800, tier: "Silver", initial: "B", status: "Active", role: "Customer" },
        { id: "U-1004", name: "Sneha Rai", email: "sneha.rai@outlook.com", phone: "+977 983-4567890", password_hash: defaultHash, points: 100, tier: "Bronze", initial: "S", status: "Suspended", role: "Customer" },
        { id: "U-1005", name: "Prakash Adhikari", email: "prakash.a@gmail.com", phone: "+977 984-5678901", password_hash: defaultHash, points: 2600, tier: "Platinum", initial: "P", status: "Active", role: "Admin" },
        { id: "admin", name: "System Admin", email: "admin@autocare.np", phone: "+977 980-0000000", password_hash: hashPassword("admin123"), points: 0, tier: "Gold", initial: "A", status: "Active", role: "Admin" },
        { id: "super", name: "Super Admin", email: "super@autocare.np", phone: "+977 980-1111111", password_hash: hashPassword("super123"), points: 0, tier: "Platinum", initial: "S", status: "Active", role: "Superadmin" },
      ];

      for (const u of mockUsers) {
        await db.execute({
          sql: "INSERT INTO users (id, name, email, phone, password_hash, points, tier, initial, status, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [u.id, u.name, u.email, u.phone, u.password_hash, u.points, u.tier, u.initial, u.status, u.role],
        });
      }
    }

    // 4. Check if we need to seed bookings
    const bookingsCheck = await db.execute("SELECT count(*) as count FROM bookings");
    const bookingsCount = Number(bookingsCheck.rows[0]?.count ?? 0);

    if (bookingsCount === 0) {
      console.log("Seeding bookings database...");
      const mockBookings = [
        { id: "AC-2026-0515-000123", user_id: "U-1001", service_name: "Full Service", service_desc: "Complete inspection and servicing", vehicle: "BA 2 PA 5512", date: "2026-05-15", time: "10:00 AM", location: "Lalitpur, Nepal", status: "In Progress", technician: "Ramesh KC", price: 4000, eta: "03:30 PM - 04:00 PM" },
        { id: "AC-2026-0508-000112", user_id: "U-1001", service_name: "Oil Change", service_desc: "Engine oil and filter replacement", vehicle: "BA 1 JA 1234", date: "2026-05-20", time: "09:00 AM", location: "Kathmandu, Nepal", status: "Upcoming", technician: "Suman Rai", price: 1200, eta: "12:00 PM - 01:00 PM" },
        { id: "AC-2026-0510-000119", user_id: "U-1001", service_name: "Brake Service", service_desc: "General vehicle checkup", vehicle: "BA 3 CHA 5678", date: "2026-05-25", time: "11:00 AM", location: "Bhaktapur, Nepal", status: "Confirmed", technician: "-", price: 1500, eta: "02:00 PM - 03:00 PM" },
        { id: "AC-2026-0501-000098", user_id: "U-1001", service_name: "Full Service", service_desc: "Complete inspection and servicing", vehicle: "BA 2 PA 5512", date: "2026-05-01", time: "10:00 AM", location: "Lalitpur, Nepal", status: "Completed", technician: "Ramesh KC", price: 4000, eta: "Completed" },
        { id: "AC-2026-0425-000087", user_id: "U-1001", service_name: "Engine Repair", service_desc: "Engine oil replacement", vehicle: "BA 1 JA 1234", date: "2026-04-25", time: "09:00 AM", location: "Kathmandu, Nepal", status: "Cancelled", technician: "-", price: 6000, eta: "Cancelled" },
      ];

      for (const b of mockBookings) {
        await db.execute({
          sql: "INSERT INTO bookings (id, user_id, service_name, service_desc, vehicle, date, time, location, status, technician, price, eta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [b.id, b.user_id, b.service_name, b.service_desc, b.vehicle, b.date, b.time, b.location, b.status, b.technician, b.price, b.eta],
        });
      }
    }

    // 5. Check if we need to seed chats
    const chatsCheck = await db.execute("SELECT count(*) as count FROM chats");
    const chatsCount = Number(chatsCheck.rows[0]?.count ?? 0);

    if (chatsCount === 0) {
      console.log("Seeding chats database...");
      const mockChats = [
        { id: "C-1", user_id: "U-1001", role: "bot", text: "Hello! 👋 I'm your AI Assistant. How can I help you with your booking or service today?", time: "10:24 AM" },
        { id: "C-2", user_id: "U-1001", role: "user", text: "I want to reschedule my booking.", time: "10:25 AM" },
        { id: "C-3", user_id: "U-1001", role: "bot", text: "Sure! I can help you with that. Can you please share your Booking ID?", time: "10:25 AM" },
        { id: "C-4", user_id: "U-1001", role: "user", text: "My booking ID is AC-2026-0515-000123", time: "10:26 AM" },
        { id: "C-5", user_id: "U-1001", role: "bot", text: "Thanks! Please share your preferred date and time for rescheduling.", time: "10:26 AM" },
      ];

      for (const c of mockChats) {
        await db.execute({
          sql: "INSERT INTO chats (id, user_id, role, text, time) VALUES (?, ?, ?, ?, ?)",
          args: [c.id, c.user_id, c.role, c.text, c.time],
        });
      }
    }

    // 6. Check if we need to seed audit logs
    const auditLogsCheck = await db.execute("SELECT count(*) as count FROM audit_logs");
    const auditLogsCount = Number(auditLogsCheck.rows[0]?.count ?? 0);

    if (auditLogsCount === 0) {
      console.log("Seeding audit logs database...");
      const mockAuditLogs = [
        { id: "L-9821", user_email: "admin@autocare.np", action: "Updated pricing", entity: "Service · Full Service", ip: "202.51.74.12", time: "15 May 10:24 AM", severity: "info" },
        { id: "L-9820", user_email: "super@autocare.np", action: "Granted role: admin", entity: "User · U-1005", ip: "202.51.74.15", time: "15 May 09:11 AM", severity: "warn" },
        { id: "L-9819", user_email: "rehan@autocare.np", action: "Failed login (4 attempts)", entity: "Auth", ip: "27.34.66.201", time: "14 May 11:52 PM", severity: "critical" },
        { id: "L-9818", user_email: "admin@autocare.np", action: "Cancelled booking", entity: "Booking · AC-2026-0513-000118", ip: "202.51.74.12", time: "13 May 03:04 PM", severity: "warn" },
        { id: "L-9817", user_email: "system", action: "Nightly backup completed", entity: "System", ip: "-", time: "13 May 02:00 AM", severity: "info" },
      ];

      for (const a of mockAuditLogs) {
        await db.execute({
          sql: "INSERT INTO audit_logs (id, user_email, action, entity, ip, time, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [a.id, a.user_email, a.action, a.entity, a.ip, a.time, a.severity],
        });
      }
    }

    console.log("Database initialized and seeded successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}
