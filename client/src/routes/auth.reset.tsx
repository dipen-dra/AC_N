import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { resetPassword } from "@/lib/db-server";

export const Route = createFileRoute("/auth/reset")({
  head: () => ({ meta: [{ title: "Reset Password — AutoCare Nepal" }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", token: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.token || !form.password) {
      toast.error("Please fill all fields.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword({ email: form.email, token: form.token, password: form.password });
      if (res.success) {
        setDone(true);
        toast.success("Password reset successful!");
        setTimeout(() => navigate({ to: "/login" }), 2500);
      } else {
        toast.error(res.error || "Reset failed. The token may be expired.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email, the token from the reset email, and your new password.">
      <Link to="/auth/forgot" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <h3 className="mt-4 text-2xl font-bold">Set a new password</h3>

      {done ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-success/20 bg-success/5 p-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success"><CheckCircle className="h-8 w-8" /></div>
          <div className="text-lg font-bold">Password Reset!</div>
          <p className="text-sm text-muted-foreground">You'll be redirected to login shortly...</p>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold">Email Address</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" className="mt-1.5 h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Reset Token</span>
            <input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} placeholder="Paste the token from server console" className="mt-1.5 h-12 w-full rounded-lg border border-border bg-background px-3 font-mono text-xs outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">New Password</span>
            <div className="relative mt-1.5">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type={showPwd ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm outline-none focus:border-primary" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Confirm Password</span>
            <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat new password" className="mt-1.5 h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
          </label>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-60">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <div className="text-center text-sm text-muted-foreground">Remember it? <Link to="/login" className="font-semibold text-primary">Log in</Link></div>
        </form>
      )}
    </AuthLayout>
  );
}
