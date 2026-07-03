import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/auth-layout";

export const Route = createFileRoute("/auth/two-factor")({
  head: () => ({ meta: [{ title: "Two-Step Verification — AutoCare Nepal" }] }),
  component: TwoFactor,
});

function TwoFactor() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  return (
    <AuthLayout title="Two-Step Verification" subtitle="An extra layer of security. Enter the 6-digit code from your authenticator app.">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary"><ShieldCheck className="h-7 w-7" /></div>
      <h3 className="mt-4 text-2xl font-bold">Enter verification code</h3>
      <p className="mt-1 text-sm text-muted-foreground">We sent a 6-digit code to your device ending in ••67. It expires in 5 minutes.</p>
      <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="flex gap-2">
          {code.map((v, i) => (
            <input key={i} maxLength={1} value={v} onChange={(e) => { const c = [...code]; c[i] = e.target.value.replace(/\D/g, ""); setCode(c); }}
              className="h-14 w-full rounded-xl border border-border bg-background text-center text-xl font-bold outline-none focus:border-primary" />
          ))}
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs">
          Never share this code. AutoCare Nepal will never ask for your OTP.
        </div>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground">
          Verify & Continue <ArrowRight className="h-4 w-4" />
        </button>
        <div className="text-center text-sm text-muted-foreground">Didn't receive it? <button className="font-semibold text-primary hover:underline">Resend code</button></div>
        <div className="text-center text-sm"><Link to="/login" className="font-semibold text-muted-foreground hover:text-foreground">Use a different method</Link></div>
      </form>
    </AuthLayout>
  );
}
