import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowRight, Eye, Facebook, Lock, Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, GoogleButton } from "@/components/auth-layout";
import { registerUser } from "@/lib/auth-server";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Sign Up — AutoCare Nepal" }] }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!agree) {
      toast.error("Please agree to the Terms & Conditions.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({ data: { name, email, phone, password } });
      if (result.success) {
        toast.success("Account created successfully!");
        await router.invalidate(); // Reload root loader
        navigate({ to: "/" });
      } else {
        toast.error(result.error || "Registration failed.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Your Account" subtitle="Sign up to book services, track appointments and manage your vehicle care easily.">
      <h3 className="text-2xl font-bold">Sign Up</h3>
      <p className="mt-1 text-sm text-muted-foreground">Please fill in the details to create your account</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold">Full Name</span>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
              required
              disabled={loading}
            />
          </div>
        </label>
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
          <span className="text-sm font-semibold">Phone Number</span>
          <div className="mt-1.5 flex overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex items-center gap-2 border-r border-border px-3 text-sm font-semibold">🇳🇵 +977</div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="h-12 flex-1 bg-transparent px-3 text-sm outline-none"
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm outline-none focus:border-primary"
              required
              disabled={loading}
            />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Confirm Password</span>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm outline-none focus:border-primary"
              required
              disabled={loading}
            />
          </div>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary"
            disabled={loading}
          />
          <span>
            I agree to the <Link to="/register" className="font-semibold text-primary">Terms & Conditions</Link> and{" "}
            <Link to="/register" className="font-semibold text-primary">Privacy Policy</Link>
          </span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"} <ArrowRight className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or sign up with <span className="h-px flex-1 bg-border" />
        </div>
        <div className="flex gap-3">
          <GoogleButton />
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 text-sm font-semibold hover:bg-secondary"
          >
            <Facebook className="h-4 w-4 text-info" /> Continue with Facebook
          </button>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Login</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
