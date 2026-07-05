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
  avatar?: string | null;
  address?: string;
  vehicles?: { plate: string; model: string; primary: boolean }[];
  twoFactorEnabled?: boolean;
}

// 1. Get Current User (Client API Fetcher)
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await fetch("/api/auth/me", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.user || null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

// 2. Register User (Client API Fetcher)
export const registerUser = async ({ data }: { data: any }) => {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error registering user:", error);
    return { success: false, error: "Registration request failed." };
  }
};

// 3. Login User (Client API Fetcher)
export const loginUser = async ({ data }: { data: any }) => {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error logging in user:", error);
    return { success: false, error: "Login request failed." };
  }
};

// 4. Logout User (Client API Fetcher)
export const logoutUser = async () => {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error) {
    console.error("Error logging out user:", error);
    return { success: false, error: "Logout request failed." };
  }
};

// 5. Upload Avatar (Client API Fetcher)
export const uploadAvatar = async (file: File): Promise<{ success: boolean; avatar?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await fetch("/api/auth/avatar", {
      method: "POST",
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return { success: false, error: "Upload request failed." };
  }
};

// 6. Get Notifications Count (Client API Fetcher)
export const getNotifications = async (): Promise<{ count: number; notifications: any[] }> => {
  try {
    const response = await fetch("/api/auth/notifications");
    if (!response.ok) return { count: 0, notifications: [] };
    return await response.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { count: 0, notifications: [] };
  }
};

export const markNotificationsAsRead = async (): Promise<{ success: boolean }> => {
  try {
    const res = await fetch("/api/auth/notifications/read", { method: "PATCH" });
    return await res.json();
  } catch (error) {
    console.error(error);
    return { success: false };
  }
};

export const clearNotifications = async (): Promise<{ success: boolean }> => {
  try {
    const res = await fetch("/api/auth/notifications", { method: "DELETE" });
    return await res.json();
  } catch (error) {
    console.error(error);
    return { success: false };
  }
};

export const updateProfile = async (data: { phone?: string; address?: string }): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const res = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const addVehicle = async (plate: string, model: string): Promise<{ success: boolean; vehicles?: any[]; error?: string }> => {
  try {
    const res = await fetch("/api/auth/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plate, model })
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const removeVehicle = async (plate: string): Promise<{ success: boolean; vehicles?: any[]; error?: string }> => {
  try {
    const res = await fetch(`/api/auth/vehicles/${encodeURIComponent(plate)}`, { method: "DELETE" });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const editVehicle = async (plate: string, newPlate: string, newModel: string): Promise<{ success: boolean; vehicles?: any[]; error?: string }> => {
  try {
    const res = await fetch(`/api/auth/vehicles/${plate}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPlate, newModel }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: "Failed to edit vehicle." };
  }
};

export const generate2FA = async (): Promise<{ success: boolean; secret?: string; qrCode?: string; error?: string }> => {
  try {
    const res = await fetch("/api/auth/2fa/generate", { method: "POST" });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const enable2FA = async (secret: string, token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch("/api/auth/2fa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, token })
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const disable2FA = async (token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch("/api/auth/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const verifyLogin2FA = async (tempToken: string, otp: string): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    const res = await fetch("/api/auth/login/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tempToken, otp })
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
