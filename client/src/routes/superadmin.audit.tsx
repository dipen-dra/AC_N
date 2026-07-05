import { createFileRoute, redirect } from "@tanstack/react-router";
import { Download, Filter, Search } from "lucide-react";
import { useState, useMemo } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("All severities");
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const itemsPerPage = 10;

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log: any) => {
      // Search filter
      if (search) {
        const query = search.toLowerCase();
        const matchesQuery = 
          log.action?.toLowerCase().includes(query) || 
          log.user?.toLowerCase().includes(query) || 
          log.entity?.toLowerCase().includes(query) || 
          log.ip?.toLowerCase().includes(query) || 
          log.id?.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }
      
      // Severity filter
      if (severity !== "All severities") {
        const targetSeverity = severity.toLowerCase();
        if (targetSeverity === "critical" && log.severity !== "critical") return false;
        if (targetSeverity === "warning" && log.severity !== "warn") return false;
        if (targetSeverity === "info" && log.severity !== "info") return false;
      }
      
      // Time filter (parse log.createdAt or log.time)
      if (timeRange) {
        const logDate = new Date(log.time || log.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - logDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        if (timeRange === "Last 24 hours" && diffDays > 1) return false;
        if (timeRange === "Last 7 days" && diffDays > 7) return false;
        if (timeRange === "Last 30 days" && diffDays > 30) return false;
      }
      
      return true;
    });
  }, [auditLogs, search, severity, timeRange]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleSeverityChange = (val: string) => {
    setSeverity(val);
    setCurrentPage(1);
  };

  const handleTimeChange = (val: string) => {
    setTimeRange(val);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

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
            <input 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search action, user or entity..." 
              className="h-12 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
            />
          </div>
          <select 
            value={severity}
            onChange={(e) => handleSeverityChange(e.target.value)}
            className="h-12 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option>All severities</option>
            <option>Critical</option>
            <option>Warning</option>
            <option>Info</option>
          </select>
          <select 
            value={timeRange}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="h-12 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>{["Severity", "Time", "User", "Action", "Entity", "IP address", "Log ID"].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedLogs.map((l: any) => (
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
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No matching audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border p-4">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of{" "}
              <span className="font-semibold">{filteredLogs.length}</span> logs
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    currentPage === i + 1 ? "bg-primary text-primary-foreground shadow-soft" : "border border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

