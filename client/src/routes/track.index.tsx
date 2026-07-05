import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { getBookings } from "@/lib/db-server";

export const Route = createFileRoute("/track/")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getBookings(),
  head: () => ({ meta: [{ title: "Track Service — AutoCare Nepal" }] }),
  component: TrackIndex,
});

function TrackIndex() {
  const allBookings = Route.useLoaderData();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState("");

  const activeBookings = allBookings.filter(
    (b:any) => b.status === "Upcoming" || b.status === "Confirmed" || b.status === "In Progress",
  );

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) {
      toast.error("Please enter a booking ID.");
      return;
    }
    navigate({ to: "/track/$id", params: { id: searchId.trim() } });
  };

  return (
    <AppShell>
      <PageHeader title="Track Service" subtitle="Enter your booking ID or pick from active services." />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <form onSubmit={handleTrack} className="rounded-2xl border border-border bg-card p-6">
          <label className="text-sm font-semibold">Booking ID</label>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="e.g. AC-2026-0515-000123"
                className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <button type="submit" className="rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground">Track</button>
          </div>
        </form>
        <div className="mt-8">
          <h2 className="text-lg font-bold">Your active bookings</h2>
          <div className="mt-4 space-y-3">
            {activeBookings.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary mb-4 animate-pulse">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No Active Services</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  You don't have any services currently in progress. Enter your booking ID above to track an old booking, or book a new service.
                </p>
                <div className="mt-6">
                  <Link to="/book" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer">
                    Book a Service Now
                  </Link>
                </div>
              </div>
            ) : (
              activeBookings.map((b: any) => (
                <Link key={b.id} to="/track/$id" params={{ id: b.id }} className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-md hover:border-primary/40 transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary group-hover:scale-105 transition-transform">
                      <Search className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{b.id}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{b.service} &middot; {b.vehicle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-primary-soft text-primary">{b.status}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
