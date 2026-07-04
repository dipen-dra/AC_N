import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { Bell, Camera, Car, KeyRound, LogOut, Mail, MapPin, Phone, Plus, Shield, ShieldCheck, Trash2, User, Wallet } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { logoutUser, uploadAvatar } from "@/lib/auth-server";
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
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();

  if (!user) return null;

  const [activeTab, setActiveTab] = useState<"info" | "vehicles" | "security">("info");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [editingProfile, setEditingProfile] = useState(false);
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState("Pulchowk, Lalitpur, Nepal");

  // Vehicles Garage State
  const [vehicles, setVehicles] = useState([
    { n: "BA 2 PA 5512", m: "Toyota Yaris · 2022", primary: true },
    { n: "BA 1 JA 1234", m: "Honda City · 2020" },
  ]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("");
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isDeleteVehicleConfirmOpen, setIsDeleteVehicleConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

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

  const handleDeleteVehicleClick = (plate: string) => {
    setVehicleToDelete(plate);
    setIsDeleteVehicleConfirmOpen(true);
  };

  const confirmDeleteVehicle = () => {
    if (vehicleToDelete) {
      setVehicles(vehicles.filter((v) => v.n !== vehicleToDelete));
      toast.success(`Vehicle ${vehicleToDelete} removed successfully.`);
      setVehicleToDelete(null);
    }
    setIsDeleteVehicleConfirmOpen(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }
    // Optimistic preview
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      if (res.success && res.avatar) {
        setAvatarUrl(res.avatar);
        await router.invalidate();
        toast.success("Profile picture updated!");
      } else {
        toast.error(res.error || "Failed to upload photo.");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newModel) {
      toast.error("Please enter both registration plate and make/model.");
      return;
    }
    setVehicles([...vehicles, { n: newPlate, m: newModel }]);
    setNewPlate("");
    setNewModel("");
    setShowAddVehicle(false);
    toast.success(`Vehicle ${newPlate} added to your garage.`);
  };

  const handleDeleteVehicle = (plate: string) => {
    setVehicles(vehicles.filter((v) => v.n !== plate));
    toast.success(`Vehicle ${plate} removed successfully.`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditingProfile(false);
    toast.success("Profile contact information updated successfully.");
  };

  const navItems = [
    { id: "info", i: User, l: "Personal Info" },
    { id: "vehicles", i: Car, l: "My Vehicles" },
    { id: "security", i: Shield, l: "Security" },
  ];

  return (
    <AppShell>
      <PageHeader title="My Profile" subtitle="Manage your account, vehicles and security preferences." />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-border bg-card p-4 space-y-1">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveTab(n.id as any)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === n.id ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <n.i className="h-4 w-4" /> {n.l}
            </button>
          ))}
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </aside>
        
        <div className="space-y-6">
          {/* TAB 1: PERSONAL INFO */}
          {activeTab === "info" && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center gap-5 justify-between">
                <div className="flex flex-wrap items-center gap-5">
                  <div className="relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user.name} className="h-24 w-24 rounded-full object-cover border-2 border-border" />
                    ) : (
                      <div className="grid h-24 w-24 place-items-center rounded-full bg-foreground text-3xl font-bold text-background">{user.initial}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {uploadingAvatar ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{user.name}</div>
                    <div className="text-sm text-muted-foreground">Member since Jan 2026 · {user.tier} tier</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-primary-soft px-2 py-1 font-semibold text-primary">⭐ {user.points} points</span>
                      <span className="rounded-full bg-success/15 px-2 py-1 font-semibold text-success">Verified</span>
                    </div>
                  </div>
                </div>
                {!editingProfile ? (
                  <button 
                    onClick={() => setEditingProfile(true)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary cursor-pointer"
                  >
                    Edit profile
                  </button>
                ) : null}
              </div>

              {editingProfile ? (
                <form onSubmit={handleSaveProfile} className="mt-8 space-y-4 max-w-xl">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Full Name</label>
                      <input 
                        type="text" 
                        value={user.name} 
                        disabled 
                        className="h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm text-muted-foreground outline-none cursor-not-allowed" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Email Address</label>
                      <input 
                        type="email" 
                        value={user.email} 
                        disabled 
                        className="h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm text-muted-foreground outline-none cursor-not-allowed" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Phone Number</label>
                      <input 
                        type="text" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Location Address</label>
                      <input 
                        type="text" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" 
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setEditingProfile(false)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    { i: User, l: "Full Name", v: user.name },
                    { i: Mail, l: "Email Address", v: user.email },
                    { i: Phone, l: "Phone Number", v: phone || "Not set" },
                    { i: MapPin, l: "Address", v: address },
                  ].map((f) => (
                    <div key={f.l} className="rounded-xl border border-border p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><f.i className="h-3.5 w-3.5" /> {f.l}</div>
                      <div className="mt-1 font-semibold">{f.v}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 2: MY VEHICLES */}
          {activeTab === "vehicles" && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">My Vehicles</h3>
                  <p className="text-xs text-muted-foreground">Manage your vehicle profiles for speedier booking checkpoints.</p>
                </div>
                {!showAddVehicle && (
                  <button 
                    onClick={() => setShowAddVehicle(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add vehicle
                  </button>
                )}
              </div>

              {showAddVehicle && (
                <form onSubmit={handleAddVehicle} className="mt-4 border border-border/80 rounded-xl p-4 bg-secondary/20 max-w-md space-y-3">
                  <h4 className="font-semibold text-sm">Register Vehicle Details</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">Plate Number</label>
                      <input 
                        type="text" 
                        value={newPlate} 
                        onChange={(e) => setNewPlate(e.target.value)} 
                        placeholder="e.g. BA 2 PA 9988"
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">Make & Model</label>
                      <input 
                        type="text" 
                        value={newModel} 
                        onChange={(e) => setNewModel(e.target.value)} 
                        placeholder="e.g. Suzuki Swift · 2021"
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button 
                      type="button" 
                      onClick={() => setShowAddVehicle(false)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 cursor-pointer"
                    >
                      Save Vehicle
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {vehicles.length === 0 ? (
                  <div className="col-span-2 text-center p-8 text-muted-foreground border border-dashed rounded-xl">
                    No vehicles registered in your garage yet.
                  </div>
                ) : (
                  vehicles.map((v) => (
                    <div key={v.n} className="flex items-center gap-4 rounded-xl border border-border p-4 bg-card">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><Car className="h-6 w-6" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-semibold">
                          {v.n} {v.primary && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">Primary</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{v.m}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteVehicleClick(v.n)}
                        className="rounded-lg border border-border p-2 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === "security" && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold">Security</h3>
                <p className="text-xs text-muted-foreground">Manage password configurations, authenticators, and session keys.</p>
              </div>
              <div className="space-y-3">
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
          )}
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

      <ConfirmationModal
        isOpen={isDeleteVehicleConfirmOpen}
        title="Remove Vehicle"
        description={`Are you sure you want to remove the vehicle "${vehicleToDelete}" from your garage?`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={confirmDeleteVehicle}
        onCancel={() => setIsDeleteVehicleConfirmOpen(false)}
        icon={Trash2}
        variant="danger"
      />
    </AppShell>
  );
}
