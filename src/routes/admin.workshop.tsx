import { createFileRoute } from "@tanstack/react-router";
import { Building2, Clock, Mail, MapPin, Phone, Upload, Users } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin/workshop")({
  head: () => ({ meta: [{ title: "Workshop — Admin" }] }),
  component: Workshop,
});

function Workshop() {
  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Workshop</h1>
        <p className="text-sm text-muted-foreground">Manage workshop details, staff and working hours.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary"><Building2 className="h-8 w-8" /></div>
              <div className="flex-1">
                <div className="text-xl font-bold">AutoCare Service Center — Lalitpur</div>
                <div className="text-sm text-muted-foreground">Flagship workshop · 12 bays · 24 staff</div>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold"><Upload className="h-4 w-4" /> Change logo</button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Workshop name" value="AutoCare Service Center" />
              <Field label="Registration no." value="AC-NP-2018-1042" />
              <Field label="Owner" value="Rohit Karki" />
              <Field label="Manager" value="Sabin Karki" />
              <Field label="Phone" value="+977 980-1234567" icon={Phone} />
              <Field label="Email" value="support@autocare.np" icon={Mail} />
              <Field label="Address" value="Pulchowk, Lalitpur, Nepal" icon={MapPin} />
              <Field label="City" value="Lalitpur" />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold">Working hours</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                <div key={d} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span className="font-semibold">{d}</span></div>
                  <div className="text-muted-foreground">{d === "Sunday" ? "9:00 AM - 4:00 PM" : "8:00 AM - 8:00 PM"}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-lg font-bold"><Users className="h-5 w-5 text-primary" /> Team</div>
            <div className="mt-4 divide-y divide-border">
              {[
                { n: "Ramesh KC", r: "Senior Technician" },
                { n: "Bijay Shrestha", r: "AC Specialist" },
                { n: "Suman Rai", r: "Lubrication Expert" },
                { n: "Sabin Karki", r: "Manager" },
              ].map((m) => (
                <div key={m.n} className="flex items-center gap-3 py-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{m.n[0]}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{m.n}</div>
                    <div className="text-xs text-muted-foreground">{m.r}</div>
                  </div>
                  <button className="text-xs font-semibold text-primary hover:underline">Manage</button>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold">Bays & capacity</div>
            <div className="mt-3 text-sm text-muted-foreground">Configure how many concurrent jobs each bay can handle.</div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-primary-soft/60 py-3 text-center text-xs font-semibold text-primary">Bay {i + 1}</div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <input defaultValue={value} className="h-11 flex-1 bg-transparent text-sm outline-none" />
      </div>
    </label>
  );
}
