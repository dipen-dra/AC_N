import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { Bell, Camera, Car, KeyRound, LogOut, Mail, MapPin, Phone, Plus, Shield, ShieldCheck, Trash2, User, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { logoutUser } from "@/lib/auth-server";

export const Route = createFileRoute("/profile")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "My Profile — AutoCare Nepal" }] }),
  component: Profile,
});

function Profile() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      const res = await logoutUser();
      if (res.success) {
        toast.success("Logged out successfully.");
        await router.invalidate();
        navigate({ to: "/login" });
      } else {
        toast.error(res.error || "Logout failed.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred during logout.");
    }
  };

  const navItems = [
    { i: User, l: "Personal Info", onClick: () => {} },
    { i: Car, l: "My Vehicles", onClick: () => {} },
    { i: Wallet, l: "Payment Methods", onClick: () => {} },
    { i: Bell, l: "Notifications", onClick: () => {} },
    { i: Shield, l: "Security", onClick: () => {} },
    { i: LogOut, l: "Sign Out", onClick: handleSignOut },
  ];

  return (
    <AppShell>
      <PageHeader title="My Profile" subtitle="Manage your account, vehicles and security preferences." />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-border bg-card p-4">
          {navItems.map((n, i) => (
            <button
              key={n.l}
              onClick={n.onClick}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                i === 0 ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <n.i className="h-4 w-4" /> {n.l}
            </button>
          ))}
        </aside>
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative">
                <div className="grid h-24 w-24 place-items-center rounded-full bg-foreground text-3xl font-bold text-background">{user.initial}</div>
                <button className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Camera className="h-4 w-4" /></button>
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold">{user.name}</div>
                <div className="text-sm text-muted-foreground">Member since Jan 2026 · {user.tier} tier</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-primary-soft px-2 py-1 font-semibold text-primary">⭐ {user.points} points</span>
                  <span className="rounded-full bg-success/15 px-2 py-1 font-semibold text-success">Verified</span>
                </div>
              </div>
              <button className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Edit profile</button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { i: User, l: "Full Name", v: user.name },
                { i: Mail, l: "Email Address", v: user.email },
                { i: Phone, l: "Phone Number", v: user.phone || "+977 -" },
                { i: MapPin, l: "Address", v: "Pulchowk, Lalitpur, Nepal" },
              ].map((f) => (
                <div key={f.l} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><f.i className="h-3.5 w-3.5" /> {f.l}</div>
                  <div className="mt-1 font-semibold">{f.v}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">My Vehicles</div>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Add vehicle</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { n: "BA 2 PA 5512", m: "Toyota Yaris · 2022", primary: true },
                { n: "BA 1 JA 1234", m: "Honda City · 2020" },
              ].map((v) => (
                <div key={v.n} className="flex items-center gap-4 rounded-xl border border-border p-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><Car className="h-6 w-6" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold">{v.n} {v.primary && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">Primary</span>}</div>
                    <div className="text-xs text-muted-foreground">{v.m}</div>
                  </div>
                  <button className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold">Security</div>
            <div className="mt-4 space-y-3">
              {[
                { i: KeyRound, t: "Password", d: "Last changed 3 months ago", cta: "Change" },
                { i: ShieldCheck, t: "Two-step verification", d: "Enabled via Authenticator app", cta: "Manage", on: true },
                { i: Shield, t: "Login alerts", d: "Get notified for new sign-ins", cta: "Enabled", on: true },
              ].map((s) => (
                <div key={s.t} className="flex items-center gap-4 rounded-xl border border-border p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><s.i className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="font-semibold">{s.t}</div>
                    <div className="text-xs text-muted-foreground">{s.d}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.on && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">ON</span>}
                    <Link to="/auth/two-factor" className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary">{s.cta}</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
