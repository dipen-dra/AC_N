import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Car, Plus, Trash2, Key } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { addVehicle, removeVehicle, editVehicle } from "@/lib/auth-server";

export const Route = createFileRoute("/profile/vehicles")({
  component: ProfileVehicles,
});

function ProfileVehicles() {
  const { user } = Route.useRouteContext() as any;
  const router = useRouter();

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehiclePlate, setEditingVehiclePlate] = useState<string | null>(null);
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteVehicleConfirmOpen, setIsDeleteVehicleConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  if (!user) return null;
  const vehicles = user.vehicles || [];

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newModel) {
      toast.error("Please enter both registration plate and make/model.");
      return;
    }
    setIsSaving(true);
    let res;
    if (editingVehiclePlate) {
      res = await editVehicle(editingVehiclePlate, newPlate, newModel);
    } else {
      res = await addVehicle(newPlate, newModel);
    }
    
    if (res.success) {
      toast.success(editingVehiclePlate ? `Vehicle updated successfully.` : `Vehicle ${newPlate} added to your garage.`);
      setNewPlate("");
      setNewModel("");
      setShowAddVehicle(false);
      setEditingVehiclePlate(null);
      router.invalidate();
    } else {
      toast.error(res.error || (editingVehiclePlate ? "Failed to update vehicle." : "Failed to add vehicle."));
    }
    setIsSaving(false);
  };

  const handleEditClick = (v: any) => {
    setEditingVehiclePlate(v.plate);
    setNewPlate(v.plate);
    setNewModel(v.model);
    setShowAddVehicle(true);
  };

  const handleDeleteVehicleClick = (plate: string) => {
    setVehicleToDelete(plate);
    setIsDeleteVehicleConfirmOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (vehicleToDelete) {
      const res = await removeVehicle(vehicleToDelete);
      if (res.success) {
        toast.success(`Vehicle ${vehicleToDelete} removed successfully.`);
        setVehicleToDelete(null);
        router.invalidate();
      } else {
        toast.error(res.error || "Failed to remove vehicle.");
      }
    }
    setIsDeleteVehicleConfirmOpen(false);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-8 shadow-elevated backdrop-blur-xl transition-all">
      <div className="absolute -right-20 -bottom-20 -z-10 h-64 w-64 rounded-full bg-accent/40 blur-3xl" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Your Garage</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage the vehicles you bring in for service.</p>
        </div>
        <button 
          onClick={() => {
            setEditingVehiclePlate(null);
            setNewPlate("");
            setNewModel("");
            setShowAddVehicle(!showAddVehicle);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 active:scale-95"
        >
          {showAddVehicle ? "Cancel" : <><Plus className="h-4 w-4" /> Add Vehicle</>}
        </button>
      </div>

      {showAddVehicle && (
        <form onSubmit={handleAddVehicle} className="mb-8 animate-in slide-in-from-top-4 fade-in overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 text-primary">
              <Car className="h-4 w-4" />
            </div>
            {editingVehiclePlate ? "Edit Vehicle" : "Add a New Vehicle"}
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plate Number</label>
              <input 
                type="text" 
                value={newPlate} 
                onChange={(e) => setNewPlate(e.target.value)} 
                placeholder="e.g. BA 2 PA 9988"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Make & Model</label>
              <input 
                type="text" 
                value={newModel} 
                onChange={(e) => setNewModel(e.target.value)} 
                placeholder="e.g. Suzuki Swift · 2021"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-primary/10">
            <button 
              type="button" 
              onClick={() => {
                setShowAddVehicle(false);
                setEditingVehiclePlate(null);
                setNewPlate("");
                setNewModel("");
              }}
              className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent focus:ring-2 focus:ring-border"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 disabled:opacity-70"
            >
              {isSaving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" /> : "Save Vehicle"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {vehicles.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-background/30 py-16 px-4 text-center backdrop-blur-sm">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary/80 text-muted-foreground mb-4">
              <Car className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold">Your garage is empty</h4>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Add your vehicles to make booking services faster and keep track of maintenance history.
            </p>
          </div>
        ) : (
          vehicles.map((v: any, index: number) => (
            <div 
              key={v.plate} 
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background p-1 transition-all hover:border-primary/30 hover:shadow-elevated"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex items-center justify-between p-4 bg-card rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Car className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold tracking-tight text-foreground">{v.plate}</h4>
                      {v.primary && (
                        <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success">
                          <Key className="h-3 w-3" /> Primary
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{v.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(v)}
                    className="grid h-10 px-3 place-items-center text-xs font-semibold rounded-xl border border-transparent text-primary transition-all hover:border-primary/20 hover:bg-primary/10 active:scale-95"
                    title="Edit vehicle"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVehicleClick(v.plate)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-transparent text-muted-foreground transition-all hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive active:scale-95"
                    title="Remove vehicle"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteVehicleConfirmOpen}
        title="Remove Vehicle"
        description={`Are you sure you want to remove the vehicle "${vehicleToDelete}" from your garage? This cannot be undone.`}
        confirmText="Remove Vehicle"
        cancelText="Cancel"
        onConfirm={confirmDeleteVehicle}
        onCancel={() => setIsDeleteVehicleConfirmOpen(false)}
        icon={Trash2}
        variant="danger"
      />
    </section>
  );
}
