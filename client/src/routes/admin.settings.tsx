import { createFileRoute } from "@tanstack/react-router";
import { Bell, Globe, Lock, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: Settings,
});

function Settings() {
  return (
    <AdminShell>
      <div className="mb-6"><h1 className="text-3xl font-extrabold">Settings</h1><p className="text-sm text-muted-foreground">Configure workspace preferences.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[
          { i: ShieldCheck, t: "Security", d: "Passwords, 2FA, session timeout", opts: ["Require 2FA for admins", "30-min inactivity timeout", "Block after 5 failed logins"] },
          { i: Bell, t: "Notifications", d: "Email, SMS and push channels", opts: ["Booking confirmations", "Status change alerts", "Weekly digest"] },
          { i: Globe, t: "Localization", d: "Language, currency, timezone", opts: ["English (Nepal)", "NPR — Nepalese Rupee", "Asia/Kathmandu"] },
          { i: Lock, t: "API access", d: "Manage integrations", opts: ["eSewa (Live)", "Khalti (Live)", "Twilio SMS"] },
        ].map((s) => (
          <div key={s.t} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><s.i className="h-5 w-5" /></div><div><div className="font-bold">{s.t}</div><div className="text-xs text-muted-foreground">{s.d}</div></div></div>
            <div className="mt-4 space-y-2">
              {s.opts.map((o) => (
                <label key={o} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span>{o}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
