import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { getBookings } from "@/lib/db-server";

export const Route = createFileRoute("/track")({
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
    (b) => b.status === "Upcoming" || b.status === "Confirmed" || b.status === "In Progress",
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
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                No active bookings.
              </div>
            ) : (
              activeBookings.map((b) => (
                <Link key={b.id} to="/track/$id" params={{ id: b.id }} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-primary/40">
                  <div>
                    <div className="font-semibold">{b.id}</div>
                    <div className="text-xs text-muted-foreground">{b.service} · {b.vehicle}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
