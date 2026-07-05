import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, CheckCircle2, MessageSquare, Receipt, ShieldCheck, Wallet, Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/payment-success")({
  head: () => ({ meta: [{ title: "Payment Status — AutoCare Nepal" }] }),
  component: PaySuccess,
});

function PaySuccess() {
  const search: any = Route.useSearch();
  const method = search.method;
  const bookingId = search.bookingId || "AC-UNKNOWN";
  
  const [verifying, setVerifying] = useState(method === "esewa" || method === "khalti");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (method === "esewa" || method === "khalti") {
      const verify = async () => {
        try {
          const res = await fetch(`/api/bookings/verify-payment?method=${method}&bookingId=${bookingId}&pidx=${search.pidx || ""}&data=${search.data || ""}&status=${search.status || ""}&token=${search.token || ""}&amount=${search.amount || ""}`);
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Payment verification failed.");
          }
          const json = await res.json();
          setBooking(json.booking);
          toast.success("Payment verified successfully!");
        } catch (err: any) {
          setVerifyError(err.message);
          toast.error(err.message);
        } finally {
          setVerifying(false);
        }
      };
      verify();
    } else {
      // For COD/Card, fetch the booking details to show actual amount
      const fetchBooking = async () => {
        try {
          const res = await fetch(`/api/bookings/${bookingId}`);
          if (res.ok) {
            const json = await res.json();
            setBooking(json);
          }
        } catch (err) {
          console.error("Failed to fetch booking:", err);
        }
      };
      if (bookingId !== "AC-UNKNOWN") {
        fetchBooking();
      }
    }
  }, [method, bookingId, search.pidx, search.data]);

  const finalAmount = booking ? booking.price : (search.amount || "0");
  const finalMethod = booking ? booking.paymentMethod : (method === "esewa" ? "eSewa" : method === "khalti" ? "Khalti" : (search.paymentMethod || "Cash on Delivery"));
  const isFailed = search.status === "failed";
  
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {verifying ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-20 text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <h1 className="mt-8 text-2xl font-bold">Verifying Payment...</h1>
              <p className="mt-2 text-sm text-muted-foreground">Please do not refresh or close this tab.</p>
            </div>
          ) : (verifyError || isFailed) ? (
            <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-10 text-center">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-elevated">
                <AlertTriangle className="h-14 w-14" strokeWidth={2.5} />
              </div>
              <h1 className="mt-8 text-3xl font-extrabold text-destructive">Payment Failed!</h1>
              <p className="mt-2 text-sm text-muted-foreground">{verifyError || "We couldn't process your payment. Please try again."}</p>
              <Link to="/book" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
                Try Booking Again
              </Link>
            </div>
          ) : (
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
                    <div className="font-bold">{bookingId}</div>
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
          )}

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-lg font-bold">Payment Details</div>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" /> Paid Via</dt>
                  <dd className="font-bold text-success">{finalMethod}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="text-muted-foreground"># Transaction ID</dt><dd className="font-semibold">TXN-{search.pidx || search.data ? (search.pidx || "ESEWA-" + bookingId.split("-")[2]) : Math.floor(100000 + Math.random() * 900000)}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="text-muted-foreground">Payment Date</dt><dd className="font-semibold">{new Date().toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Amount Paid</dt><dd className="text-lg font-extrabold text-success">Rs. {Number(finalAmount).toLocaleString()}</dd>
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
