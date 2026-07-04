import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Building2, Clock, Mail, MapPin, Phone, Upload, Users, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { getWorkshopDetails, updateWorkshopDetails } from "@/lib/db-server";

export const Route = createFileRoute("/admin/workshop")({
  beforeLoad: ({ context }) => {
    if (!context.user || (context.user.role !== "Admin" && context.user.role !== "Superadmin")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getWorkshopDetails(),
  head: () => ({ meta: [{ title: "Workshop — Admin" }] }),
  component: Workshop,
});

function Workshop() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const [ws, setWs] = useState<any>(initial || {
    name: "AutoCare Service Center",
    registrationNo: "AC-NP-2018-1042",
    owner: "Rohit Karki",
    manager: "Sabin Karki",
    phone: "+977 980-1234567",
    email: "support@autocare.np",
    address: "Pulchowk, Lalitpur, Nepal",
    city: "Lalitpur",
    workingHours: {},
    team: [],
    baysCount: 12
  });

  const [saving, setSaving] = useState(false);

  const handleFieldChange = (key: string, value: any) => {
    setWs((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateWorkshopDetails(ws);
      if (res.success) {
        toast.success("Workshop configuration updated successfully.");
        router.invalidate();
      } else {
        toast.error(res.error || "Failed to update configuration.");
      }
    } catch {
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const workingHours = ws.workingHours || {};
  const team = ws.team || [];
  const baysCount = ws.baysCount || 12;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Workshop</h1>
          <p className="text-sm text-muted-foreground">Manage workshop details, staff and working hours.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Config"}
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><Building2 className="h-8 w-8" /></div>
              <div className="flex-1">
                <div className="text-xl font-bold">{ws.name}</div>
                <div className="text-sm text-muted-foreground">Flagship workshop · {baysCount} bays · {team.length} staff</div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Workshop name" value={ws.name} onChange={(v) => handleFieldChange("name", v)} />
              <Field label="Registration no." value={ws.registrationNo} onChange={(v) => handleFieldChange("registrationNo", v)} />
              <Field label="Owner" value={ws.owner} onChange={(v) => handleFieldChange("owner", v)} />
              <Field label="Manager" value={ws.manager} onChange={(v) => handleFieldChange("manager", v)} />
              <Field label="Phone" value={ws.phone} icon={Phone} onChange={(v) => handleFieldChange("phone", v)} />
              <Field label="Email" value={ws.email} icon={Mail} onChange={(v) => handleFieldChange("email", v)} />
              <Field label="Address" value={ws.address} icon={MapPin} onChange={(v) => handleFieldChange("address", v)} />
              <Field label="City" value={ws.city} onChange={(v) => handleFieldChange("city", v)} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold mb-4">Working hours</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {days.map((d) => (
                <div key={d} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span className="font-semibold">{d}</span></div>
                  <input
                    defaultValue={workingHours[d] || (d === "Sunday" ? "9:00 AM - 4:00 PM" : "8:00 AM - 8:00 PM")}
                    onChange={(e) => {
                      const updated = { ...workingHours, [d]: e.target.value };
                      handleFieldChange("workingHours", updated);
                    }}
                    className="w-40 border-b border-transparent text-right text-muted-foreground outline-none focus:border-primary focus:text-foreground"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-lg font-bold"><Users className="h-5 w-5 text-primary" /> Team</div>
            <div className="mt-4 divide-y divide-border">
              {team.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">No staff members assigned.</div>
              ) : (
                team.map((m: any) => (
                  <div key={m.n} className="flex items-center gap-3 py-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{m.n[0]}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{m.n}</div>
                      <div className="text-xs text-muted-foreground">{m.r}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold">Bays & capacity</div>
            <div className="mt-3 text-sm text-muted-foreground">Configure how many concurrent jobs each bay can handle.</div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {Array.from({ length: baysCount }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-primary-soft/60 py-3 text-center text-xs font-semibold text-primary">Bay {i + 1}</div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function Field({ label, value, icon: Icon, onChange }: { label: string; value: string; icon?: any; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <input
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </label>
  );
}
