import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowRight, Eye, Facebook, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, GoogleButton } from "@/components/auth-layout";
import { loginUser } from "@/lib/auth-server";

import { redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      if (context.user.role === "Superadmin" || context.user.role === "SuperAdmin") throw redirect({ to: "/superadmin" });
      if (context.user.role === "Admin") throw redirect({ to: "/admin" });
      throw redirect({ to: "/" });
    }
  },
  head: () => ({ meta: [{ title: "Login — AutoCare Nepal" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ data: { email, password } });
      if (result.success) {
        if (result.requiresTwoFactor) {
          toast.success("Please complete two-factor authentication.");
          sessionStorage.setItem("temp2FAToken", result.tempToken);
          navigate({ to: "/auth/two-factor" });
        } else {
          toast.success("Successfully logged in!");
          await router.invalidate(); // Invalidate the router cache to reload root loader (getCurrentUser)
          if (result.user?.role === "Superadmin" || result.user?.role === "SuperAdmin") {
            navigate({ to: "/superadmin" });
          } else if (result.user?.role === "Admin") {
            navigate({ to: "/admin" });
          } else {
            navigate({ to: "/bookings" });
          }
        }
      } else {
        toast.error(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back!" subtitle="Login to access your bookings, track services and manage your account.">
      <h3 className="text-2xl font-bold">Welcome back</h3>
      <p className="mt-1 text-sm text-muted-foreground">Please enter your details to continue</p>

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
              required
              disabled={loading}
            />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Password</span>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm outline-none focus:border-primary"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </label>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-border text-primary" /> Remember me
          </label>
          <Link to="/auth/forgot" className="font-semibold text-primary hover:underline">Forgot Password?</Link>
        </div>
        <div className="rounded-xl border border-info/20 bg-info/10 p-3 text-xs">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-info" />
            <div><b>Protected by CAPTCHA.</b> Multiple failed attempts will lock the account for 15 minutes.</div>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"} <ArrowRight className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
        </div>
        <div className="w-full flex justify-center">
          <GoogleButton />
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Don't have an account? <Link to="/register" className="font-semibold text-primary hover:underline">Sign Up</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
