import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Plus, Star, Trash2, Wrench } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { services } from "@/lib/mock";

export const Route = createFileRoute("/admin/services")({
  head: () => ({ meta: [{ title: "Services — Admin" }] }),
  component: AdminServices,
});

function AdminServices() {
  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Services</h1>
          <p className="text-sm text-muted-foreground">Manage service catalog, pricing and availability.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Add service</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div key={s.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><Wrench className="h-6 w-6" /></div>
              <div className="flex-1">
                <div className="font-bold">{s.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-warning text-warning" /> {s.rating} · {s.reviews} reviews</div>
              </div>
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">Active</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{s.desc}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div>
                <div className="text-xs text-muted-foreground">Price</div>
                <div className="text-lg font-extrabold text-primary">Rs. {s.price.toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
                <button className="grid h-9 w-9 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
