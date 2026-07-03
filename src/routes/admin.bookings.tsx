import { createFileRoute, redirect } from "@tanstack/react-router";
import { Download, Filter, Plus, Search } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { getBookings } from "@/lib/db-server";
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
  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Bookings</h1>
          <p className="text-sm text-muted-foreground">All customer bookings and service orders.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold"><Download className="h-4 w-4" /> Export CSV</button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> New booking</button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search by booking ID, customer or vehicle..." className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
          </div>
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option>All statuses</option><option>Upcoming</option><option>In Progress</option><option>Completed</option><option>Cancelled</option></select>
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option>All services</option><option>Full Service</option><option>Oil Change</option></select>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Filter className="h-4 w-4" /> More filters</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>{["Booking ID", "Customer", "Service", "Vehicle", "Date", "Amount", "Technician", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No bookings found in database.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3 font-semibold">{b.id}</td>
                    <td className="px-4 py-3">{b.customer}</td>
                    <td className="px-4 py-3">{b.service}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.vehicle}</td>
                    <td className="px-4 py-3">{b.date}</td>
                    <td className="px-4 py-3 font-bold">Rs. {b.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.technician}</td>
                    <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                    <td className="px-4 py-3"><button className="text-sm font-semibold text-primary hover:underline">View</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
          <div>Showing {bookings.length} bookings</div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-border px-3 py-1.5">Previous</button>
            <button className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground">1</button>
            <button className="rounded-lg border border-border px-3 py-1.5">Next</button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
