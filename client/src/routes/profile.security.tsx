import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { KeyRound, Shield, ShieldCheck, ChevronRight, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { generate2FA, enable2FA, disable2FA } from "@/lib/auth-server";

export const Route = createFileRoute("/profile/security")({
  component: ProfileSecurity,
});

function ProfileSecurity() {
  const { user } = Route.useRouteContext() as any;
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleManage2FA = async () => {
    if (user.twoFactorEnabled) {
      // Just open disable modal
      setIsModalOpen(true);
      return;
    }
    
    // Generate new 2FA
    setLoading(true);
    const res = await generate2FA();
    if (res.success && res.qrCode && res.secret) {
      setQrCodeUrl(res.qrCode);
      setSecret(res.secret);
      setIsModalOpen(true);
    } else {
      toast.error(res.error || "Failed to generate 2FA");
    }
    setLoading(false);
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await enable2FA(secret, token);
    if (res.success) {
      toast.success("Two-Factor Authentication enabled successfully!");
      setIsModalOpen(false);
      setToken("");
      router.invalidate();
    } else {
      toast.error(res.error || "Invalid token");
    }
    setLoading(false);
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await disable2FA(token);
    if (res.success) {
      toast.success("Two-Factor Authentication disabled.");
      setIsModalOpen(false);
      setToken("");
      router.invalidate();
    } else {
      toast.error(res.error || "Invalid token");
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-8 shadow-elevated backdrop-blur-xl transition-all">
      <div className="absolute -left-20 -bottom-20 -z-10 h-64 w-64 rounded-full bg-success/10 blur-3xl" />
      
      <div className="mb-8 border-b border-border/50 pb-6">
        <h3 className="text-2xl font-extrabold tracking-tight">Security Settings</h3>
        <p className="mt-1 text-sm text-muted-foreground">Manage password configurations, authenticators, and session keys.</p>
      </div>
      
      <div className="space-y-4">
        {/* Password (Mock UI) */}
        <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-soft">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative flex items-start sm:items-center gap-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Password</h4>
              <p className="mt-0.5 text-sm text-muted-foreground">Last changed 3 months ago</p>
            </div>
          </div>
          <div className="relative flex items-center gap-4 self-end sm:self-auto pl-17 sm:pl-0">
            <button className="group/btn flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold transition-all hover:bg-accent hover:border-primary/20">
              Change
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-soft">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative flex items-start sm:items-center gap-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Two-step verification</h4>
              <p className="mt-0.5 text-sm text-muted-foreground">Enabled via Authenticator app</p>
            </div>
          </div>
          <div className="relative flex items-center gap-4 self-end sm:self-auto pl-17 sm:pl-0">
            {user.twoFactorEnabled && (
              <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-success shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Active
              </span>
            )}
            <button 
              onClick={handleManage2FA}
              disabled={loading}
              className="group/btn flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold transition-all hover:bg-accent hover:border-primary/20 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Manage"}
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Login Alerts (Mock UI) */}
        <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-soft">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative flex items-start sm:items-center gap-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Login alerts</h4>
              <p className="mt-0.5 text-sm text-muted-foreground">Get notified for new sign-ins</p>
            </div>
          </div>
          <div className="relative flex items-center gap-4 self-end sm:self-auto pl-17 sm:pl-0">
            <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-success shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Active
            </span>
            <button className="group/btn flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold transition-all hover:bg-accent hover:border-primary/20">
              Enabled
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Manage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-elevated animate-in zoom-in-95">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <QrCode className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold">
                {user.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </h3>
            </div>

            {!user.twoFactorEnabled ? (
              <form onSubmit={handleEnable} className="space-y-3">
                <div className="rounded-xl border border-border bg-background p-3 text-center">
                  <img src={qrCodeUrl} alt="QR Code" className="mx-auto h-40 w-40 rounded-lg" />
                  <p className="mt-2.5 text-xs text-muted-foreground">
                    Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code below.
                  </p>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit code"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-center text-base font-bold tracking-widest outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => { setIsModalOpen(false); setToken(""); }} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Cancel</button>
                  <button type="submit" disabled={loading || token.length !== 6} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    Verify & Enable
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleDisable} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  To disable two-factor authentication, please enter the current 6-digit code from your authenticator app.
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit code"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-center text-base font-bold tracking-widest outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => { setIsModalOpen(false); setToken(""); }} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Cancel</button>
                  <button type="submit" disabled={loading || token.length !== 6} className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50">
                    Disable 2FA
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
