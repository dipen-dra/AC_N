import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Check, KeyRound, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { getUsers, updateUserRole, deleteUser } from "@/lib/db-server";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/superadmin/roles")({
  beforeLoad: ({ context }) => {
    if (!context.user || context.user.role !== "Superadmin") {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getUsers(),
  head: () => ({ meta: [{ title: "Roles & Access — Superadmin" }] }),
  component: Roles,
});

const permissions = [
  { g: "Bookings", p: ["View bookings", "Create bookings", "Cancel bookings", "Refund payments"] },
  { g: "Services", p: ["View services", "Edit pricing", "Publish/unpublish"] },
  { g: "Users", p: ["View users", "Suspend users", "Delete users", "Assign roles"] },
  { g: "System", p: ["Access audit logs", "Manage integrations", "View security center"] },
];

function Roles() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>(initial);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

  const rolesMeta = [
    { name: "Superadmin", perms: 42, desc: "Full control including role management and audit logs" },
    { name: "Admin", perms: 28, desc: "Manage services, bookings, customers and chats" },
    { name: "Customer", perms: 8, desc: "Book, pay, track and review" },
  ];

  const getRoleUserCount = (roleName: string) => {
    return customers.filter((c) => {
      const userRole = c.role || "Customer";
      return userRole.toLowerCase() === roleName.toLowerCase();
    }).length;
  };

  const handleRoleChange = async (id: string, role: string) => {
    setUpdating(id);
    const res = await updateUserRole(id, role);
    if (res.success) {
      setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, role } : c));
      toast.success(`Role updated to ${role}.`);
      router.invalidate();
    } else {
      toast.error(res.error || "Failed to update role.");
    }
    setUpdating(null);
  };

  return (
    <AdminShell kind="super">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Roles & Access</h1>
          <p className="text-sm text-muted-foreground">Fine-grained role based access control (RBAC).</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Create role</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rolesMeta.map((r) => (
          <div key={r.name} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /><div className="font-bold">{r.name}</div></div>
            <div className="mt-1 text-xs text-muted-foreground">{r.desc}</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div><div className="text-xs text-muted-foreground">Users</div><div className="font-bold">{getRoleUserCount(r.name)}</div></div>
              <div><div className="text-xs text-muted-foreground">Permissions</div><div className="font-bold">{r.perms}</div></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-6">
          <div className="text-lg font-bold">Permissions matrix</div>
          <div className="text-sm text-muted-foreground">Toggle capabilities per role. Changes are audited.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3 text-left font-semibold">Permission</th>{rolesMeta.map((r) => <th key={r.name} className="px-4 py-3 text-center font-semibold">{r.name}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {permissions.map((group) => (
                <>
                  <tr key={group.g} className="bg-secondary/30"><td colSpan={rolesMeta.length + 1} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.g}</td></tr>
                  {group.p.map((p) => (
                    <tr key={p}>
                      <td className="px-4 py-3">{p}</td>
                      {rolesMeta.map((r, i) => {
                        const enabled = i === 0 || (i === 1 && !p.includes("Delete")) || (i === 2 && p.includes("View"));
                        return <td key={r.name} className="px-4 py-3 text-center">
                          {enabled ? <span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-success/15 text-success"><Check className="h-3.5 w-3.5" /></span> : <span className="text-muted-foreground">—</span>}
                        </td>;
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-lg font-bold mb-4"><Users className="h-5 w-5 text-primary" /> User Role Management</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Current Role</th><th className="px-4 py-3 text-left">Change Role</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.role === "Superadmin" ? "bg-primary/15 text-primary" : c.role === "Admin" ? "bg-info/15 text-info" : "bg-success/15 text-success"}`}>
                        {c.role || "Customer"}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <select
                        defaultValue={c.role || "Customer"}
                        disabled={updating === c.id}
                        onChange={(e) => handleRoleChange(c.id, e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                      >
                        <option value="Customer">Customer</option>
                        <option value="Admin">Admin</option>
                        <option value="Superadmin">Superadmin</option>
                      </select>
                      <button
                        onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                        disabled={updating === c.id}
                        className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This action cannot be undone and will permanently remove their profile and all associated bookings from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!deleteTarget) return;
                const targetId = deleteTarget.id;
                setDeleteTarget(null);
                setUpdating(targetId);
                const res = await deleteUser(targetId);
                if (res.success) {
                  toast.success("User deleted successfully.");
                  router.invalidate();
                } else {
                  toast.error(res.error || "Failed to delete user.");
                }
                setUpdating(null);
              }}
              className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
            >
              Delete Account
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
