import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Building2, Clock, Mail, MapPin, Phone, Upload, Users, Save, Trash, Edit2, Locate, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { getWorkshopDetails, updateWorkshopDetails } from "@/lib/db-server";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { useGeolocation } from "@/hooks/use-geolocation";

export const Route = createFileRoute("/admin/workshop")({
  beforeLoad: ({ context }) => {
    if (!context.user || (context.user.role !== "Admin")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getWorkshopDetails(),
  head: () => ({ meta: [{ title: "Workshop — Admin" }] }),
  component: Workshop,
});

function Workshop() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const [ws, setWs] = useState<any>(initial || {
    name: "AutoCare Service Center",
    registrationNo: "AC-NP-2018-1042",
    owner: "Rohit Karki",
    manager: "Sabin Karki",
    phone: "+977 980-1234567",
    email: "support@autocare.np",
    address: "Pulchowk, Lalitpur, Nepal",
    city: "Lalitpur",
    workingHours: {},
    team: [],
    baysCount: 12
  });

  const [saving, setSaving] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editMemberIndex, setEditMemberIndex] = useState<number | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);
  const [newMember, setNewMember] = useState({ name: "", role: "", phone: "", email: "", avatar: "" });

  const handleFieldChange = (key: string, value: any) => {
    setWs((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleAutoSave = async (key: string, value: any) => {
    const updatedWs = { ...ws, [key]: value };
    setWs(updatedWs);
    try {
      await updateWorkshopDetails(updatedWs);
      toast.success("Saved automatically.", { position: "bottom-right", duration: 2000 });
      router.invalidate();
    } catch (err) {
      toast.error("Failed to auto-save.");
    }
  };

  const handleSaveMember = () => {
    if (!newMember.name) return toast.error("Name is required");
    const newTeam = [...(ws.team || [])];
    
    if (editMemberIndex !== null) {
      newTeam[editMemberIndex] = { ...newTeam[editMemberIndex], ...newMember };
    } else {
      const id = "M-" + Date.now();
      newTeam.push({ id, ...newMember });
    }
    
    handleAutoSave("team", newTeam);
    setIsMemberModalOpen(false);
    setNewMember({ name: "", role: "", phone: "", email: "", avatar: "" });
  };

  const confirmDeleteMember = () => {
    if (memberToDelete === null) return;
    const newTeam = ws.team.filter((_: any, idx: number) => idx !== memberToDelete);
    handleAutoSave("team", newTeam);
    setMemberToDelete(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateWorkshopDetails(ws);
      if (res.success) {
        toast.success("Workshop configuration updated successfully.");
        router.invalidate();
      } else {
        toast.error(res.error || "Failed to update configuration.");
      }
    } catch {
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const workingHours = ws.workingHours || {};
  const team = ws.team || [];
  const baysCount = ws.baysCount || 12;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Workshop</h1>
          <p className="text-sm text-muted-foreground">Manage workshop details, staff and working hours.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><Building2 className="h-8 w-8" /></div>
              <div className="flex-1">
                <div className="text-xl font-bold">{ws.name}</div>
                <div className="text-sm text-muted-foreground">Flagship workshop · {baysCount} bays · {team.length} staff</div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Workshop name" value={ws.name} onChange={(v) => handleFieldChange("name", v)} />
              <Field label="Registration no." value={ws.registrationNo} onChange={(v) => handleFieldChange("registrationNo", v)} />
              <Field label="Owner" value={ws.owner} onChange={(v) => handleFieldChange("owner", v)} />
              <Field label="Manager" value={ws.manager} onChange={(v) => handleFieldChange("manager", v)} />
              <Field label="Phone" value={ws.phone} icon={Phone} onChange={(v) => handleFieldChange("phone", v)} />
              <Field label="Email" value={ws.email} icon={Mail} onChange={(v) => handleFieldChange("email", v)} />
              <Field label="Address" value={ws.address} icon={MapPin} onChange={(v) => handleFieldChange("address", v)} onLocationFetch={(loc) => { handleFieldChange("address", loc.address); if (loc.city) handleFieldChange("city", loc.city); }} />
              <Field label="City" value={ws.city} onChange={(v) => handleFieldChange("city", v)} />
            </div>

            <div className="mt-8 pt-6 border-t border-border flex justify-center">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" /> {saving ? "Saving Configuration..." : "Save Configuration"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold mb-4">Working hours</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {days.map((d) => (
                <div key={d} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span className="font-semibold">{d}</span></div>
                  <input
                    value={workingHours[d] || (d === "Sunday" ? "9:00 AM - 4:00 PM" : "8:00 AM - 8:00 PM")}
                    onChange={(e) => {
                      const updated = { ...workingHours, [d]: e.target.value };
                      handleFieldChange("workingHours", updated);
                    }}
                    onBlur={(e) => {
                      const updated = { ...workingHours, [d]: e.target.value };
                      handleAutoSave("workingHours", updated);
                    }}
                    className="w-40 border-b border-transparent text-right text-muted-foreground outline-none focus:border-primary focus:text-foreground"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-bold"><Users className="h-5 w-5 text-primary" /> Team</div>
              <button 
                onClick={() => {
                  setNewMember({ name: "", role: "", phone: "", email: "", avatar: "" });
                  setEditMemberIndex(null);
                  setIsMemberModalOpen(true);
                }}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer bg-primary/10 px-3 py-1.5 rounded-full"
              >
                + Add Member
              </button>
            </div>
            <div className="mt-4 divide-y divide-border">
              {team.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">No staff members assigned.</div>
              ) : (
                team.map((m: any, i: number) => (
                  <div key={m.id || i} className="group relative rounded-xl border border-border/40 p-3 hover:border-border hover:bg-card/50 transition-colors shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-sm font-bold text-primary border border-primary/10">
                        {m.avatar ? <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" /> : (m.name?.[0] || "?")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{m.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {m.role || "No role"}
                        </div>
                        <div className="text-[11px] text-muted-foreground/70 mt-1 truncate flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> {m.phone || "N/A"} <span className="opacity-50 mx-1">•</span> <Mail className="h-3 w-3" /> {m.email || "N/A"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => {
                            setNewMember(m);
                            setEditMemberIndex(i);
                            setIsMemberModalOpen(true);
                          }}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                          title="Edit member"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setMemberToDelete(i)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                          title="Remove member"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold">Bays & Capacity</div>
            <div className="mt-2 text-sm text-muted-foreground">Configure the maximum number of vehicles your workshop can service concurrently.</div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 max-w-[200px]">
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Total Service Bays</label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <input
                    type="number"
                    min="1"
                    value={ws.baysCount}
                    onChange={(e) => handleFieldChange("baysCount", parseInt(e.target.value) || 1)}
                    onBlur={(e) => handleAutoSave("baysCount", parseInt(e.target.value) || 1)}
                    className="h-11 w-full bg-transparent text-sm font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {isMemberModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated">
            <h3 className="text-xl font-bold mb-4">{editMemberIndex !== null ? "Edit Team Member" : "Add Team Member"}</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Full Name</span>
                <input
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. Ramesh KC"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Role / Specialty</span>
                <input
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. Senior Technician"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Phone Number</span>
                  <input
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="e.g. 9801234567"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Email Address</span>
                  <input
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="e.g. ramesh@autocare.np"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Profile Picture</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewMember({ ...newMember, avatar: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-soft file:text-primary hover:file:bg-primary/20 outline-none"
                />
              </label>
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <button 
                onClick={() => setIsMemberModalOpen(false)}
                className="rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-accent"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMember}
                className="rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {editMemberIndex !== null ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={memberToDelete !== null}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${memberToDelete !== null && team[memberToDelete] ? team[memberToDelete].name : 'this member'}? This action cannot be undone.`}
        confirmText="Remove Member"
        variant="danger"
        onConfirm={confirmDeleteMember}
        onCancel={() => setMemberToDelete(null)}
      />
    </AdminShell>
  );
}

function Field({ label, value, icon: Icon, onChange, onLocationFetch }: { label: string; value: string; icon?: any; onChange: (v: string) => void; onLocationFetch?: (loc: any) => void }) {
  const { loading: geoLoading, fetchLocation } = useGeolocation();
  const isAddress = label === "Address";

  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="relative mt-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <input
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 flex-1 bg-transparent text-sm outline-none"
        />
        {isAddress && (
          <button
            type="button"
            onClick={async () => {
              const loc = await fetchLocation();
              if (loc?.address) {
                if (onLocationFetch) onLocationFetch(loc);
                else onChange(loc.address);
              }
            }}
            disabled={geoLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
            title="Use Current Location"
          >
            {geoLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Locate className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}
