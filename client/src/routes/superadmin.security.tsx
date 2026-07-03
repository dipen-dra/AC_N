import { createFileRoute, redirect } from "@tanstack/react-router";
import { Activity, AlertTriangle, CheckCircle2, Globe, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { AdminShell, StatCard } from "@/components/admin-shell";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/superadmin/security")({
  beforeLoad: ({ context }) => {
    if (!context.user || context.user.role !== "Superadmin") {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Security — Superadmin" }] }),
  component: Security,
});

const attack = Array.from({ length: 24 }).map((_, i) => ({ h: `${i}h`, v: Math.round(Math.random() * 40 + (i > 18 ? 60 : 0)) }));

function Security() {
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
        <StatCard label="Threats blocked" value="1,284" delta="12%" icon={ShieldAlert} tone="primary" />
        <StatCard label="Locked accounts" value="14" icon={Lock} tone="warning" />
        <StatCard label="2FA enrolled" value="92%" delta="4.3%" icon={ShieldCheck} tone="success" />
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
            {[
              { s: "critical", t: "Brute force detected from IP 27.34.66.201", w: "4 min ago" },
              { s: "warn", t: "New admin login from Kathmandu", w: "22 min ago" },
              { s: "info", t: "Weekly penetration scan completed", w: "3 hours ago" },
              { s: "warn", t: "TLS certificate renews in 14 days", w: "6 hours ago" },
            ].map((i) => (
              <div key={i.t} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${i.s === "critical" ? "bg-destructive/15 text-destructive" : i.s === "warn" ? "bg-warning/20 text-warning-foreground" : "bg-info/15 text-info"}`}>
                  {i.s === "critical" ? <AlertTriangle className="h-4 w-4" /> : i.s === "warn" ? <ShieldAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </div>
                <div className="flex-1"><div className="text-sm font-semibold">{i.t}</div><div className="text-xs text-muted-foreground">{i.w}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-lg font-bold"><Lock className="h-5 w-5 text-primary" /> Account lockouts</div>
          <div className="mt-4 divide-y divide-border">
            {[
              { u: "rehan@autocare.np", r: "5 failed logins", w: "12 min ago" },
              { u: "test@fixhub.com", r: "Suspicious IP (VPN)", w: "34 min ago" },
              { u: "aayusha.kc@gmail.com", r: "Impossible travel", w: "1 hr ago" },
            ].map((l) => (
              <div key={l.u} className="flex items-center justify-between py-3 text-sm">
                <div><div className="font-semibold">{l.u}</div><div className="text-xs text-muted-foreground">{l.r} · {l.w}</div></div>
                <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Unlock</button>
              </div>
            ))}
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
