import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Bell, Globe, Lock, ShieldCheck, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { getAdminSettings, updateAdminSettings } from "@/lib/db-server";

export const Route = createFileRoute("/superadmin/settings")({
  beforeLoad: ({ context }) => {
    if (!context.user || context.user.role !== "Superadmin") {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getAdminSettings(),
  head: () => ({ meta: [{ title: "Settings — Superadmin" }] }),
  component: Settings,
});

function Settings() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const [settings, setSettings] = useState<any>(initial || {
    require2FAForAdmins: false,
    inactivityTimeout: true,
    blockAfterFailedLogins: true,
    bookingConfirmations: true,
    statusChangeAlerts: true,
    weeklyDigest: false,
    language: "English (Nepal)",
    currency: "NPR",
    timezone: "Asia/Kathmandu",
    esewaLive: false,
    khaltiLive: false,
    twilioSms: true
  });
  
  const [saving, setSaving] = useState(false);

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateAdminSettings(settings);
      if (res.success) {
        toast.success("Settings updated successfully.");
        router.invalidate();
      } else {
        toast.error(res.error || "Failed to save settings.");
      }
    } catch {
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { 
      i: ShieldCheck, t: "Security", d: "Passwords, 2FA, session timeout", 
      opts: [
        { key: "require2FAForAdmins", label: "Require 2FA for admins" },
        { key: "inactivityTimeout", label: "30-min inactivity timeout" },
        { key: "blockAfterFailedLogins", label: "Block after 5 failed logins" }
      ]
    },
    { 
      i: Bell, t: "Notifications", d: "Email, SMS and push channels", 
      opts: [
        { key: "bookingConfirmations", label: "Booking confirmations" },
        { key: "statusChangeAlerts", label: "Status change alerts" },
        { key: "weeklyDigest", label: "Weekly digest" }
      ]
    },
    { 
      i: Globe, t: "Localization", d: "Language, currency, timezone", 
      opts: [
        { key: "language", label: "English (Nepal)" },
        { key: "currency", label: "NPR — Nepalese Rupee" },
        { key: "timezone", label: "Asia/Kathmandu" }
      ]
    },
    { 
      i: Lock, t: "API access", d: "Manage integrations", 
      opts: [
        { key: "esewaLive", label: "eSewa (Live)" },
        { key: "khaltiLive", label: "Khalti (Live)" },
        { key: "twilioSms", label: "Twilio SMS" }
      ]
    }
  ];

  return (
    <AdminShell kind="super">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure workspace preferences.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {sections.map((s) => (
          <div key={s.t} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><s.i className="h-5 w-5" /></div>
              <div><div className="font-bold">{s.t}</div><div className="text-xs text-muted-foreground">{s.d}</div></div>
            </div>
            <div className="mt-4 space-y-2">
              {s.opts.map((o) => (
                <label key={o.key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm cursor-pointer hover:bg-accent/50 transition-colors">
                  <span>{o.label}</span>
                  {s.t === "Localization" ? (
                    <span className="text-muted-foreground">{settings[o.key]}</span>
                  ) : (
                    <input 
                      type="checkbox" 
                      checked={!!settings[o.key]} 
                      onChange={() => handleToggle(o.key)}
                      className="h-4 w-4 accent-primary cursor-pointer" 
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

