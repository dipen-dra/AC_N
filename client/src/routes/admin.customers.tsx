import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Download, MoreHorizontal, Search, UserPlus, Users, UserCheck, DollarSign, TrendingUp, Shield, Trash2, User, X, MapPin, Car, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell, StatCard } from "@/components/admin-shell";
import { getAdminCustomers, updateCustomerStatus, deleteCustomer } from "@/lib/db-server";
import { exportToCSV } from "@/lib/export";
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
  const [viewProfile, setViewProfile] = useState<any | null>(null);

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

  const handleExport = () => {
    const exportData = filtered.map((c: any) => ({
      ID: c.id,
      Name: c.name,
      Email: c.email,
      Phone: c.phone || "—",
      Status: c.status,
      Tier: c.tier,
      Points: c.points,
      Bookings: c.bookings,
      Total_Spend_NPR: c.spend,
      Joined: c.joined
    }));
    exportToCSV(exportData, `customers_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage client profiles, tiers and loyalty points.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary cursor-pointer">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={() => toast.info("New customer creation requires user registration via the public sign-up page.")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <UserPlus className="h-4 w-4" /> Add Customer
          </button>
        </div>
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
              className="h-12 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
                  <tr key={c.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {c.avatar ? (
                            <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
                          ) : (
                            c.initial || c.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone}</td>
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
                            onClick={() => { setViewProfile(c); setOpenMenu(null); }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary cursor-pointer"
                          >
                            <User className="h-4 w-4" /> View profile
                          </button>
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary cursor-pointer"
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

      {viewProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl relative overflow-hidden">
            <div className="h-24 bg-primary/10"></div>
            <button onClick={() => setViewProfile(null)} className="absolute right-4 top-4 rounded-full bg-background/50 p-1.5 hover:bg-background cursor-pointer text-muted-foreground"><X className="h-5 w-5" /></button>
            <div className="px-6 pb-6">
              <div className="-mt-12 mb-4 flex justify-between items-end">
                <div className="h-24 w-24 rounded-full border-4 border-card bg-card overflow-hidden flex items-center justify-center text-3xl font-bold text-primary bg-primary/10">
                  {viewProfile.avatar ? <img src={viewProfile.avatar} className="h-full w-full object-cover" /> : viewProfile.initial}
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Joined {viewProfile.joined}</span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", viewProfile.status === "Active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>{viewProfile.status}</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold">{viewProfile.name}</h2>
              <div className="text-muted-foreground">{viewProfile.email}</div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1"><MapPin className="h-4 w-4"/> <span className="text-xs font-semibold uppercase">Location</span></div>
                  <div className="text-sm font-medium">{viewProfile.address || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="h-4 w-4"/> <span className="text-xs font-semibold uppercase">Last Login</span></div>
                  <div className="text-sm font-medium">{viewProfile.lastLogin}</div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border p-4 bg-muted/20">
                <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2"><Car className="h-4 w-4"/> Vehicles</h3>
                {viewProfile.vehicles?.length > 0 ? (
                  <div className="space-y-2">
                    {viewProfile.vehicles.map((v: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm bg-background border border-border p-2 rounded-lg">
                        <span className="font-semibold">{v.plate}</span>
                        <span className="text-muted-foreground">{v.model}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No vehicles registered.</div>
                )}
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-primary-soft rounded-lg p-3 text-center">
                  <div className="text-xs text-primary font-bold uppercase mb-1">Bookings</div>
                  <div className="text-xl font-bold">{viewProfile.bookings}</div>
                </div>
                <div className="bg-primary-soft rounded-lg p-3 text-center">
                  <div className="text-xs text-primary font-bold uppercase mb-1">Spend</div>
                  <div className="text-xl font-bold">Rs. {viewProfile.spend.toLocaleString()}</div>
                </div>
                <div className="bg-primary-soft rounded-lg p-3 text-center">
                  <div className="text-xs text-primary font-bold uppercase mb-1">Points</div>
                  <div className="text-xl font-bold">{viewProfile.points}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
