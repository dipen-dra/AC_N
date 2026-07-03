import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { db, hashPassword, verifyPassword } from "./db";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  points: number;
  tier: string;
  initial: string;
  status: string;
  role: string;
}

// 1. Get Current User Server Function
export const getCurrentUser = createServerFn({ method: "GET" }).handler(async (): Promise<User | null> => {
  try {
    const userId = getCookie("auth_session");
    if (!userId) return null;

    const result = await db.execute({
      sql: "SELECT id, name, email, phone, points, tier, initial, status, role FROM users WHERE id = ?",
      args: [userId],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      phone: row.phone ? String(row.phone) : null,
      points: Number(row.points),
      tier: String(row.tier),
      initial: String(row.initial),
      status: String(row.status),
      role: String(row.role),
    };
  } catch (error) {
    console.error("Error in getCurrentUser server function:", error);
    return null;
  }
});

// 2. Register User Server Function
export const registerUser = createServerFn({ method: "POST" })
  .validator((data: { name: string; email: string; phone: string; password: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Validate inputs
      if (!data.name || !data.email || !data.password) {
        return { success: false, error: "Name, email, and password are required." };
      }

      // Check if user already exists
      const existingUser = await db.execute({
        sql: "SELECT id FROM users WHERE email = ?",
        args: [data.email.toLowerCase().trim()],
      });

      if (existingUser.rows.length > 0) {
        return { success: false, error: "An account with this email already exists." };
      }

      // Generate a new user ID
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const userId = `U-${randomNum}`;
      const passwordHash = hashPassword(data.password);
      const initial = data.name.charAt(0).toUpperCase() || "U";

      // Insert user
      await db.execute({
        sql: `INSERT INTO users (id, name, email, phone, password_hash, points, tier, initial, status, role) 
              VALUES (?, ?, ?, ?, ?, 0, 'Bronze', ?, 'Active', 'Customer')`,
        args: [userId, data.name, data.email.toLowerCase().trim(), data.phone, passwordHash, initial],
      });

      // Auto login by setting the cookie
      setCookie("auth_session", userId, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      // Log audit trail
      const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.execute({
        sql: "INSERT INTO audit_logs (id, user_email, action, entity, ip, time, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [logId, data.email, "Registered account", `User · ${userId}`, "-", new Date().toLocaleString(), "info"],
      });

      return { success: true, userId };
    } catch (error: any) {
      console.error("Error in registerUser:", error);
      return { success: false, error: error?.message || "Registration failed." };
    }
  });

// 3. Login User Server Function
export const loginUser = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    try {
      if (!data.email || !data.password) {
        return { success: false, error: "Email and password are required." };
      }

      const result = await db.execute({
        sql: "SELECT id, name, email, password_hash, status FROM users WHERE email = ?",
        args: [data.email.toLowerCase().trim()],
      });

      if (result.rows.length === 0) {
        return { success: false, error: "Invalid email or password." };
      }

      const user = result.rows[0];

      if (user.status === "Suspended") {
        return { success: false, error: "Your account is suspended. Please contact support." };
      }

      const isPasswordValid = verifyPassword(data.password, String(user.password_hash));
      if (!isPasswordValid) {
        // Log failed attempt
        const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
        await db.execute({
          sql: "INSERT INTO audit_logs (id, user_email, action, entity, ip, time, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [logId, data.email.toLowerCase().trim(), "Failed login attempt", "Auth", "-", new Date().toLocaleString(), "warn"],
        });
        return { success: false, error: "Invalid email or password." };
      }

      // Set cookie
      setCookie("auth_session", String(user.id), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      // Log successful login
      const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.execute({
        sql: "INSERT INTO audit_logs (id, user_email, action, entity, ip, time, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [logId, String(user.email), "Logged in successfully", `User · ${user.id}`, "-", new Date().toLocaleString(), "info"],
      });

      return { success: true, userId: String(user.id) };
    } catch (error: any) {
      console.error("Error in loginUser:", error);
      return { success: false, error: error?.message || "Login failed." };
    }
  });

// 4. Logout User Server Function
export const logoutUser = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const userId = getCookie("auth_session");

    if (userId) {
      const userResult = await db.execute({
        sql: "SELECT email FROM users WHERE id = ?",
        args: [userId],
      });

      if (userResult.rows.length > 0) {
        const logId = `L-${Math.floor(1000 + Math.random() * 9000)}`;
        await db.execute({
          sql: "INSERT INTO audit_logs (id, user_email, action, entity, ip, time, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [logId, String(userResult.rows[0].email), "Logged out", `User · ${userId}`, "-", new Date().toLocaleString(), "info"],
        });
      }
    }

    deleteCookie("auth_session");
    return { success: true };
  } catch (error: any) {
    console.error("Error in logoutUser:", error);
    return { success: false, error: error?.message || "Logout failed." };
  }
});
