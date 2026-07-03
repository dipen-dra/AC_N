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
  avatar: string | null;
}

// 1. Get Current User (Client API Fetcher)
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await fetch("/api/auth/me");
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
