import { Link, useLocation, useRouteContext } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, Wrench, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/auth-server";

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
  const { user } = useRouteContext({ from: "__root__" }) as { user?: User | null };
  const pathname = location.pathname;
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLogo />
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
                {active && (
                  <span className="absolute -bottom-[21px] left-1 right-1 h-[3px] rounded-full bg-primary shadow-[0_1.5px_6px_oklch(0.62_0.24_26/_0.4)]" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="relative grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-accent">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
          </button>
          {user ? (
            <Link to="/profile" className="flex items-center gap-2 rounded-full border border-border py-1.5 pl-1.5 pr-3 hover:bg-accent">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-xs font-bold text-background">
                {user.initial}
              </span>
              <span className="hidden text-sm font-medium sm:inline">{user.name.split(" ")[0]}</span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:inline" />
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-accent">Login</Link>
              <Link to="/register" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Sign Up</Link>
            </div>
          )}
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
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
