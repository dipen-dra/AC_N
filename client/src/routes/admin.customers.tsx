import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Download, MoreHorizontal, Search, UserPlus, Users, UserCheck, DollarSign, TrendingUp, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell, StatCard } from "@/components/admin-shell";
import { getAdminCustomers, updateCustomerStatus, deleteCustomer } from "@/lib/db-server";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/confirmation-modal";

export const Route = createFileRoute("/admin/customers")({
  beforeLoad: ({ context }) => {
    if (!context.user || (context.user.role !== "Admin" && context.user.role !== "Superadmin")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getAdminCustomers(),
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const [customers, setCustomers] = useState<any[]>(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  
  const [customerToDelete, setCustomerToDelete] = useState<any | null>(null);
  const [customerToToggle, setCustomerToToggle] = useState<any | null>(null);

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search));
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalSpend = customers.reduce((s, c) => s + c.spend, 0);
  const activeCount = customers.filter((c) => c.status === "Active").length;

  const handleToggleStatus = (c: any) => {
    setCustomerToToggle(c);
    setOpenMenu(null);
  };

  const confirmToggleStatus = async () => {
    if (!customerToToggle) return;
    const c = customerToToggle;
    const newStatus = c.status === "Active" ? "Suspended" : "Active";
    const res = await updateCustomerStatus({ id: c.id, status: newStatus });
    if (res.success) {
      setCustomers((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: newStatus } : x)));
      toast.success(`${c.name} is now ${newStatus}.`);
    } else {
      toast.error(res.error || "Failed to update status.");
    }
    setCustomerToToggle(null);
  };

  const handleDelete = (c: any) => {
    setCustomerToDelete(c);
    setOpenMenu(null);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    const c = customerToDelete;
    const res = await deleteCustomer(c.id);
    if (res.success) {
      setCustomers((prev) => prev.filter((x) => x.id !== c.id));
      toast.success(`${c.name} has been deleted.`);
    } else {
      toast.error(res.error || "Failed to delete.");
    }
    setCustomerToDelete(null);
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Customers</h1>
          <p className="text-sm text-muted-foreground">Full customer directory, activity and loyalty.</p>
        </div>
        <button
          onClick={() => router.invalidate()}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary"
        >
          <Download className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total customers" value={String(customers.length)} icon={Users} tone="primary" />
        <StatCard label="Active" value={String(activeCount)} icon={UserCheck} tone="success" />
        <StatCard label="Lifetime spend" value={`Rs. ${(totalSpend / 1000).toFixed(0)}K`} icon={DollarSign} tone="info" />
        <StatCard label="Suspended" value={String(customers.length - activeCount)} icon={TrendingUp} tone="warning" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>{["Customer", "Contact", "Bookings", "Lifetime spend", "Points", "Joined", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No customers match your filters.</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/30">
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
                    <td className="px-4 py-3 text-primary font-semibold">{c.points} pts</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.joined}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        c.status === "Active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>{c.status}</span>
                    </td>
                    <td className="relative px-4 py-3">
                      <button
                        onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenu === c.id && (
                        <div className="absolute right-4 top-10 z-10 min-w-[160px] rounded-xl border border-border bg-card shadow-lg">
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary"
                          >
                            <Shield className="h-4 w-4" />
                            {c.status === "Active" ? "Suspend" : "Activate"}
                          </button>
                          {user?.role === "Superadmin" && (
                            <button
                              onClick={() => handleDelete(c)}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" /> Delete account
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!customerToDelete}
        title="Delete Customer Account"
        description={`Are you sure you want to permanently delete the account of ${customerToDelete?.name}? This action is irreversible.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setCustomerToDelete(null)}
        icon={Trash2}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={!!customerToToggle}
        title={customerToToggle?.status === "Active" ? "Suspend Account" : "Activate Account"}
        description={
          customerToToggle?.status === "Active"
            ? `Are you sure you want to suspend the account of ${customerToToggle?.name}? They will lose access to system actions.`
            : `Are you sure you want to reactivate the account of ${customerToToggle?.name}?`
        }
        confirmText={customerToToggle?.status === "Active" ? "Suspend" : "Activate"}
        cancelText="Cancel"
        onConfirm={confirmToggleStatus}
        onCancel={() => setCustomerToToggle(null)}
        icon={Shield}
        variant={customerToToggle?.status === "Active" ? "danger" : "primary"}
      />
    </AdminShell>
  );
}
