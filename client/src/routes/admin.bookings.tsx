import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Download, Filter, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { getBookings, updateBookingStatus } from "@/lib/db-server";
import { exportToCSV } from "@/lib/export";
import { StatusPill } from "./admin.index";

export const Route = createFileRoute("/admin/bookings")({
  beforeLoad: ({ context }) => {
    if (!context.user || (context.user.role !== "Admin" && context.user.role !== "Superadmin")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getBookings(),
  head: () => ({ meta: [{ title: "Bookings — Admin" }] }),
  component: AdminBookings,
});

function AdminBookings() {
  const bookings = Route.useLoaderData();
  const router = useRouter();

  // Search & Filtering State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [serviceFilter, setServiceFilter] = useState("All services");

  // Edit Modal State
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTechnician, setEditTechnician] = useState("");
  const [editEta, setEditEta] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter Logic
  const filteredBookings = bookings.filter((b: any) => {
    const matchesSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.customer.toLowerCase().includes(search.toLowerCase()) ||
      b.vehicle.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "All statuses" || b.status === statusFilter;
    const matchesService = serviceFilter === "All services" || b.service === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  const handleOpenEdit = (booking: any) => {
    setSelectedBooking(booking);
    setEditStatus(booking.status);
    setEditTechnician(booking.technician || "");
    setEditEta(booking.eta || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSaving(true);

    try {
      const result = await updateBookingStatus({
        data: {
          id: selectedBooking.id,
          status: editStatus,
          technician: editTechnician,
          eta: editEta,
        },
      });

      if (result.success) {
        toast.success(`Booking ${selectedBooking.id} updated successfully.`);
        setSelectedBooking(null);
        router.invalidate(); // Refresh loader data from Express backend
      } else {
        toast.error(result.error || "Failed to update booking status.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Derive unique services for the filter dropdown
  const uniqueServices = Array.from(new Set(bookings.map((b: any) => b.service))) as string[];

  const handleExport = () => {
    const exportData = filteredBookings.map((b: any) => ({
      ID: b.id,
      Customer: b.customer,
      Vehicle: b.vehicle,
      Service: b.service,
      Date: b.date,
      Time: b.time,
      Status: b.status,
      Price_NPR: b.price,
      Technician: b.technician || "Unassigned"
    }));
    exportToCSV(exportData, `bookings_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Bookings</h1>
          <p className="text-sm text-muted-foreground">All customer bookings and service orders.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary cursor-pointer"><Download className="h-4 w-4" /> Export CSV</button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              placeholder="Search by booking ID, customer or vehicle..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" 
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option>All statuses</option>
            <option>Upcoming</option>
            <option>Confirmed</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
          <select 
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option>All services</option>
            {uniqueServices.map((srv) => (
              <option key={srv} value={srv}>{srv}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>{["Booking ID", "Customer", "Service", "Vehicle", "Date & Time", "Amount", "Technician", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No bookings matched your search filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3 font-semibold">{b.id}</td>
                    <td className="px-4 py-3">{b.customer}</td>
                    <td className="px-4 py-3">{b.service}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.vehicle}</td>
                    <td className="px-4 py-3">{b.date} <span className="text-xs text-muted-foreground">({b.time})</span></td>
                    <td className="px-4 py-3 font-bold">Rs. {b.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">{b.technician || "-"}</td>
                    <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleOpenEdit(b)}
                        className="text-sm font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
          <div>Showing {filteredBookings.length} of {bookings.length} bookings</div>
        </div>
      </div>

      {/* Booking Management & Dispatch Modal Overlay */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl relative animate-slide-in">
            <button 
              onClick={() => setSelectedBooking(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-1">Manage Service Order</h2>
            <p className="text-sm text-muted-foreground mb-4">Edit status, assign technician and set estimated delivery schedules.</p>
            
            <div className="mb-6 rounded-xl bg-secondary/30 p-4 text-xs space-y-2 border border-border/50">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking Reference:</span>
                <span className="font-bold">{selectedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer Profile:</span>
                <span className="font-semibold">{selectedBooking.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle Log:</span>
                <span className="font-semibold text-muted-foreground">{selectedBooking.vehicle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Selected:</span>
                <span className="font-bold text-primary">{selectedBooking.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing Amount:</span>
                <span className="font-bold text-foreground">Rs. {selectedBooking.price.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase">Service Status</label>
                <select 
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase">Assigned Technician</label>
                <input 
                  type="text" 
                  value={editTechnician}
                  onChange={(e) => setEditTechnician(e.target.value)}
                  placeholder="e.g. Ramesh KC" 
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase">Estimated Delivery (ETA)</label>
                <input 
                  type="text" 
                  value={editEta}
                  onChange={(e) => setEditEta(e.target.value)}
                  placeholder="e.g. 03:30 PM - 04:00 PM" 
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none" 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 h-10 rounded-lg border border-border font-semibold text-sm hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 h-10 rounded-lg bg-primary font-semibold text-sm text-primary-foreground hover:bg-primary/90 cursor-pointer flex items-center justify-center disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
