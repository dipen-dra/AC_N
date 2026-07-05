import { Link, useLocation, useRouteContext } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, Wrench, X, Check, Trash } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/auth-server";
import { getNotifications, markNotificationsAsRead, clearNotifications } from "@/lib/auth-server";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/book", label: "Book Service" },
  { to: "/bookings", label: "My Bookings" },
  { to: "/track", label: "Track Service" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 font-display", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-soft">
        <Wrench className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="text-xl font-extrabold tracking-tight">
        Auto<span className="text-primary">Care</span> <span className="font-medium text-muted-foreground">Nepal</span>
      </span>
    </Link>
  );
}

export function AppHeader() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [notifCount, setNotifCount] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const { user } = useRouteContext({ from: "__root__" }) as { user?: User | null };
  const pathname = location.pathname;

  useEffect(() => {
    if (user) {
      let prevCount = 0;
      const fetchNotifs = async () => {
        const r = await getNotifications();
        setNotifications(r.notifications);
        if (r.count > prevCount && prevCount !== 0) {
          toast.success("You have new notifications");
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
    const res = await markNotificationsAsRead();
    if (res.success) {
      setNotifCount(0);
      setNotifications(prev => prev.map(n => ({...n, read: true})));
      toast.success("Notifications marked as read");
    } else {
      toast.error("Failed to mark as read");
    }
  };

  const handleClear = async () => {
    const res = await clearNotifications();
    if (res.success) {
      setNotifCount(0);
      setNotifications([]);
      toast.success("Notifications cleared");
    } else {
      toast.error("Failed to clear notifications");
    }
  };
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLogo className="shrink-0" />
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : (pathname === n.to || pathname.startsWith(n.to + "/"));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200",
                  active ? "text-primary font-bold" : "text-foreground/75 hover:text-foreground"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative">
            <button 
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-accent shrink-0"
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
                    <button onClick={handleMarkRead} className="p-1.5 hover:bg-accent rounded-md" title="Mark as read"><Check className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={handleClear} className="p-1.5 hover:bg-accent rounded-md" title="Clear all"><Trash className="h-4 w-4 text-muted-foreground" /></button>
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
          {user ? (
            <Link to="/profile" className="flex items-center gap-2 rounded-full border border-border py-1.5 pl-1.5 pr-3 hover:bg-accent shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover shrink-0" />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-xs font-bold text-background shrink-0">
                  {user.initial}
                </span>
              )}
              <span className="hidden text-sm font-medium sm:inline">{user.name.split(" ")[0]}</span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:inline" />
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-accent">Login</Link>
              <Link to="/register" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Sign Up</Link>
            </div>
          )}
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden shrink-0" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Nepal's trusted vehicle service platform. Book, track and manage all your car care in one place.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">About us</Link></li>
            <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link to="/ai-assistant" className="hover:text-foreground">AI Assistant</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Support</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/bookings" className="hover:text-foreground">My Bookings</Link></li>
            <li><Link to="/loyalty" className="hover:text-foreground">Loyalty Program</Link></li>
            <li><Link to="/chat" className="hover:text-foreground">Live Chat</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">FAQs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Putalisadak, Kathmandu</li>
            <li>+977 980-1234567</li>
            <li>support@autocare.np</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AutoCare Nepal. All rights reserved.
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, illustration }: { title: string; subtitle?: string; actions?: ReactNode; illustration?: ReactNode }) {
  return (
    <div className="border-b border-border/60 bg-gradient-to-b from-primary-soft/50 to-background">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 sm:py-10">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
        {illustration}
      </div>
    </div>
  );
}
