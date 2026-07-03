import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, CheckCircle2, MessageSquare, Receipt, ShieldCheck, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/payment-success")({
  head: () => ({ meta: [{ title: "Payment Successful — AutoCare Nepal" }] }),
  component: PaySuccess,
});

function PaySuccess() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-10 text-center">
            <div className="relative">
              <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-success/20" />
              <div className="grid h-24 w-24 place-items-center rounded-full bg-success text-success-foreground shadow-elevated">
                <CheckCircle2 className="h-14 w-14" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="mt-8 text-3xl font-extrabold text-success">Payment Successful!</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your booking has been confirmed.</p>
            <p className="mt-1 text-sm text-muted-foreground">We have sent the booking details to your <span className="font-semibold text-primary">Gmail</span>.</p>
            <div className="mt-8 w-full max-w-md rounded-2xl border border-success/20 bg-success/5 p-6 text-left">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-success/15 text-success"><Receipt className="h-5 w-5" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Booking ID</div>
                  <div className="font-bold">AC-2026-0515-000123</div>
                </div>
              </div>
              <div className="mt-3 border-t border-success/20 pt-3 text-center text-sm text-muted-foreground">
                Thank you for choosing <span className="font-semibold text-primary">AutoCare Nepal!</span>
              </div>
            </div>
            <Link to="/bookings" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
              <Calendar className="h-4 w-4" /> Go to My Bookings
            </Link>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-lg font-bold">Payment Details</div>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" /> Paid Via</dt>
                  <dd className="font-bold text-success">eSewa</dd>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="text-muted-foreground"># Transaction ID</dt><dd className="font-semibold">ESW1234567890123</dd>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="text-muted-foreground">Payment Date</dt><dd className="font-semibold">15 May, 2026 · 10:15 AM</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Amount Paid</dt><dd className="text-lg font-extrabold text-success">Rs. 4,540</dd>
                </div>
              </dl>
              <div className="mt-4 rounded-xl border border-success/20 bg-success/10 p-3 text-xs">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <div><span className="font-semibold">Your booking has been confirmed!</span><div className="text-muted-foreground">We have sent the booking details to your <span className="text-primary">Gmail</span>.</div></div>
                </div>
              </div>
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
