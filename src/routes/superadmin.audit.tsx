import { createFileRoute, redirect } from "@tanstack/react-router";
import { Download, Filter, Search } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { getAuditLogs } from "@/lib/db-server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin/audit")({
  beforeLoad: ({ context }) => {
    if (!context.user || context.user.role !== "Superadmin") {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getAuditLogs(),
  head: () => ({ meta: [{ title: "Audit Logs — Superadmin" }] }),
  component: Audit,
});

function Audit() {
  const auditLogs = Route.useLoaderData();
  const rows = auditLogs;
  return (
    <AdminShell kind="super">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Every action across the platform. Immutable, retention 5 years.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold"><Download className="h-4 w-4" /> Export</button>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search action, user or entity..." className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
          </div>
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option>All severities</option><option>Critical</option><option>Warning</option><option>Info</option></select>
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option>Last 24 hours</option><option>Last 7 days</option><option>Last 30 days</option></select>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Filter className="h-4 w-4" /> Filters</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>{["Severity", "Time", "User", "Action", "Entity", "IP address", "Log ID"].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                      l.severity === "critical" ? "bg-destructive/15 text-destructive" : l.severity === "warn" ? "bg-warning/20 text-warning-foreground" : "bg-info/15 text-info")}>
                      ● {l.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.time}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.user}</td>
                  <td className="px-4 py-3 font-semibold">{l.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.entity}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.ip}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.id.split("-").slice(0, 2).join("-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
