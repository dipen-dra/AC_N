import { createFileRoute, Link, redirect, useNavigate, useRouter, Outlet, useLocation } from "@tanstack/react-router";
import { Car, LogOut, Shield, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { logoutUser } from "@/lib/auth-server";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Award, Gift, Sparkles, Star, Copy } from "lucide-react";
import { redeemReward, getBookings } from "@/lib/db-server";
import { useEffect } from "react";

const tiers = [
  { name: "Bronze", min: 0, perks: ["5% off wash", "Birthday coupon"] },
  { name: "Silver", min: 500, perks: ["8% off any service", "Priority slot"] },
  { name: "Gold", min: 1000, perks: ["12% off any service", "Free pickup", "Free monthly wash"] },
  { name: "Platinum", min: 2500, perks: ["18% off", "Dedicated concierge", "Annual full service"] },
];

const rewards = [
  { name: "Free Car Wash", cost: 300, icon: Sparkles },
  { name: "Rs. 500 Service Credit", cost: 500, icon: Gift },
  { name: "Free Oil Change", cost: 900, icon: Star },
  { name: "20% Off Full Service", cost: 1200, icon: Award },
];

function LoyaltySection({ user }: { user: any }) {
  const router = useRouter();
  const [points, setPoints] = useState(user.points || 0);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const progress = Math.min((points / 2500) * 100, 100);

  const handleRedeem = async (r: typeof rewards[0]) => {
    if (points < r.cost) { toast.error("Insufficient points."); return; }
    setRedeeming(r.name);
    try {
      const res = await redeemReward({ rewardName: r.name, cost: r.cost });
      if (res.success) {
        setPoints(res.points);
        toast.success(`🎉 "${r.name}" redeemed! -${r.cost} pts`);
        router.invalidate();
      } else {
        toast.error(res.error || "Redemption failed.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Loyalty & Rewards</h2>
        <p className="text-sm text-muted-foreground mt-1">Earn points with every service and unlock exclusive perks.</p>
      </div>
      
      <div className="overflow-hidden rounded-3xl bg-gradient-brand p-8 text-primary-foreground shadow-elevated">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Current Tier</div>
            <div className="mt-1 flex items-center gap-3">
              <Award className="h-10 w-10" />
              <div className="text-4xl font-extrabold">{user.tier || 'Bronze'}</div>
            </div>
            <div className="mt-2 text-sm opacity-90">
              {points === 0
                ? "Book your first service to start earning points! 🚗"
                : points < 500
                ? "Great start! Earn more points to unlock Silver perks. 🌟"
                : points < 1000
                ? "You're doing great! Almost at Gold status. 🚀"
                : points < 2500
                ? "Keep it up! You're on fire 🔥"
                : "Incredible! You've reached peak status. 👑"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-80">Available balance</div>
            <div className="text-5xl font-extrabold">{points.toLocaleString()}</div>
            <div className="text-xs opacity-80">points</div>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-xs">
            <span>{user.tier || 'Bronze'} · {points} pts</span>
            <span>Platinum · 2,500 pts</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
          </div>
          {points < 2500 ? (
            <div className="mt-2 text-xs opacity-90">Earn {(2500 - points).toLocaleString()} more points to unlock Platinum benefits.</div>
          ) : (
            <div className="mt-2 text-xs opacity-90">Congratulations! You've unlocked maximum tier benefits.</div>
          )}
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold text-center">Redeem rewards</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rewards.map((r) => (
            <div key={r.name} className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-soft">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><r.icon className="h-6 w-6" /></div>
              <div className="mt-4 font-semibold">{r.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">Redeem now</div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div className="text-sm font-bold text-primary">{r.cost} pts</div>
                <button
                  disabled={points < r.cost || redeeming === r.name}
                  onClick={() => handleRedeem(r)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {redeeming === r.name ? "Redeeming..." : "Redeem"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-center">Tier benefits</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-2xl border p-5 transition-colors ${t.name === user.tier ? "border-primary bg-primary-soft/60 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}>
              <div className="flex items-center gap-2">
                <Award className={`h-5 w-5 ${t.name === user.tier ? "text-primary" : "text-muted-foreground"}`} />
                <div className="font-bold">{t.name}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">From {t.min.toLocaleString()} pts</div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{t.perks.map((p) => <li key={p}>• {p}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {user.redeemedRewards && user.redeemedRewards.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-center">My Redeemed Rewards</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.redeemedRewards.map((r: any, idx: number) => (
              <div key={idx} className={`rounded-2xl border p-5 transition-shadow hover:shadow-soft ${r.isUsed ? 'border-border/50 bg-secondary/30 opacity-60' : 'border-primary/20 bg-primary/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{r.name}</div>
                  {r.isUsed ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded-md">Used</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-success bg-success/15 px-2 py-1 rounded-md">Active</span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="font-mono text-sm font-bold tracking-wider">{r.code}</div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(r.code);
                      toast.success("Promo code copied!");
                    }}
                    disabled={r.isUsed}
                    className="p-2 hover:bg-primary/10 rounded-lg text-primary disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export const Route = createFileRoute("/profile")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      if (context.user.role === "Superadmin" || context.user.role === "SuperAdmin") {
        throw redirect({ to: "/superadmin" });
      }
      if (context.user.role === "Admin") {
        throw redirect({ to: "/admin" });
      }
    }
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "My Profile — AutoCare Nepal" }] }),
  component: Profile,
});

function Profile() {
  const { user } = Route.useRouteContext() as any;
  const navigate = useNavigate();
  const router = useRouter();
  const location = useLocation();
  const currentPath = location.pathname;

  if (!user) return null;

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleSignOut = async () => {
    setIsLogoutConfirmOpen(false);
    try {
      const res = await logoutUser();
      if (res.success) {
        toast.success("Logged out successfully.");
        await router.invalidate();
        navigate({ to: "/login" });
      } else {
        toast.error(res.error || "Logout failed.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred during logout.");
    }
  };

  const navItems = [
    { to: "/profile", exact: true, i: User, l: "Personal Info" },
    { to: "/profile/vehicles", exact: false, i: Car, l: "My Vehicles" },
    { to: "/profile/security", exact: false, i: Shield, l: "Security" },
  ];

  return (
    <AppShell>
      <PageHeader title="My Profile" subtitle="Manage your account, vehicles and security preferences." />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-3xl border border-border bg-card/40 p-5 space-y-2 shadow-sm backdrop-blur-xl">
          <div className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Profile Settings
          </div>
          {navItems.map((n) => {
            const isActive = n.exact ? currentPath === n.to : currentPath.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-gradient-brand text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:scale-[1.02]"
                }`}
              >
                <n.i className={`h-4 w-4 transition-transform ${isActive ? "" : "group-hover:scale-110"}`} /> {n.l}
              </Link>
            );
          })}
          <div className="pt-4 mt-4 border-t border-border/50">
            <button
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-destructive transition-all hover:bg-destructive/10 hover:scale-[1.02]"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" /> Sign Out
            </button>
          </div>
        </aside>
        
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>

      {currentPath === '/profile' && <LoyaltySection user={user} />}

      <ConfirmationModal
        isOpen={isLogoutConfirmOpen}
        title="Sign Out"
        description="Are you sure you want to log out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={handleSignOut}
        onCancel={() => setIsLogoutConfirmOpen(false)}
        icon={LogOut}
        variant="primary"
      />
    </AppShell>
  );
}
