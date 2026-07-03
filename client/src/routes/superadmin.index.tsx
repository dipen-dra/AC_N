import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Activity, AlertTriangle, FileText, KeyRound, ShieldCheck, Users } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminShell, StatCard } from "@/components/admin-shell";
import { auditLogs } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin/")({
  beforeLoad: ({ context }) => {
    if (!context.user || context.user.role !== "Superadmin") {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Superadmin — AutoCare Nepal" }] }),
  component: Super,
});

const traffic = Array.from({ length: 12 }).map((_, i) => ({ h: `${i * 2}h`, requests: Math.round(400 + Math.random() * 800), threats: Math.round(Math.random() * 40) }));

function Super() {
  return (
    <AdminShell kind="super">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Superadmin Overview</h1>
          <p className="text-sm text-muted-foreground">Governance, security posture and platform-wide controls.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success"><span className="h-2 w-2 rounded-full bg-success" /> Systems nominal</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value="4,236" icon={Users} tone="primary" />
        <StatCard label="Admin roles" value="8" icon={KeyRound} tone="info" />
        <StatCard label="Failed sign-ins (24h)" value="27" icon={AlertTriangle} tone="warning" />
        <StatCard label="Security score" value="94/100" icon={ShieldCheck} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">Traffic & threats (24h)</div>
              <div className="text-sm text-muted-foreground">Requests vs. blocked malicious attempts</div>
            </div>
            <Link to="/superadmin/security" className="text-sm font-semibold text-primary">Security center →</Link>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={traffic}>
                <defs>
                  <linearGradient id="req" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0891b2" stopOpacity={0.35} /><stop offset="100%" stopColor="#0891b2" stopOpacity={0} /></linearGradient>
                  <linearGradient id="thr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e11d48" stopOpacity={0.35} /><stop offset="100%" stopColor="#e11d48" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="h" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                <Area type="monotone" dataKey="requests" stroke="#0891b2" fill="url(#req)" strokeWidth={2} />
                <Area type="monotone" dataKey="threats" stroke="#e11d48" fill="url(#thr)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-lg font-bold"><Activity className="h-5 w-5 text-primary" /> Live audit feed</div>
          <div className="mt-4 space-y-3">
            {auditLogs.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <div className={cn("mt-1 h-2 w-2 rounded-full",
                  l.severity === "critical" ? "bg-destructive" : l.severity === "warn" ? "bg-warning" : "bg-info")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{l.action}</div>
                  <div className="truncate text-xs text-muted-foreground">{l.user} · {l.entity}</div>
                </div>
                <div className="text-[10px] text-muted-foreground">{l.time}</div>
              </div>
            ))}
          </div>
          <Link to="/superadmin/audit" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Full audit log <FileText className="h-4 w-4" /></Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {[
          { i: KeyRound, t: "Roles & permissions", d: "Manage RBAC across the platform", to: "/superadmin/roles" },
          { i: FileText, t: "Audit logs", d: "Every action, immutable ledger", to: "/superadmin/audit" },
          { i: Activity, t: "Security monitoring", d: "Realtime threats and alerts", to: "/superadmin/security" },
        ].map((c) => (
          <Link key={c.t} to={c.to as any} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-foreground text-background"><c.i className="h-6 w-6" /></div>
            <div className="mt-4 text-lg font-bold group-hover:text-primary">{c.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{c.d}</div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
