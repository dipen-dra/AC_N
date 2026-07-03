export const brand = { name: "AutoCare", suffix: "Nepal" };

export const currentUser = {
  name: "Rehan Sharma",
  email: "rehan@autocare.np",
  phone: "+977 980-1234567",
  initial: "R",
  points: 1240,
  tier: "Gold",
};

export const services = [
  { id: "full", name: "Full Service", desc: "Complete inspection and servicing for optimal performance.", price: 4000, duration: "4-5 Hours", rating: 4.8, reviews: 256, icon: "wrench", features: ["Engine Check", "Oil Change", "Brake Inspection", "Multi-point Check"] },
  { id: "oil", name: "Oil Change", desc: "High quality oil change for better engine life.", price: 1200, duration: "30-45 Min", rating: 4.6, reviews: 182, icon: "droplet", features: ["Oil Drain", "New Oil", "Oil Filter", "Safety Check"] },
  { id: "brake", name: "Brake Service", desc: "Ensure your safety with our brake inspection service.", price: 1500, duration: "1-2 Hours", rating: 4.7, reviews: 146, icon: "disc", features: ["Brake Pads Check", "Disc Check", "Fluid Top-up", "Safety Check"] },
  { id: "engine", name: "Engine Repair", desc: "Expert engine diagnostics and repair service.", price: 6000, duration: "1 Day", rating: 4.9, reviews: 98, icon: "cog", features: ["Engine Diagnosis", "Parts Replace", "Performance Test", "Safety Check"] },
  { id: "ac", name: "AC Service", desc: "AC performance check and cooling optimization.", price: 2000, duration: "1-2 Hours", rating: 4.6, reviews: 120, icon: "snowflake", features: ["Gas Top-up", "Filter Cleaning", "Performance Check", "Leak Test"] },
  { id: "wash", name: "Car Wash & Detailing", desc: "Exterior wash and interior cleaning service.", price: 500, duration: "20-30 Min", rating: 4.5, reviews: 210, icon: "sparkles", features: ["Exterior Wash", "Interior Cleaning", "Dashboard Polish", "Vacuum Cleaning"] },
];

export const bookings = [
  { id: "AC-2026-0515-000123", service: "Full Service", desc: "Complete inspection and servicing", status: "In Progress", vehicle: "BA 2 PA 5512", date: "15 May, 2026", time: "10:00 AM", location: "Lalitpur, Nepal", eta: "03:30 PM - 04:00 PM", price: 4000 },
  { id: "AC-2026-0508-000112", service: "Oil Change", desc: "Engine oil and filter replacement", status: "Upcoming", vehicle: "BA 1 JA 1234", date: "20 May, 2026", time: "09:00 AM", location: "Kathmandu, Nepal", eta: "12:00 PM - 01:00 PM", price: 1200 },
  { id: "AC-2026-0510-000119", service: "Brake Service", desc: "General vehicle checkup", status: "Confirmed", vehicle: "BA 3 CHA 5678", date: "25 May, 2026", time: "11:00 AM", location: "Bhaktapur, Nepal", eta: "02:00 PM - 03:00 PM", price: 1500 },
];

export const bookingHistory = [
  { id: "AC-2026-0501-000098", service: "Full Service", vehicle: "BA 2 PA 5512", date: "01 May, 2026", time: "10:00 AM", location: "Lalitpur, Nepal", completed: "01 May, 2026 · 12:15 PM", status: "Completed" },
  { id: "AC-2026-0425-000087", service: "Engine oil replacement", vehicle: "BA 1 JA 1234", date: "25 Apr, 2026", time: "09:00 AM", location: "Kathmandu, Nepal", completed: "25 Apr, 2026 · 08:30 PM", status: "Cancelled" },
];

export const chatMessages = [
  { role: "bot", text: "Hello! 👋 I'm your AI Assistant. How can I help you with your booking or service today?", time: "10:24 AM" },
  { role: "user", text: "I want to reschedule my booking.", time: "10:25 AM" },
  { role: "bot", text: "Sure! I can help you with that. Can you please share your Booking ID?", time: "10:25 AM" },
  { role: "user", text: "My booking ID is AC-2026-0515-000123", time: "10:26 AM" },
  { role: "bot", text: "Thanks! Please share your preferred date and time for rescheduling.", time: "10:26 AM" },
];

export const faqs = [
  { q: "How do I book a service?", a: "Head to Book Service, select your vehicle, choose a service, and pick a date and time. Confirm and pay online or opt for cash." },
  { q: "How can I track my service?", a: "Every booking has a Track Service link that shows live status from booking to completion." },
  { q: "What payment methods do you accept?", a: "We accept eSewa, Khalti, all major cards, and cash on delivery at pickup." },
  { q: "How can I reschedule my booking?", a: "Open the booking from My Bookings and use the reschedule action, or chat with support." },
  { q: "Do you offer pickup and drop service?", a: "Yes, we offer free pickup and drop within the Kathmandu valley for all bookings." },
];

export const customers = [
  { id: "U-1001", name: "Rehan Sharma", email: "rehan@autocare.np", phone: "+977 980-1234567", bookings: 12, spend: 48200, joined: "12 Jan 2026", status: "Active" },
  { id: "U-1002", name: "Aayusha KC", email: "aayusha.kc@gmail.com", phone: "+977 981-2345678", bookings: 5, spend: 15600, joined: "22 Feb 2026", status: "Active" },
  { id: "U-1003", name: "Bikash Thapa", email: "bikash.t@gmail.com", phone: "+977 982-3456789", bookings: 8, spend: 28400, joined: "03 Mar 2026", status: "Active" },
  { id: "U-1004", name: "Sneha Rai", email: "sneha.rai@outlook.com", phone: "+977 983-4567890", bookings: 2, spend: 3200, joined: "18 Mar 2026", status: "Suspended" },
  { id: "U-1005", name: "Prakash Adhikari", email: "prakash.a@gmail.com", phone: "+977 984-5678901", bookings: 15, spend: 61200, joined: "05 Apr 2026", status: "Active" },
];

export const adminBookings = [
  { id: "AC-2026-0515-000123", customer: "Rehan Sharma", service: "Full Service", vehicle: "BA 2 PA 5512", date: "15 May, 2026", amount: 4000, status: "In Progress", technician: "Ramesh KC" },
  { id: "AC-2026-0515-000124", customer: "Aayusha KC", service: "Oil Change", vehicle: "BA 5 GA 3311", date: "15 May, 2026", amount: 1200, status: "Confirmed", technician: "Suman Rai" },
  { id: "AC-2026-0515-000125", customer: "Bikash Thapa", service: "Brake Service", vehicle: "BA 2 CHA 8890", date: "16 May, 2026", amount: 1500, status: "Upcoming", technician: "-" },
  { id: "AC-2026-0514-000121", customer: "Sneha Rai", service: "AC Service", vehicle: "BA 1 JA 4432", date: "14 May, 2026", amount: 2000, status: "Completed", technician: "Bijay Shrestha" },
  { id: "AC-2026-0513-000118", customer: "Prakash Adhikari", service: "Full Service", vehicle: "BA 3 KHA 1122", date: "13 May, 2026", amount: 4000, status: "Cancelled", technician: "-" },
];

export const revenueData = [
  { month: "Jan", revenue: 320000, bookings: 82 },
  { month: "Feb", revenue: 285000, bookings: 74 },
  { month: "Mar", revenue: 412000, bookings: 106 },
  { month: "Apr", revenue: 478000, bookings: 121 },
  { month: "May", revenue: 526000, bookings: 138 },
  { month: "Jun", revenue: 612000, bookings: 152 },
];

export const serviceMix = [
  { name: "Full Service", value: 38 },
  { name: "Oil Change", value: 22 },
  { name: "Brake", value: 14 },
  { name: "AC", value: 12 },
  { name: "Engine", value: 8 },
  { name: "Wash", value: 6 },
];

export const auditLogs = [
  { id: "L-9821", user: "admin@autocare.np", action: "Updated pricing", entity: "Service · Full Service", ip: "202.51.74.12", time: "15 May 10:24 AM", severity: "info" },
  { id: "L-9820", user: "super@autocare.np", action: "Granted role: admin", entity: "User · U-1005", ip: "202.51.74.15", time: "15 May 09:11 AM", severity: "warn" },
  { id: "L-9819", user: "rehan@autocare.np", action: "Failed login (4 attempts)", entity: "Auth", ip: "27.34.66.201", time: "14 May 11:52 PM", severity: "critical" },
  { id: "L-9818", user: "admin@autocare.np", action: "Cancelled booking", entity: "Booking · AC-2026-0513-000118", ip: "202.51.74.12", time: "13 May 03:04 PM", severity: "warn" },
  { id: "L-9817", user: "system", action: "Nightly backup completed", entity: "System", ip: "-", time: "13 May 02:00 AM", severity: "info" },
];

export const roles = [
  { name: "Superadmin", users: 2, perms: 42, desc: "Full control including role management and audit logs" },
  { name: "Admin", users: 6, perms: 28, desc: "Manage services, bookings, customers and chats" },
  { name: "Technician", users: 18, perms: 12, desc: "Update booking status, chat with customer" },
  { name: "Customer", users: 4210, perms: 8, desc: "Book, pay, track and review" },
];
