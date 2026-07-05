import { createFileRoute, Link, redirect, useNavigate, useRouter, Outlet, useLocation } from "@tanstack/react-router";
import { Car, LogOut, Shield, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { logoutUser } from "@/lib/auth-server";
import { ConfirmationModal } from "@/components/confirmation-modal";

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
  const { user } = Route.useRouteContext() as any;
  const navigate = useNavigate();
  const router = useRouter();
  const location = useLocation();
  const currentPath = location.pathname;

  if (!user) return null;

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleSignOut = async () => {
    setIsLogoutConfirmOpen(false);
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
    { to: "/profile", exact: true, i: User, l: "Personal Info" },
    { to: "/profile/vehicles", exact: false, i: Car, l: "My Vehicles" },
    { to: "/profile/security", exact: false, i: Shield, l: "Security" },
  ];

  return (
    <AppShell>
      <PageHeader title="My Profile" subtitle="Manage your account, vehicles and security preferences." />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-3xl border border-border bg-card/40 p-5 space-y-2 shadow-sm backdrop-blur-xl">
          <div className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Profile Settings
          </div>
          {navItems.map((n) => {
            const isActive = n.exact ? currentPath === n.to : currentPath.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-gradient-brand text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:scale-[1.02]"
                }`}
              >
                <n.i className={`h-4 w-4 transition-transform ${isActive ? "" : "group-hover:scale-110"}`} /> {n.l}
              </Link>
            );
          })}
          <div className="pt-4 mt-4 border-t border-border/50">
            <button
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-destructive transition-all hover:bg-destructive/10 hover:scale-[1.02]"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" /> Sign Out
            </button>
          </div>
        </aside>
        
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>

      <ConfirmationModal
        isOpen={isLogoutConfirmOpen}
        title="Sign Out"
        description="Are you sure you want to log out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={handleSignOut}
        onCancel={() => setIsLogoutConfirmOpen(false)}
        icon={LogOut}
        variant="primary"
      />
    </AppShell>
  );
}
