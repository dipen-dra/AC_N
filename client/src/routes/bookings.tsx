import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { Calendar, MapPin, MoreVertical, Plus, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { getBookings, updateBookingStatus } from "@/lib/db-server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bookings")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getBookings(),
  head: () => ({ meta: [{ title: "My Bookings — AutoCare Nepal" }] }),
  component: Bookings,
});

const statusTone: Record<string, string> = {
  "In Progress": "bg-primary-soft text-primary",
  Upcoming: "bg-info/15 text-info",
  Confirmed: "bg-success/15 text-success",
  Completed: "bg-success/15 text-success",
  Cancelled: "bg-destructive/15 text-destructive",
};

function Bookings() {
  const allBookings = Route.useLoaderData();
  const router = useRouter();
  const [tab, setTab] = useState<"current" | "history">("current");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const currentBookings = allBookings.filter(
    (b: any) => b.status === "Upcoming" || b.status === "Confirmed" || b.status === "In Progress",
  );

  const filteredCurrentBookings = currentBookings.filter(
    (b: any) => statusFilter === "All Status" || b.status === statusFilter
  );

  const bookingHistory = allBookings.filter(
    (b: any) => b.status === "Completed" || b.status === "Cancelled",
  );

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await updateBookingStatus({ data: { id, status: "Cancelled" } });
      if (res.success) {
        toast.success(`Booking ${id} has been cancelled.`);
        router.invalidate();
      } else {
        toast.error(res.error || "Failed to cancel booking.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred during cancellation.");
    }
  };

  return (
    <AppShell>
      <PageHeader title="My Bookings" subtitle="View and manage all your bookings in one place." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-6 border-b border-border">
          {(["current", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn(
              "relative px-1 pb-3 text-sm font-semibold capitalize cursor-pointer",
              tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              {t === "current" ? "Current Bookings" : "Booking History"}
              {tab === t && <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        {tab === "current" && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Current Bookings</h2>
                <p className="text-sm text-muted-foreground">Your ongoing and upcoming services</p>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-xl border border-border bg-card px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option>All Status</option>
                <option>Upcoming</option>
                <option>Confirmed</option>
                <option>In Progress</option>
              </select>
            </div>
            <div className="mt-4 space-y-4">
              {filteredCurrentBookings.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary mb-4 animate-pulse">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">No Current Bookings</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    You don't have any bookings matching this status. Schedule a professional foam wash, wheel alignment, or engine servicing.
                  </p>
                  <div className="mt-6">
                    <Link to="/book" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer">
                      <Plus className="h-4 w-4" /> Book a Service Now
                    </Link>
                  </div>
                </div>
              ) : (
                filteredCurrentBookings.map((b: any) => (
                  <article key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-md transition-shadow duration-200">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><Wrench className="h-7 w-7" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground font-medium">Booking ID</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="font-bold text-foreground">{b.id}</span>
                          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", statusTone[b.status])}>{b.status}</span>
                        </div>
                        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
                          <InfoLine label="Service" value={<span className="font-semibold text-primary">{b.service}</span>} />
                          <InfoLine label="Vehicle Log" value={<span className="font-medium text-foreground">{b.vehicle}</span>} />
                          <InfoLine label="Schedule" value={<div>{b.date} <div className="text-xs text-muted-foreground mt-0.5">{b.time}</div></div>} />
                          <InfoLine label="Billing & Pickup" value={<div><span className="font-bold text-foreground">Rs. {b.price.toLocaleString()}</span><div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-0.5 truncate"><MapPin className="h-3 w-3 text-primary shrink-0" /> {b.location}</div></div>} />
                        </div>
                      </div>
                      <div className="flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:min-w-[220px]">
                        <div className="rounded-xl border border-border bg-secondary/40 p-3 text-xs">
                          <div className="font-semibold text-muted-foreground">Estimated Delivery</div>
                          <div className="mt-1 flex items-center gap-1.5 font-medium text-foreground"><Calendar className="h-3.5 w-3.5 text-primary" /> {b.date}</div>
                          <div className="mt-1 font-bold text-primary">{b.eta || "Awaiting Confirmation"}</div>
                        </div>
                        <Link to="/track/$id" params={{ id: b.id }} className="rounded-lg border border-primary bg-background py-2 text-center text-sm font-semibold text-primary hover:bg-primary-soft cursor-pointer">Track Service →</Link>
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="rounded-lg border border-border bg-background py-2 text-center text-sm font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Booking History</h2>
                <p className="text-sm text-muted-foreground">Your completed and cancelled bookings</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {bookingHistory.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-secondary text-muted-foreground mb-4">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <h3 className="text-md font-bold text-foreground">No Servicing History</h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    Your completed, cancelled, or past servicing records will be archived here.
                  </p>
                </div>
              ) : (
                bookingHistory.map((b: any) => (
                  <div key={b.id} className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[auto_2fr_1fr_1fr_1fr_auto]">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-muted-foreground"><Wrench className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Booking ID</div>
                      <div className="truncate font-semibold">{b.id}</div>
                      <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", statusTone[b.status])}>{b.status}</span>
                    </div>
                    <div className="text-sm"><div className="text-xs text-muted-foreground">Service</div>{b.service}</div>
                    <div className="text-sm"><div className="text-xs text-muted-foreground">Vehicle</div>{b.vehicle}</div>
                    <div className="text-sm"><div className="text-xs text-muted-foreground">{b.status === "Cancelled" ? "Cancelled On" : "Completed On"}</div>{b.completed || b.date}</div>
                    <Link to="/invoice/$id" params={{ id: b.id }} className="self-center rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">View Details →</Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft/60 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></div>
            <div>
              <div className="font-bold">Need to book again?</div>
              <div className="text-sm text-muted-foreground">Book your next service in just a few clicks.</div>
            </div>
          </div>
          <Link to="/book" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Book New Service
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className="mt-0.5">{value}</div></div>;
}
