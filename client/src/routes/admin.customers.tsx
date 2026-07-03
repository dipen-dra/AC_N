import { createFileRoute } from "@tanstack/react-router";
import { Download, MoreHorizontal, Search, UserPlus } from "lucide-react";
import { AdminShell, StatCard } from "@/components/admin-shell";
import { customers } from "@/lib/mock";
import { Users, UserCheck, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
  component: AdminCustomers,
});

function AdminCustomers() {
  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Customers</h1>
          <p className="text-sm text-muted-foreground">Full customer directory, activity and loyalty.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold"><Download className="h-4 w-4" /> Export</button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><UserPlus className="h-4 w-4" /> Add customer</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total customers" value="4,210" delta="3.1%" icon={Users} tone="primary" />
        <StatCard label="Active this month" value="1,842" delta="9.8%" icon={UserCheck} tone="success" />
        <StatCard label="Lifetime value" value="Rs. 12.4M" delta="18.3%" icon={DollarSign} tone="info" />
        <StatCard label="Retention" value="84%" delta="2.1%" icon={TrendingUp} tone="warning" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search by name, email or phone..." className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
          </div>
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option>All statuses</option><option>Active</option><option>Suspended</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>{["Customer", "Contact", "Bookings", "Lifetime spend", "Joined", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{c.name[0]}</div>
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div>{c.email}</div><div className="text-xs text-muted-foreground">{c.phone}</div></td>
                  <td className="px-4 py-3 font-semibold">{c.bookings}</td>
                  <td className="px-4 py-3 font-bold">Rs. {c.spend.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.joined}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      c.status === "Active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3"><button className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary"><MoreHorizontal className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
