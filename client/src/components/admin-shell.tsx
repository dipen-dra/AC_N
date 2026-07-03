import { Link, useLocation, useRouteContext, useRouter, useNavigate } from "@tanstack/react-router";
import {
  BarChart3, Bell, Building2, Calendar, ChevronDown, LayoutDashboard, LogOut,
  MessageSquare, Search, Settings, Shield, ShieldCheck, Users, Wrench, FileText, KeyRound, Activity,
} from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { logoutUser, type User } from "@/lib/auth-server";

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/bookings", label: "Bookings", icon: Calendar },
  { to: "/admin/services", label: "Services", icon: Wrench },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/chats", label: "Chats", icon: MessageSquare },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/workshop", label: "Workshop", icon: Building2 },
] as const;

const superNav = [
  { to: "/superadmin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/superadmin/roles", label: "Roles & Access", icon: KeyRound },
  { to: "/superadmin/audit", label: "Audit Logs", icon: FileText },
  { to: "/superadmin/security", label: "Security", icon: Activity },
] as const;

export function AdminShell({ children, kind = "admin" }: { children: ReactNode; kind?: "admin" | "super" }) {
  const location = useLocation();
  const router = useRouter();
  const navigate = useNavigate();
  const { user } = useRouteContext({ from: "__root__" }) as { user?: User | null };
  const nav = kind === "admin" ? adminNav : superNav;
  const Icon = kind === "admin" ? Shield : ShieldCheck;

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await logoutUser();
      if (res.success) {
        await router.invalidate();
        navigate({ to: "/login" });
      }
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-secondary/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <span className={cn("grid h-9 w-9 place-items-center rounded-xl text-primary-foreground shadow-soft", kind === "super" ? "bg-foreground" : "bg-gradient-brand")}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight">AutoCare Nepal</div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{kind === "super" ? "Superadmin" : "Admin Panel"}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((n) => {
            const exact = "exact" in n && n.exact;
            const active = exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}>
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Link to={kind === "admin" ? "/superadmin" : "/admin"} className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-sidebar-accent/60">
            <ShieldCheck className="h-4 w-4" /> Switch to {kind === "admin" ? "Superadmin" : "Admin"}
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent/60">
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 text-left">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search bookings, customers, services..." className="h-10 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-background" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-accent">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">5</span>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-border py-1.5 pl-1.5 pr-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-xs font-bold text-background">
                {user?.initial || "A"}
              </span>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-semibold leading-none">{user?.name || "Admin"}</div>
                <div className="text-[10px] text-muted-foreground">{user?.role || (kind === "super" ? "Superadmin" : "Workshop Manager")}</div>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:inline" />
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, delta, icon: Icon, tone = "primary" }: { label: string; value: string; delta?: string; icon: any; tone?: "primary" | "success" | "info" | "warning" }) {
  const tones: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
    warning: "bg-warning/20 text-warning-foreground",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 truncate text-2xl font-extrabold tracking-tight">{value}</div>
          {delta && <div className="mt-1 text-xs font-medium text-success">▲ {delta}</div>}
        </div>
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
