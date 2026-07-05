import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Camera, MapPin, Mail, Phone, User, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadAvatar, updateProfile } from "@/lib/auth-server";

export const Route = createFileRoute("/profile/")({
  component: ProfileInfo,
});

function ProfileInfo() {
  const { user } = Route.useRouteContext() as any;
  const router = useRouter();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateProfile({ phone, address });
    if (res.success) {
      setEditingProfile(false);
      toast.success("Profile updated successfully!");
      router.invalidate();
    } else {
      toast.error(res.error || "Failed to update profile.");
    }
    setIsSaving(false);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-8 shadow-elevated backdrop-blur-xl transition-all">
      <div className="absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 -z-10 h-64 w-64 rounded-full bg-accent/50 blur-3xl" />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-brand opacity-0 blur transition duration-500 group-hover:opacity-30" />
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-background shadow-soft">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-secondary to-muted text-4xl font-bold text-foreground/50">
                  {user.initial}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-soft transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
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
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{user.name}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              Member since {new Date().getFullYear()}
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/50 px-3 py-1 shadow-sm">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-bold text-primary">{user.points.toLocaleString()} points</span>
              <span className="ml-1 rounded-md bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground/80 shadow-sm border border-border/50">{user.tier} Tier</span>
            </div>
          </div>
        </div>
        {!editingProfile && (
          <button 
            onClick={() => setEditingProfile(true)}
            className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:bg-accent hover:shadow focus:ring-2 focus:ring-primary/20"
          >
            Edit Profile
          </button>
        )}
      </div>

      {editingProfile ? (
        <form onSubmit={handleSaveProfile} className="mt-8 space-y-5 animate-in fade-in slide-in-from-bottom-2 max-w-2xl">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
              <input type="text" value={user.name} disabled className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-4 text-sm text-muted-foreground shadow-sm outline-none cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
              <input type="email" value={user.email} disabled className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-4 text-sm text-muted-foreground shadow-sm outline-none cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9800000000" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Kathmandu, Nepal" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button type="button" onClick={() => setEditingProfile(false)} className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent focus:ring-2 focus:ring-border">Cancel</button>
            <button type="submit" disabled={isSaving} className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 disabled:opacity-70">
              {isSaving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" /> : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 animate-in fade-in max-w-3xl">
          {[
            { i: User, l: "Full Name", v: user.name, placeholder: "Not provided" },
            { i: Mail, l: "Email Address", v: user.email, placeholder: "Not provided" },
            { i: Phone, l: "Phone Number", v: user.phone, placeholder: "Add your phone number" },
            { i: MapPin, l: "Address", v: user.address, placeholder: "Add your location" },
          ].map((f) => (
            <div key={f.l} className="group flex items-start gap-4 rounded-2xl border border-border/50 bg-background/50 p-5 transition-all hover:border-primary/20 hover:bg-background hover:shadow-soft">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.i className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{f.l}</p>
                {f.v ? (
                  <p className="mt-1 truncate font-semibold text-foreground">{f.v}</p>
                ) : (
                  <p className="mt-1 truncate text-sm italic text-muted-foreground">{f.placeholder}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
