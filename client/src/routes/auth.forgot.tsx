import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({ meta: [{ title: "Forgot Password — AutoCare Nepal" }] }),
  component: Forgot,
});

function Forgot() {
  return (
    <AuthLayout title="Forgot your password?" subtitle="No worries, it happens. Enter your email and we'll send you a reset link.">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Login</Link>
      <h3 className="mt-4 text-2xl font-bold">Reset your password</h3>
      <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure link to reset your password.</p>
      <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
        <label className="block">
          <span className="text-sm font-semibold">Email Address</span>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Enter your email address" className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary" />
          </div>
        </label>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-soft">
          Send reset link <ArrowRight className="h-4 w-4" />
        </button>
        <div className="text-center text-sm text-muted-foreground">Remember your password? <Link to="/login" className="font-semibold text-primary">Login</Link></div>
      </form>
    </AuthLayout>
  );
}
