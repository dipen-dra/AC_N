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
