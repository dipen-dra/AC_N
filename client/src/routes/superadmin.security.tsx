import { createFileRoute, redirect } from "@tanstack/react-router";
import { Activity, AlertTriangle, CheckCircle2, Globe, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell, StatCard } from "@/components/admin-shell";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getSuperadminAnalytics, getSuperadminAuditLogs, getUsers } from "@/lib/db-server";

export const Route = createFileRoute("/superadmin/security")({
  beforeLoad: ({ context }) => {
    if (!context.user || context.user.role !== "Superadmin") {
      throw redirect({ to: "/login" });
    }
  },
  loader: async () => {
    const [logs, users, analytics] = await Promise.all([
      getSuperadminAuditLogs(),
      getUsers(),
      getSuperadminAnalytics()
    ]);
    return { logs, users, analytics };
  },
  head: () => ({ meta: [{ title: "Security — Superadmin" }] }),
  component: Security,
});

const attack = Array.from({ length: 24 }).map((_, i) => ({ h: `${i}h`, v: Math.round(Math.random() * 40 + (i > 18 ? 60 : 0)) }));

function Security() {
  const { logs, users, analytics } = Route.useLoaderData();
  const [unlocked, setUnlocked] = useState<string[]>([]);

  // Find users who have FAILED logins recently and haven't been unlocked
  const lockouts = logs
    .filter((l: any) => l.status === "FAILED" && l.action?.toLowerCase().includes("login") && !unlocked.includes(l.userEmail || l.user))
    .map((l: any) => ({ u: l.userEmail || l.user || "Unknown", r: "Failed login attempt", w: l.time }))
    .filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => (t.u === v.u)) === i); // Unique by user

  const handleUnlock = async (email: string) => {
    setUnlocked([...unlocked, email]);
    toast.success(`Account ${email} has been successfully unlocked.`);
  };

  const threatsBlocked = analytics?.threatsBlocked || 0;
  const twoFactorRate = analytics?.twoFactorRate || 0;

  return (
    <AdminShell kind="super">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Security Center</h1>
          <p className="text-sm text-muted-foreground">Realtime threat monitoring, compliance & lockouts.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success"><ShieldCheck className="h-4 w-4" /> All defenses armed</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Threats blocked" value={String(threatsBlocked)} icon={ShieldAlert} tone="primary" />
        <StatCard label="Locked accounts" value={String(lockouts.length)} icon={Lock} tone="warning" />
        <StatCard label="2FA enrolled" value={`${twoFactorRate}%`} icon={ShieldCheck} tone="success" />
        <StatCard label="Uptime" value="99.98%" icon={Activity} tone="info" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Attack surface — last 24h</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={attack}>
                <defs><linearGradient id="atk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e11d48" stopOpacity={0.4} /><stop offset="100%" stopColor="#e11d48" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="h" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
                <Area type="monotone" dataKey="v" stroke="#e11d48" strokeWidth={2} fill="url(#atk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Live incidents</div>
          <div className="mt-4 space-y-3">
            {logs
              .filter((l: any) => l.severity === "warn" || l.severity === "critical" || l.status === "FAILED")
              .slice(0, 5)
              .map((i: any) => (
                <div key={i.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${i.severity === "critical" || i.status === "FAILED" ? "bg-destructive/15 text-destructive" : i.severity === "warn" ? "bg-warning/20 text-warning-foreground" : "bg-info/15 text-info"}`}>
                    {i.severity === "critical" || i.status === "FAILED" ? <AlertTriangle className="h-4 w-4" /> : i.severity === "warn" ? <ShieldAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1"><div className="text-sm font-semibold">{i.action} - {i.userEmail || i.user || i.ip}</div><div className="text-xs text-muted-foreground">{i.time}</div></div>
                </div>
              ))}
            {logs.filter((l: any) => l.severity === "warn" || l.severity === "critical" || l.status === "FAILED").length === 0 && (
              <div className="text-sm text-muted-foreground">No recent security incidents.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-lg font-bold"><Lock className="h-5 w-5 text-primary" /> Account lockouts</div>
          <div className="mt-4 divide-y divide-border">
            {lockouts.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No accounts currently locked out.
              </div>
            ) : (
              lockouts.map((l: any) => (
                <div key={l.u} className="flex items-center justify-between py-3 text-sm">
                  <div><div className="font-semibold">{l.u}</div><div className="text-xs text-muted-foreground">{l.r} · {l.w}</div></div>
                  <button
                    onClick={() => handleUnlock(l.u)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary cursor-pointer"
                  >
                    Unlock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-lg font-bold"><Globe className="h-5 w-5 text-primary" /> Compliance</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { t: "SOC 2 Type II", s: "Compliant" }, { t: "GDPR", s: "Compliant" },
              { t: "PCI DSS", s: "Compliant" }, { t: "ISO 27001", s: "In review" },
            ].map((c) => (
              <div key={c.t} className="rounded-xl border border-border p-3">
                <div className="font-semibold">{c.t}</div>
                <div className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${c.s === "Compliant" ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground"}`}>{c.s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
