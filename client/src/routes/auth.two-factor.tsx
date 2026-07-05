import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { verifyLogin2FA } from "@/lib/auth-server";

export const Route = createFileRoute("/auth/two-factor")({
  head: () => ({ meta: [{ title: "Two-Step Verification — AutoCare Nepal" }] }),
  component: TwoFactor,
});

function TwoFactor() {
  const navigate = useNavigate();
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    const tempToken = sessionStorage.getItem("temp2FAToken");
    if (!tempToken) {
      toast.error("Session expired. Please log in again.");
      navigate({ to: "/login" });
      return;
    }

    setLoading(true);
    const res = await verifyLogin2FA(tempToken, otp);
    if (res.success) {
      sessionStorage.removeItem("temp2FAToken");
      toast.success("Successfully logged in!");
      await router.invalidate();
      if (res.user?.role === "Admin" || res.user?.role === "Superadmin" || res.user?.role === "SuperAdmin") {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/" });
      }
    } else {
      toast.error(res.error || "Invalid verification code.");
      setCode(["", "", "", "", "", ""]); // Reset
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="Two-Step Verification" subtitle="An extra layer of security. Enter the 6-digit code from your authenticator app.">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary"><ShieldCheck className="h-7 w-7" /></div>
      <h3 className="mt-4 text-2xl font-bold">Enter verification code</h3>
      <p className="mt-1 text-sm text-muted-foreground">Open your authenticator app (e.g. Google Authenticator) and enter the 6-digit code.</p>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          {code.map((v, i) => (
            <input key={i} maxLength={1} value={v} onChange={(e) => { 
                const c = [...code]; 
                c[i] = e.target.value.replace(/\D/g, ""); 
                setCode(c);
                // Auto focus next input
                if (c[i] && e.target) {
                  const nextSibling = (e.target as HTMLElement).nextElementSibling as HTMLInputElement;
                  if (nextSibling) nextSibling.focus();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !code[i] && e.target) {
                  const prevSibling = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                  if (prevSibling) prevSibling.focus();
                }
              }}
              className="h-14 w-full rounded-xl border border-border bg-background text-center text-xl font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              disabled={loading}
            />
          ))}
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs">
          Never share this code. AutoCare Nepal will never ask for your OTP.
        </div>
        <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50">
          {loading ? "Verifying..." : "Verify & Continue"} <ArrowRight className="h-4 w-4" />
        </button>
        <div className="text-center text-sm"><Link to="/login" className="font-semibold text-muted-foreground hover:text-foreground">Cancel and go back</Link></div>
      </form>
    </AuthLayout>
  );
}
