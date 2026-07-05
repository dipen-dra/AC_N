import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Check, ClipboardCheck, Copy, MapPin, MessageSquare, Phone, Wrench, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { getBookingById } from "@/lib/db-server";

export const Route = createFileRoute("/track/$id")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      if (context.user.role === "Superadmin" || context.user.role === "SuperAdmin") {
        throw redirect({ to: "/superadmin" });
      }
      if (context.user.role === "Admin") {
        throw redirect({ to: "/admin" });
      }
    }
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  loader: ({ params }) => getBookingById({ data: params.id }),
  head: ({ params }) => ({ meta: [{ title: `Tracking ${params.id} — AutoCare Nepal` }] }),
  component: Track,
});

function Track() {
  const booking = Route.useLoaderData();
  const { id } = Route.useParams();

  if (!booking) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
          <Link to="/track" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Tracking
          </Link>
          <h1 className="mt-8 text-2xl font-bold text-destructive">Booking Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">The booking ID "{id}" was not found or you do not have permission to view it.</p>
        </div>
      </AppShell>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.id);
    toast.success("Booking ID copied to clipboard!");
  };

  // Derive stage states based on booking.status
  const status = booking.status; // 'Upcoming' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'
  
  const getStageState = (stageIndex: number) => {
    if (status === "Completed") return "done";
    if (status === "Cancelled") return "todo";
    
    if (status === "In Progress") {
      if (stageIndex < 2) return "done";
      if (stageIndex === 2) return "current";
      return "todo";
    }
    
    // Upcoming / Confirmed
    if (stageIndex === 0) return "current";
    return "todo";
  };

  const stages = [
    { key: "booked", label: "Booked", sub: booking.date, state: getStageState(0) },
    { key: "inspect", label: "Inspection", sub: status === "Upcoming" ? "Pending" : "Completed", state: getStageState(1) },
    { key: "progress", label: "In Progress", sub: status === "In Progress" ? "Active" : "Upcoming", state: getStageState(2) },
    { key: "quality", label: "Quality Check", sub: "Upcoming", state: getStageState(3) },
    { key: "done", label: "Completed", sub: status === "Completed" ? "Ready" : "Upcoming", state: getStageState(4) },
  ] as const;

  const steps = [
    { title: "Booking Confirmed", desc: "Your service request has been confirmed.", time: `${booking.date} · ${booking.time}`, state: getStageState(0) === "done" || getStageState(0) === "current" ? "done" : "todo" },
    { title: "Vehicle Inspection", desc: "Our technician will inspect your vehicle.", time: status === "Upcoming" ? "Upcoming" : "Completed", state: getStageState(1) === "done" || getStageState(1) === "current" ? "done" : "todo" },
    { title: "Service In Progress", desc: "Our technician will perform the requested service.", time: status === "In Progress" ? "In Progress" : "Upcoming", state: getStageState(2) === "done" ? "done" : getStageState(2) === "current" ? "current" : "todo" },
    { title: "Quality Check", desc: "Your vehicle will be thoroughly checked.", time: "Upcoming", state: getStageState(3) === "done" ? "done" : getStageState(3) === "current" ? "current" : "todo" },
    { title: "Service Completed", desc: "Your service will be completed and vehicle ready for pick-up.", time: "Upcoming", state: getStageState(4) === "done" ? "done" : getStageState(4) === "current" ? "current" : "todo" },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Home</Link>
        <h1 className="mt-3 text-3xl font-extrabold">Track Service</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time updates on your service progress</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Booking ID</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-bold">{booking.id}</span>
                    <button onClick={handleCopyId} className="text-muted-foreground hover:text-primary"><Copy className="h-3.5 w-3.5" /></button>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      status === "Completed" ? "bg-success/15 text-success" :
                      status === "Cancelled" ? "bg-destructive/15 text-destructive" :
                      status === "In Progress" ? "bg-primary/15 text-primary animate-pulse" : "bg-info/15 text-info"
                    }`}>{status}</span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-xs text-muted-foreground">Date Scheduled</div>
                  <div className="font-semibold">{booking.date} · {booking.time}</div>
                </div>
              </div>

              <div className="mt-8">
                <div className="text-sm font-semibold">Service Progress</div>
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {stages.map((s, i) => (
                    <div key={s.key} className="relative flex flex-col items-center text-center">
                      {i < stages.length - 1 && (
                        <div className={`absolute left-1/2 top-6 h-0.5 w-full ${s.state === "done" ? "bg-success" : "bg-border"}`} />
                      )}
                      <div className={`relative z-10 grid h-12 w-12 place-items-center rounded-full text-primary-foreground
                        ${s.state === "done" ? "bg-success" : s.state === "current" ? "bg-primary animate-pulse" : "bg-secondary text-muted-foreground"}`}>
                        {s.state === "done" ? <Check className="h-5 w-5" /> : s.state === "current" ? <Wrench className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}
                      </div>
                      <div className={`mt-2 text-xs font-semibold ${s.state === "current" ? "text-primary" : ""}`}>{s.label}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft/60 p-4 text-sm">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Wrench className="h-4 w-4" /></div>
                <div>
                  <div className="font-semibold">Current Status</div>
                  <div className="mt-0.5 text-muted-foreground">
                    {status === "Completed" ? "Your vehicle servicing is fully completed and ready for pickup." :
                     status === "Cancelled" ? "This booking has been cancelled." :
                     status === "In Progress" ? "Our technician is currently working on your vehicle." :
                     "Your service request is confirmed and awaiting technician dispatch."}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-lg font-bold">Service Steps</div>
              <p className="text-sm text-muted-foreground">Detailed progress of your service</p>
              <ol className="mt-6 space-y-5">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="relative">
                      <div className={`grid h-9 w-9 place-items-center rounded-full text-primary-foreground
                        ${s.state === "done" ? "bg-success" : s.state === "current" ? "bg-primary" : "bg-secondary text-muted-foreground"}`}>
                        {s.state === "done" ? <Check className="h-4 w-4" /> : i + 1}
                      </div>
                      {i < steps.length - 1 && <div className="absolute left-1/2 top-9 h-9 w-px -translate-x-1/2 bg-border" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${s.state === "current" ? "text-primary" : ""}`}>{i + 1}. {s.title}</div>
                      <div className="text-sm text-muted-foreground">{s.desc}</div>
                    </div>
                    <div className={`text-right text-xs font-semibold ${s.state === "current" ? "text-primary" : "text-muted-foreground"}`}>{s.time}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Calendar className="h-5 w-5" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Estimated Delivery Date</div>
                  <div className="text-lg font-bold">{booking.date}</div>
                  <div className="text-sm font-semibold text-primary">{booking.eta || booking.time}</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-info/20 bg-info/10 p-3 text-xs text-info-foreground">
                <span className="font-semibold text-info">ⓘ</span> We'll notify you when your vehicle is ready for pick-up.
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-lg font-bold">Service Details</div>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ["Vehicle Info", booking.vehicle],
                  ["Service Type", booking.service],
                  ["Pick-up Location", booking.location],
                  ["Pick-up Date & Time", `${booking.date} · ${booking.time}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              {booking.technician && booking.technician !== "-" && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-xs font-bold text-background">
                      {booking.technician.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{booking.technician}</div>
                      <div className="text-[11px] text-muted-foreground">Senior Technician</div>
                    </div>
                  </div>
                  <button className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Phone className="h-4 w-4" /></button>
                </div>
              )}
              <Link to="/bookings" className="mt-4 flex items-center justify-center rounded-lg border border-border py-2.5 text-sm font-semibold hover:bg-secondary">View Booking Details →</Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-lg font-bold">Need Help?</div>
              <p className="text-sm text-muted-foreground">Our support team is here to help you.</p>
              <Link to="/chat" className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary-soft py-2.5 text-sm font-semibold text-primary hover:bg-primary/10">
                <MessageSquare className="h-4 w-4" /> Chat with Support
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
