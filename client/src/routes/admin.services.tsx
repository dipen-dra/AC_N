import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Edit2, Plus, Star, Trash2, Wrench, X, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { getServices } from "@/lib/db-server";
import { createService, updateService, deleteService } from "@/lib/db-server";

export const Route = createFileRoute("/admin/services")({
  beforeLoad: ({ context }) => {
    if (!context.user || (context.user.role !== "Admin" && context.user.role !== "Superadmin")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getServices(),
  head: () => ({ meta: [{ title: "Services — Admin" }] }),
  component: AdminServices,
});

const emptyForm = { name: "", desc: "", price: "", duration: "", category: "Maintenance", popular: false };

function AdminServices() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const [services, setServices] = useState<any[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (s: any) => {
    setForm({ name: s.name, desc: s.desc, price: String(s.price), duration: s.duration, category: s.category, popular: !!s.popular });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.desc || !form.price || !form.duration) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await updateService({ id: editingId, data: { ...form, price: Number(form.price) } });
        if (res.success) {
          setServices((prev) => prev.map((s) => (s.id === editingId ? res.service : s)));
          toast.success("Service updated successfully.");
        } else toast.error(res.error || "Update failed.");
      } else {
        const res = await createService({ ...form, price: Number(form.price) });
        if (res.success) {
          setServices((prev) => [...prev, res.service]);
          toast.success("Service created successfully.");
        } else toast.error(res.error || "Create failed.");
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: any) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    const res = await deleteService(s.id);
    if (res.success) {
      setServices((prev) => prev.filter((x) => x.id !== s.id));
      toast.success(`"${s.name}" deleted.`);
    } else toast.error(res.error || "Delete failed.");
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Services</h1>
          <p className="text-sm text-muted-foreground">Manage service catalog, pricing and availability.</p>
        </div>
        <button onClick={handleOpenAdd} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add service
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary-soft/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-lg">{editingId ? "Edit Service" : "New Service"}</div>
            <button onClick={() => setShowForm(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Service Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Full Service" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                {["Maintenance", "Repair", "Inspection", "Cleaning", "Electrical"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Price (Rs.) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 4500" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Duration *</label>
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3-4 hours" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Description *</label>
              <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" id="popular" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} className="h-4 w-4" />
              <label htmlFor="popular" className="text-sm font-medium cursor-pointer">Mark as Popular</label>
            </div>
            <div className="flex gap-3 sm:col-span-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Service"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.length === 0 ? (
          <div className="col-span-3 rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
            No services found. Click "Add service" to create one.
          </div>
        ) : (
          services.map((s) => (
            <div key={s.id || s._id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><Wrench className="h-6 w-6" /></div>
                <div className="flex-1">
                  <div className="font-bold">{s.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-warning text-warning" /> {s.rating || "4.8"} · {s.reviews || "0"} reviews
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.popular ? "bg-primary-soft text-primary" : "bg-success/15 text-success"}`}>
                  {s.popular ? "Popular" : "Active"}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{s.desc}</p>
              <div className="mt-2 text-xs text-muted-foreground">⏱ {s.duration} · {s.category}</div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <div className="text-xs text-muted-foreground">Price</div>
                  <div className="text-lg font-extrabold text-primary">Rs. {Number(s.price).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(s)} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(s)} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
