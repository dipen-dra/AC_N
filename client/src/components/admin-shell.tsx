import { Link, useLocation, useRouteContext, useRouter, useNavigate } from "@tanstack/react-router";
import {
  BarChart3, Bell, Building2, Calendar, ChevronDown, LayoutDashboard, LogOut,
  MessageSquare, Search, Settings, Shield, ShieldCheck, Users, Wrench, FileText, KeyRound, Activity,
  CalendarDays, Loader2, Wrench as Tool
} from "lucide-react";
import { type ReactNode, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { logoutUser, getNotifications, markNotificationsAsRead, clearNotifications, type User } from "@/lib/auth-server";
import { globalSearch } from "@/lib/db-server";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";

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
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [notifCount, setNotifCount] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle Search Debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const results = await globalSearch(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle clicking outside search to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      let prevCount = 0;
      const fetchNotifs = async () => {
        const r = await getNotifications();
        setNotifications(r.notifications);
        if (r.count > prevCount && prevCount !== 0) {
          toast.success("You have new administrative notifications");
        }
        prevCount = r.count;
        setNotifCount(r.count);
      };
      fetchNotifs();
      const int = setInterval(fetchNotifs, 10000);
      return () => clearInterval(int);
    } else {
      setNotifCount(null);
      setNotifications([]);
    }
  }, [user]);

  const handleMarkRead = async () => {
    await markNotificationsAsRead();
    setNotifCount(0);
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClear = async () => {
    await clearNotifications();
    setNotifCount(0);
    setNotifications([]);
    setShowNotifs(false);
  };

  const handleSignOut = async () => {
    setIsLogoutConfirmOpen(false);
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
          {kind === "super" && (
            <Link to="/superadmin/settings" className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              location.pathname.startsWith("/superadmin/settings") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}>
              <Settings className="h-4 w-4" /> Settings
            </Link>
          )}
          <button onClick={() => setIsLogoutConfirmOpen(true)} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors cursor-pointer text-left">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex-1 hidden md:block"></div>
          <div ref={searchContainerRef} className="relative hidden w-full max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setShowSearchDropdown(true);
              }}
              placeholder="Search bookings, customers, services..." 
              className="h-10 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-background" 
            />
            
            {showSearchDropdown && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 mt-2 w-full max-h-[400px] overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-elevated">
                {isSearching ? (
                  <div className="flex items-center justify-center p-4 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((res: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery("");
                          navigate({ to: res.url });
                        }}
                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary-soft text-primary">
                          {res.type === "booking" && <CalendarDays className="h-4 w-4" />}
                          {res.type === "customer" && <Users className="h-4 w-4" />}
                          {res.type === "service" && <Tool className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{res.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{res.subtitle}</div>
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1 bg-secondary rounded shrink-0">
                          {res.type}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 flex justify-end items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-accent"
              >
                <Bell className="h-4 w-4" />
                {notifCount !== null && notifCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-12 mt-1 w-80 rounded-xl border border-border bg-card p-4 shadow-elevated z-50">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-bold">Notifications</h4>
                    <div className="flex gap-2">
                      <button onClick={handleMarkRead} className="p-1.5 hover:bg-accent rounded-md" title="Mark as read">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </button>
                      <button onClick={handleClear} className="p-1.5 hover:bg-accent rounded-md" title="Clear all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2">
                    {notifications.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-4">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={cn("rounded-lg p-3 text-sm", n.read ? "bg-accent/50" : "bg-primary-soft/50 border border-primary/20")}>
                          <div className="font-semibold">{n.title}</div>
                          <div className="text-muted-foreground mt-0.5">{n.message}</div>
                          <div className="text-xs text-muted-foreground/60 mt-1">{new Date(n.time).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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

      <ConfirmationModal
        isOpen={isLogoutConfirmOpen}
        title="Sign Out"
        description="Are you sure you want to log out from the administrative dashboard?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={handleSignOut}
        onCancel={() => setIsLogoutConfirmOpen(false)}
        icon={LogOut}
        variant="primary"
      />
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
