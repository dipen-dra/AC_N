import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, Lock } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";

export const Route = createFileRoute("/auth/reset")({
  head: () => ({ meta: [{ title: "Reset Password — AutoCare Nepal" }] }),
  component: Reset,
});

function Reset() {
  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password to keep your account secure.">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back to Login</Link>
      <h3 className="mt-4 text-2xl font-bold">Reset password</h3>
      <p className="mt-1 text-sm text-muted-foreground">Must be at least 10 characters with 1 number and 1 symbol.</p>
      <form className="mt-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
        {["New password", "Confirm password"].map((l) => (
          <label key={l} className="block">
            <span className="text-sm font-semibold">{l}</span>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="password" placeholder={l} className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm outline-none focus:border-primary" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Eye className="h-4 w-4" /></button>
            </div>
          </label>
        ))}
        <div className="grid grid-cols-4 gap-2 text-[10px] font-semibold text-muted-foreground">
          {["Weak", "Fair", "Good", "Strong"].map((s, i) => (
            <div key={s}><div className={`h-1.5 rounded-full ${i <= 2 ? "bg-primary" : "bg-border"}`} /><div className="mt-1 text-center">{s}</div></div>
          ))}
        </div>
        <button className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground">Reset password</button>
      </form>
    </AuthLayout>
  );
}
