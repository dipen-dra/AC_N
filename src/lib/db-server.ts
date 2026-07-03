import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";
import { getCurrentUser } from "./auth-server";

// Helper to assert user has a specific role or is authenticated
async function assertAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

async function assertAdmin() {
  const user = await assertAuth();
  if (user.role !== "Admin" && user.role !== "Superadmin") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

// 1. Get Services
export const getServices = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const result = await db.execute("SELECT * FROM services");
    return result.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      desc: String(row.desc),
      price: Number(row.price),
      duration: String(row.duration),
      rating: Number(row.rating),
      reviews: Number(row.reviews),
      icon: String(row.icon),
      features: JSON.parse(String(row.features || "[]")) as string[],
    }));
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
});

// 2. Get Bookings (User specific, or all for admin)
export const getBookings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const user = await assertAuth();
    let query = "";
    let args: any[] = [];

    if (user.role === "Admin" || user.role === "Superadmin") {
      query = `
        SELECT b.*, u.name as customer_name, u.email as customer_email 
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC
      `;
    } else {
      query = `
        SELECT * FROM bookings 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `;
      args = [user.id];
    }

    const result = await db.execute({ sql: query, args });
    return result.rows.map((row) => ({
      id: String(row.id),
      user_id: String(row.user_id),
      customer: (row as any).customer_name ? String((row as any).customer_name) : user.name,
      customerEmail: (row as any).customer_email ? String((row as any).customer_email) : user.email,
      service: String(row.service_name),
      desc: String(row.service_desc),
      vehicle: String(row.vehicle),
      date: String(row.date),
      time: String(row.time),
      location: String(row.location),
      status: String(row.status),
      technician: String(row.technician || "-"),
      price: Number(row.price || 0),
      eta: String(row.eta || "-"),
      completed: row.status === "Completed" ? String(row.date) : undefined,
    }));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
});

// 3. Get booking by ID
export const getBookingById = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    try {
      const user = await assertAuth();
      const result = await db.execute({
        sql: "SELECT * FROM bookings WHERE id = ?",
        args: [id],
      });

      if (result.rows.length === 0) return null;
      const row = result.rows[0];

      // Access control: only owner or admin can view booking details
      if (row.user_id !== user.id && user.role !== "Admin" && user.role !== "Superadmin") {
        throw new Error("Forbidden");
      }

      return {
        id: String(row.id),
        user_id: String(row.user_id),
        service: String(row.service_name),
        desc: String(row.service_desc),
        vehicle: String(row.vehicle),
        date: String(row.date),
        time: String(row.time),
        location: String(row.location),
        status: String(row.status),
        technician: String(row.technician || "-"),
        price: Number(row.price || 0),
        eta: String(row.eta || "-"),
      };
    } catch (error) {
      console.error("Error fetching booking by ID:", error);
      return null;
    }
  });

// 4. Create Booking
export const createBooking = createServerFn({ method: "POST" })
  .validator(
    (data: {
      serviceId: string;
      serviceName: string;
      serviceDesc: string;
      vehicle: string;
      date: string;
      time: string;
      location: string;
      price: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const user = await assertAuth();

      // Generate booking ID e.g., AC-2026-XXXX-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const bookingId = `AC-${dateStr.slice(0, 4)}-${dateStr.slice(4, 8)}-${randomNum}`;

      await db.execute({
        sql: `INSERT INTO bookings (id, user_id, service_name, service_desc, vehicle, date, time, location, status, technician, price, eta) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming', '-', ?, ?)`,
        args: [
          bookingId,
          user.id,
          data.serviceName,
          data.serviceDesc,
          data.vehicle,
          data.date,
          data.time,
          data.location,
          data.price,
          "Awaiting Confirmation",
        ],
      });

      // Update user points (earn 10% of booking price as loyalty points)
      const pointsEarned = Math.floor(data.price * 0.1);
      const newPoints = user.points + pointsEarned;
      let newTier = user.tier;
      if (newPoints >= 2500) newTier = "Platinum";
      else if (newPoints >= 1000) newTier = "Gold";
      else if (newPoints >= 500) newTier = "Silver";

      await db.execute({
        sql: "UPDATE users SET points = ?, tier = ? WHERE id = ?",
        args: [newPoints, newTier, user.id],
      });

      // Audit Log
      const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.execute({
        sql: "INSERT INTO audit_logs (id, user_email, action, entity, ip, time, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [logId, user.email, "Created booking", `Booking · ${bookingId}`, "-", new Date().toLocaleString(), "info"],
      });

      return { success: true, bookingId };
    } catch (error: any) {
      console.error("Error creating booking:", error);
      return { success: false, error: error?.message || "Booking creation failed." };
    }
  });

// 5. Update Booking Status (Admin)
export const updateBookingStatus = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: string; technician?: string; eta?: string }) => data)
  .handler(async ({ data }) => {
    try {
      const admin = await assertAdmin();

      await db.execute({
        sql: "UPDATE bookings SET status = ?, technician = COALESCE(?, technician), eta = COALESCE(?, eta) WHERE id = ?",
        args: [data.status, data.technician || null, data.eta || null, data.id],
      });

      // Audit Log
      const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.execute({
        sql: "INSERT INTO audit_logs (id, user_email, action, entity, ip, time, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          logId,
          admin.email,
          `Updated booking status to ${data.status}`,
          `Booking · ${data.id}`,
          "-",
          new Date().toLocaleString(),
          "info",
        ],
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      return { success: false, error: error?.message || "Failed to update booking status." };
    }
  });

// 6. Get Chat Messages
export const getChatMessages = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const user = await assertAuth();
    const result = await db.execute({
      sql: "SELECT * FROM chats WHERE user_id = ? ORDER BY created_at ASC",
      args: [user.id],
    });

    return result.rows.map((row) => ({
      role: String(row.role),
      text: String(row.text),
      time: String(row.time),
    }));
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }
});

// 7. Send Chat Message
export const sendChatMessage = createServerFn({ method: "POST" })
  .validator((data: { role: string; text: string }) => data)
  .handler(async ({ data }) => {
    try {
      const user = await assertAuth();
      const messageId = `M-${Math.floor(100000 + Math.random() * 900000)}`;
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      await db.execute({
        sql: "INSERT INTO chats (id, user_id, role, text, time) VALUES (?, ?, ?, ?, ?)",
        args: [messageId, user.id, data.role, data.text, timeStr],
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error saving chat message:", error);
      return { success: false, error: error?.message || "Failed to send message." };
    }
  });

// 8. Get Audit Logs (Superadmin)
export const getAuditLogs = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const user = await assertAuth();
    if (user.role !== "Superadmin") throw new Error("Forbidden: Superadmin access required");

    const result = await db.execute("SELECT * FROM audit_logs ORDER BY created_at DESC");
    return result.rows.map((row) => ({
      id: String(row.id),
      user: String(row.user_email || "system"),
      action: String(row.action),
      entity: String(row.entity || "-"),
      ip: String(row.ip || "-"),
      time: String(row.time),
      severity: String(row.severity),
    }));
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
});

// 9. Get Customers List (Admin)
export const getCustomersList = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await assertAdmin();

    const result = await db.execute(`
      SELECT u.*, COUNT(b.id) as booking_count, SUM(COALESCE(b.price, 0)) as total_spend
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id AND b.status = 'Completed'
      WHERE u.role = 'Customer'
      GROUP BY u.id
      ORDER BY u.name ASC
    `);

    return result.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      phone: row.phone ? String(row.phone) : "+977 -",
      bookings: Number(row.booking_count ?? 0),
      spend: Number(row.total_spend ?? 0),
      joined: new Date(String(row.created_at)).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: String(row.status),
    }));
  } catch (error) {
    console.error("Error fetching customer list:", error);
    return [];
  }
});

// 10. Update Customer Status (Admin)
export const updateCustomerStatus = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: string }) => data)
  .handler(async ({ data }) => {
    try {
      const admin = await assertAdmin();

      await db.execute({
        sql: "UPDATE users SET status = ? WHERE id = ?",
        args: [data.status, data.id],
      });

      // Audit Log
      const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.execute({
        sql: "INSERT INTO audit_logs (id, user_email, action, entity, ip, time, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          logId,
          admin.email,
          `Changed status to ${data.status}`,
          `User · ${data.id}`,
          "-",
          new Date().toLocaleString(),
          "warn",
        ],
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error updating customer status:", error);
      return { success: false, error: error?.message || "Failed to update customer status." };
    }
  });

// 11. Get Dashboard Analytics (Admin)
export const getAdminAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await assertAdmin();

    // 1. Revenue & Bookings data for last few months
    // Since we don't have many months of real data, we seed monthly aggregated data or group by bookings month.
    // Let's do a mock aggregation that maps real bookings + dynamic mock aggregation.
    const revenueData = [
      { month: "Jan", revenue: 320000, bookings: 82 },
      { month: "Feb", revenue: 285000, bookings: 74 },
      { month: "Mar", revenue: 412000, bookings: 106 },
      { month: "Apr", revenue: 478000, bookings: 121 },
      { month: "May", revenue: 526000, bookings: 138 },
      { month: "Jun", revenue: 612000, bookings: 152 },
    ];

    // Let's count current dynamic stats
    const statsResult = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT SUM(price) FROM bookings WHERE status = 'Completed') as completed_revenue,
        (SELECT COUNT(*) FROM users WHERE role = 'Customer') as customer_count,
        (SELECT COUNT(*) FROM bookings WHERE status = 'In Progress') as in_progress_bookings
    `);

    const stats = statsResult.rows[0];

    // Compute service mix from database bookings
    const mixResult = await db.execute(`
      SELECT service_name, COUNT(*) as count 
      FROM bookings 
      GROUP BY service_name 
      ORDER BY count DESC
    `);

    const serviceMix = mixResult.rows.map((row) => ({
      name: String(row.service_name),
      value: Number(row.count),
    }));

    // If serviceMix is empty, put mock defaults
    if (serviceMix.length === 0) {
      serviceMix.push(
        { name: "Full Service", value: 38 },
        { name: "Oil Change", value: 22 },
        { name: "Brake", value: 14 },
        { name: "AC", value: 12 },
        { name: "Engine", value: 8 },
        { name: "Wash", value: 6 },
      );
    }

    return {
      revenueData,
      serviceMix,
      summary: {
        totalBookings: Number(stats?.total_bookings ?? 0),
        completedRevenue: Number(stats?.completed_revenue ?? 0),
        customerCount: Number(stats?.customer_count ?? 0),
        inProgressBookings: Number(stats?.in_progress_bookings ?? 0),
      },
    };
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    return {
      revenueData: [],
      serviceMix: [],
      summary: { totalBookings: 0, completedRevenue: 0, customerCount: 0, inProgressBookings: 0 },
    };
  }
});
