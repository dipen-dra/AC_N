// 1. Get All Services (Client API Fetcher)
export const getServices = async () => {
  try {
    const response = await fetch("/api/services");
    if (!response.ok) throw new Error("Failed to fetch services");
    return await response.json();
  } catch (error) {
    console.error("Error in getServices:", error);
    return [];
  }
};

// 2. Get All Bookings (Client API Fetcher)
export const getBookings = async () => {
  try {
    const response = await fetch("/api/bookings");
    if (!response.ok) throw new Error("Failed to fetch bookings");
    return await response.json();
  } catch (error) {
    console.error("Error in getBookings:", error);
    return [];
  }
};

// 3. Get Booking By ID (Client API Fetcher)
export const getBookingById = async ({ data: id }: { data: string }) => {
  try {
    const response = await fetch(`/api/bookings/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error in getBookingById for id ${id}:`, error);
    return null;
  }
};

// 4. Create New Booking (Client API Fetcher)
export const createBooking = async ({ data: payload }: { data: any }) => {
  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("Error in createBooking:", error);
    return { success: false, error: "Failed to create booking." };
  }
};

// 5. Update Booking Status (Client API Fetcher)
export const updateBookingStatus = async ({ data }: { data: any }) => {
  try {
    const { id, status, technician, eta } = data;
    const response = await fetch(`/api/bookings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, technician, eta }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error in updateBookingStatus:", error);
    return { success: false, error: "Failed to update booking status." };
  }
};

// 6. Get Support Chat Messages (Client API Fetcher)
export const getChatMessages = async () => {
  try {
    const response = await fetch("/api/chat");
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error in getChatMessages:", error);
    return [];
  }
};

// 7. Send Chat Message (Client API Fetcher)
export const sendChatMessage = async ({ data }: { data: any }) => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error in sendChatMessage:", error);
    return { success: false, error: "Failed to send chat message." };
  }
};

// 8. Get Audit Logs (Client API Fetcher)
export const getAuditLogs = async () => {
  try {
    const response = await fetch("/api/admin/audit");
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error in getAuditLogs:", error);
    return [];
  }
};

// 9. Get Admin Analytics (Client API Fetcher)
export const getAdminAnalytics = async () => {
  try {
    const response = await fetch("/api/admin/analytics");
    if (!response.ok) {
      return {
        summary: { completedRevenue: 0, totalBookings: 0, customerCount: 0 },
        revenueData: [],
        serviceMix: [],
      };
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getAdminAnalytics:", error);
    return {
      summary: { completedRevenue: 0, totalBookings: 0, customerCount: 0 },
      revenueData: [],
      serviceMix: [],
    };
  }
};

// 10. Get Admin Customers (Client API Fetcher)
export const getAdminCustomers = async () => {
  try {
    const response = await fetch("/api/admin/customers");
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error in getAdminCustomers:", error);
    return [];
  }
};

// 11. Update Customer Status (Client API Fetcher)
export const updateCustomerStatus = async ({ id, status }: { id: string; status: string }) => {
  try {
    const response = await fetch(`/api/admin/customers/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Failed to update status." };
  }
};

// 12. Delete Customer (Client API Fetcher)
export const deleteCustomer = async (id: string) => {
  try {
    const response = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Failed to delete customer." };
  }
};

// 13. Update Customer Role (Client API Fetcher)
export const updateCustomerRole = async ({ id, role }: { id: string; role: string }) => {
  try {
    const response = await fetch(`/api/admin/customers/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Failed to update role." };
  }
};

// 14. Create Service (Client API Fetcher)
export const createService = async (data: any) => {
  try {
    const response = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Failed to create service." };
  }
};

// 15. Update Service (Client API Fetcher)
export const updateService = async ({ id, data }: { id: string; data: any }) => {
  try {
    const response = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Failed to update service." };
  }
};

// 16. Delete Service (Client API Fetcher)
export const deleteService = async (id: string) => {
  try {
    const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Failed to delete service." };
  }
};

// 17. Redeem Loyalty Reward (Client API Fetcher)
export const redeemReward = async ({ rewardName, cost }: { rewardName: string; cost: number }) => {
  try {
    const response = await fetch("/api/admin/loyalty/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardName, cost }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Failed to redeem reward." };
  }
};

// 18. Submit Contact Form (Client API Fetcher)
export const submitContact = async (data: { name: string; email: string; subject: string; message: string }) => {
  try {
    const response = await fetch("/api/admin/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Failed to send message." };
  }
};

// 19. Forgot Password (Client API Fetcher)
export const forgotPassword = async (email: string) => {
  try {
    const response = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Request failed." };
  }
};

// 20. Reset Password (Client API Fetcher)
export const resetPassword = async (data: { email: string; token: string; password: string }) => {
  try {
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Reset failed." };
  }
};
