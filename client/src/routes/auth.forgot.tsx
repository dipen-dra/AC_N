import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { forgotPassword } from "@/lib/db-server";

import { redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/auth/forgot")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      if (context.user.role === "Superadmin" || context.user.role === "SuperAdmin") throw redirect({ to: "/superadmin" });
      if (context.user.role === "Admin") throw redirect({ to: "/admin" });
      throw redirect({ to: "/" });
    }
  },
  head: () => ({ meta: [{ title: "Forgot Password — AutoCare Nepal" }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email address."); return; }
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      if (res.success) {
        setSent(true);
        toast.success("Reset link sent! (Check server console for dev token)");
      } else {
        toast.error(res.error || "Failed to send reset link.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot your password?" subtitle="No worries, it happens. Enter your email and we'll send you a reset link.">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Login</Link>
      <h3 className="mt-4 text-2xl font-bold">Reset your password</h3>
      <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure link to reset your password.</p>

      {sent ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-success/20 bg-success/5 p-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success"><CheckCircle className="h-8 w-8" /></div>
          <div className="text-lg font-bold">Check your email!</div>
          <p className="text-sm text-muted-foreground">If an account with <strong>{email}</strong> exists, a reset link has been sent.</p>
          <p className="text-xs text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
            🛠️ Dev mode: The reset token is printed in the server console. Use it on the reset page.
          </p>
          <Link to="/auth/reset" className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Enter Reset Token <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold">Email Address</span>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {loading ? "Sending..." : <><ArrowRight className="h-4 w-4" /> Send reset link</>}
          </button>
          <div className="text-center text-sm text-muted-foreground">Remember your password? <Link to="/login" className="font-semibold text-primary">Login</Link></div>
        </form>
      )}
    </AuthLayout>
  );
}
