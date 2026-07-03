import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Award, Gift, Sparkles, Star, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { redeemReward } from "@/lib/db-server";

export const Route = createFileRoute("/loyalty")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Loyalty Program — AutoCare Nepal" }] }),
  component: Loyalty,
});

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

function Loyalty() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  if (!user) return null;

  const [points, setPoints] = useState(user.points);
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
    <AppShell>
      <PageHeader title="Loyalty Program" subtitle="Earn points every service, redeem for free perks." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-brand p-8 text-primary-foreground shadow-elevated">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Current Tier</div>
              <div className="mt-1 flex items-center gap-3">
                <Award className="h-10 w-10" />
                <div className="text-4xl font-extrabold">{user.tier}</div>
              </div>
              <div className="mt-2 text-sm opacity-90">Keep it up! You're on fire 🔥</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-80">Available balance</div>
              <div className="text-5xl font-extrabold">{points.toLocaleString()}</div>
              <div className="text-xs opacity-80">points</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs">
              <span>{user.tier} · {user.points} pts</span>
              <span>Platinum · 2,500 pts</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
            {user.points < 2500 ? (
              <div className="mt-2 text-xs opacity-90">Earn {(2500 - user.points).toLocaleString()} more points to unlock Platinum benefits.</div>
            ) : (
              <div className="mt-2 text-xs opacity-90">Congratulations! You've unlocked maximum tier benefits.</div>
            )}
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Redeem rewards</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rewards.map((r) => (
              <div key={r.name} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><r.icon className="h-6 w-6" /></div>
                <div className="mt-4 font-semibold">{r.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">Redeem now</div>
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

        <section className="mt-8">
          <h2 className="text-xl font-bold">Tier benefits</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((t) => (
              <div key={t.name} className={`rounded-2xl border p-5 ${t.name === user.tier ? "border-primary bg-primary-soft/60" : "border-border bg-card"}`}>
                <div className="flex items-center gap-2">
                  <Award className={`h-5 w-5 ${t.name === user.tier ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="font-bold">{t.name}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">From {t.min.toLocaleString()} pts</div>
                <ul className="mt-3 space-y-1 text-sm">{t.perks.map((p) => <li key={p}>• {p}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-lg font-bold"><TrendingUp className="h-5 w-5 text-primary" /> Recent activity</div>
          <div className="mt-4 divide-y divide-border">
            {[
              { d: "01 May 2026", a: "Earned +200 pts", b: "Full Service · AC-2026-0501-000098", pos: true },
              { d: "22 Apr 2026", a: "Redeemed -300 pts", b: "Free Car Wash", pos: false },
              { d: "10 Apr 2026", a: "Earned +80 pts", b: "Oil Change", pos: true },
            ].map((r) => (
              <div key={r.b + r.d} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-semibold">{r.b}</div>
                  <div className="text-xs text-muted-foreground">{r.d}</div>
                </div>
                <div className={`font-bold ${r.pos ? "text-success" : "text-primary"}`}>{r.a}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
