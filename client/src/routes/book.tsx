import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Building2, Calendar, Car, Check, CheckCircle2, Clock, MapPin, ShieldCheck, Truck, Wrench, Locate, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { getServices, getWorkshopDetails, createBooking, getBookedSlots, validatePromo } from "@/lib/db-server";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-geolocation";

export const Route = createFileRoute("/book")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async () => {
    const [services, workshop] = await Promise.all([getServices(), getWorkshopDetails()]);
    return { services, workshop };
  },
  head: () => ({ meta: [{ title: "Book Service — AutoCare Nepal" }] }),
  component: Book,
});

const steps = ["Service Details", "Vehicle & Location", "Pick-up & Drop", "Confirm Booking"];
const slots = ["10:00 AM - 12:00 PM", "12:00 PM - 02:00 PM", "04:00 PM - 06:00 PM", "06:00 PM - 08:00 PM"];

function Book() {
  const nav = useNavigate();
  const { services, workshop } = Route.useLoaderData();
  const team = workshop?.team || [];
  
  const { loading: geoLoading, fetchLocation } = useGeolocation();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(services[0]?.id || "");
  const [pickup, setPickup] = useState("pickup");
  const [slot, setSlot] = useState(slots[0]);
  const [technician, setTechnician] = useState("Any Available Mechanic");
  const [pay, setPay] = useState<"esewa" | "khalti" | "card" | "cod">("esewa");


  const { user } = Route.useRouteContext() as any;
  const vehicles = user?.vehicles || [];
  const primaryVehicle = vehicles.find((v: any) => v.primary) || vehicles[0];

  // Form Fields State
  const [vehicleNumber, setVehicleNumber] = useState(primaryVehicle?.plate || "");
  const [model, setModel] = useState(primaryVehicle?.model || "");
  const [address, setAddress] = useState(user?.address || "");
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Promo Code States
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string, name: string, discountAmount: number, isPercentage: boolean } | null>(null);

  useEffect(() => {
    async function fetchBooked() {
      const booked = await getBookedSlots(pickupDate, technician);
      setBookedSlots(booked);
      // Auto-select a different slot if the current one is booked
      if (booked.includes(slot)) {
        const firstAvail = slots.find(s => !booked.includes(s));
        if (firstAvail) setSlot(firstAvail);
      }
    }
    fetchBooked();
  }, [pickupDate, technician]);

  const svc = services.find((s: any) => s.id === selected) || services[0];
  if (!svc) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
          <p className="text-lg text-muted-foreground">No services available. Please try again later.</p>
        </div>
      </AppShell>
    );
  }

  const pickupFee = pickup === "pickup" ? 0 : 0;
  let finalTotal = svc.price + pickupFee;
  if (appliedPromo) {
    if (appliedPromo.isPercentage) {
      finalTotal = finalTotal - (finalTotal * (appliedPromo.discountAmount / 100));
    } else {
      finalTotal = finalTotal - appliedPromo.discountAmount;
    }
    if (finalTotal < 0) finalTotal = 0;
  }

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoError("");
    setPromoLoading(true);
    try {
      const res = await validatePromo(promoCode);
      if (res.success && res.promo) {
        setAppliedPromo(res.promo);
        toast.success(`Promo code applied: ${res.promo.name}`);
      } else {
        setPromoError(res.error || "Invalid promo code");
      }
    } catch {
      setPromoError("Something went wrong");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    try {
      const result = await createBooking({
        data: {
          serviceId: svc.id,
          serviceName: svc.name,
          serviceDesc: svc.desc || "",
          vehicle: `${vehicleNumber} (${model})`,
          date: pickupDate,
          time: slot,
          location: address,
          price: finalTotal,
          technician: technician,
          promoCode: appliedPromo?.code || undefined,
        },
      });

      if (result.success) {
        toast.success("Booking confirmed!");
        nav({
          to: "/payment-success",
          search: {
            bookingId: result.bookingId,
            amount: String(finalTotal),
            paymentMethod: pay === "esewa" ? "eSewa" : pay === "khalti" ? "Khalti" : pay === "card" ? "Card" : "Cash on Delivery",
          },
        });
      } else {
        toast.error(result.error || "Booking failed.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link to="/services" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Services
        </Link>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="text-3xl font-extrabold">Book Service</h1>
            <p className="mt-1 text-sm text-muted-foreground">Fill in the details below to book your service.</p>
          </div>
          <ol className="flex flex-wrap items-center gap-3 sm:gap-6">
            {steps.map((label, i) => (
              <li key={label} className="flex items-center gap-3">
                <div className={cn("grid h-8 w-8 place-items-center rounded-full text-sm font-bold",
                  i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <div className={cn("text-xs font-semibold", i === step ? "text-primary" : "text-muted-foreground")}>{label}</div>
                {i < steps.length - 1 && <div className="hidden h-px w-8 bg-border sm:block" />}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-border bg-card p-6">
            {step === 0 && (
              <div className="space-y-6">
                <SectionTitle icon={Car} title="Vehicle Details" desc="Enter your vehicle information" />
                {vehicles.length > 0 && (
                  <div className="mb-2">
                    <Field label="Select from your garage">
                      <select 
                        onChange={(e) => {
                          const v = vehicles.find((veh: any) => veh.plate === e.target.value);
                          if (v) {
                            setVehicleNumber(v.plate);
                            setModel(v.model);
                          } else {
                            setVehicleNumber("");
                            setModel("");
                          }
                        }}
                        className="flex h-12 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="">Enter manually...</option>
                        {vehicles.map((v: any) => (
                          <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Vehicle Number">
                    <input 
                      value={vehicleNumber} 
                      onChange={(e) => setVehicleNumber(e.target.value)} 
                      placeholder="e.g. BA 1 PA 1234"
                      className="flex h-12 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </Field>
                  <Field label="Brand / Model">
                    <input 
                      value={model} 
                      onChange={(e) => setModel(e.target.value)} 
                      placeholder="e.g. Toyota Corolla"
                      className="flex h-12 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </Field>
                </div>
                <SectionTitle icon={Wrench} title="Service Details" desc="You have selected the service" />
                <div className="space-y-2">
                  {services.map((s: any) => (
                    <button key={s.id} onClick={() => setSelected(s.id)} className={cn(
                      "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all",
                      selected === s.id ? "border-primary bg-primary-soft/60" : "border-border hover:border-primary/40"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary"><Wrench className="h-5 w-5" /></div>
                        <div>
                          <div className="font-semibold">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.desc}</div>
                        </div>
                      </div>
                      <div className="font-bold text-primary">Rs. {s.price.toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <SectionTitle icon={MapPin} title="Pick-up Location" desc="Where should we pick up your vehicle?" />
                <Field label="Full address">
                  <div className="relative">
                    <input 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      placeholder="e.g. 123 Main Street, Kathmandu"
                      className="flex h-12 w-full rounded-xl border border-border bg-background px-4 py-2 pr-12 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const loc = await fetchLocation();
                        if (loc?.address) setAddress(loc.address);
                      }}
                      disabled={geoLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
                      title="Use Current Location"
                    >
                      {geoLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Locate className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <SectionTitle icon={Calendar} title="Date & Mechanic" desc="Choose your preferred date, time, and mechanic" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pick-up Date">
                    <input 
                      type="date" 
                      value={pickupDate} 
                      onChange={(e) => setPickupDate(e.target.value)} 
                      className="flex h-12 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                  </Field>
                  <Field label="Preferred Mechanic">
                    <select 
                      value={technician} 
                      onChange={(e) => setTechnician(e.target.value)} 
                      className="flex h-12 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="Any Available Mechanic">Any Available Mechanic</option>
                      {team.map((m: any) => (
                        <option key={m.id || m.name} value={m.name}>{m.name} ({m.role || "Technician"})</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Preferred Time Slot">
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {slots.map((s) => {
                      const isBooked = bookedSlots.includes(s);
                      return (
                        <button 
                          key={s} 
                          disabled={isBooked}
                          onClick={() => setSlot(s)} 
                          className={cn(
                            "rounded-lg border py-3 text-sm font-semibold transition-colors", 
                            isBooked ? "border-border bg-secondary/30 text-muted-foreground/50 cursor-not-allowed opacity-50" :
                            slot === s ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-primary/40"
                          )}
                        >
                          {s} {isBooked ? "(Booked)" : slot === s && <CheckCircle2 className="ml-2 inline h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <SectionTitle icon={Truck} title="Pick-up & Drop" desc="Choose how you'd like your vehicle to reach us" />
                <button onClick={() => setPickup("pickup")} className={cn("flex w-full items-center gap-4 rounded-xl border p-4 text-left", pickup === "pickup" ? "border-primary bg-primary-soft/60" : "border-border")}>
                  <span className={cn("grid h-5 w-5 place-items-center rounded-full border-2", pickup === "pickup" ? "border-primary" : "border-border")}>
                    {pickup === "pickup" && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><Truck className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="font-semibold">Pick-up from my location</div>
                    <div className="text-xs text-muted-foreground">We will pick up your vehicle from the location you provide.</div>
                  </div>
                  <div className="text-sm font-semibold text-success">Free</div>
                </button>
                <button onClick={() => setPickup("center")} className={cn("flex w-full items-center gap-4 rounded-xl border p-4 text-left", pickup === "center" ? "border-primary bg-primary-soft/60" : "border-border")}>
                  <span className={cn("grid h-5 w-5 place-items-center rounded-full border-2", pickup === "center" ? "border-primary" : "border-border")}>
                    {pickup === "center" && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-foreground"><Building2 className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="font-semibold">Drop at Service Center</div>
                    <div className="text-xs text-muted-foreground">You will drop your vehicle at our service center.</div>
                  </div>
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <SectionTitle icon={ShieldCheck} title="Payment Method" desc="All payments are secure and encrypted" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { id: "esewa", label: "eSewa", desc: "Pay instantly with your eSewa wallet", badge: "Popular" },
                    { id: "khalti", label: "Khalti", desc: "Pay via Khalti wallet or bank" },
                    { id: "card", label: "Debit / Credit Card", desc: "Visa, Mastercard, Amex" },
                    { id: "cod", label: "Cash on Delivery", desc: "Pay when the vehicle is delivered" },
                  ].map((p) => (
                    <button key={p.id} onClick={() => setPay(p.id as any)} className={cn(
                      "rounded-xl border p-4 text-left transition-all", pay === p.id ? "border-primary bg-primary-soft/60" : "border-border hover:border-primary/40"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{p.label}</div>
                        {p.badge && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{p.badge}</span>}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{p.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-success" /> Your details are safe and secure with us. This site is protected by 256-bit SSL encryption.
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
                Back
              </button>
              {step < steps.length - 1 ? (
                <button onClick={() => setStep(step + 1)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {bookingLoading ? "Confirming..." : `Pay Rs. ${finalTotal.toLocaleString()} & Confirm`} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          <aside className="h-fit rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold">Booking Summary</div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-primary-soft/60 p-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Wrench className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="font-semibold">{svc.name}</div>
                <div className="text-xs text-muted-foreground">{svc.desc}</div>
              </div>
              <div className="font-bold text-primary">Rs. {svc.price.toLocaleString()}</div>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              {[
                { label: "Vehicle Number", value: vehicleNumber || "Not provided", icon: Car },
                { label: "Brand / Model", value: model || "Not provided", icon: CheckCircle2 },
                { label: "Pick-up Location", value: address || "Not provided", icon: MapPin },
                { label: "Date & Time", value: `${pickupDate || "Any date"} · ${slot || "Any time"}`, icon: Calendar },
                { label: "Pick-up Option", value: pickup === "pickup" ? "Pick-up from my location" : "Drop at Service Center", icon: Truck },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 rounded-lg bg-secondary/30 p-3">
                  <dt className="flex items-center gap-2 text-muted-foreground"><item.icon className="h-4 w-4 text-primary/70" /> {item.label}</dt>
                  <dd className="text-right font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo code (Optional)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={!!appliedPromo || promoLoading}
                  className="flex-1 h-10 rounded-lg border border-border bg-background px-3 outline-none focus:border-primary disabled:opacity-50"
                />
                <button 
                  onClick={handleApplyPromo}
                  disabled={!promoCode || !!appliedPromo || promoLoading}
                  className="h-10 rounded-lg bg-secondary px-4 font-semibold text-foreground disabled:opacity-50 hover:bg-secondary/80"
                >
                  {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : appliedPromo ? "Applied" : "Apply"}
                </button>
              </div>
              {promoError && <div className="text-xs text-destructive">{promoError}</div>}
              {appliedPromo && <div className="text-xs text-success font-semibold">✓ {appliedPromo.name} applied!</div>}
            </div>
            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><span>Service Charges</span><span className="font-medium">Rs. {svc.price.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Pick-up & Drop</span><span className="font-semibold text-success">Free</span></div>
              {appliedPromo && (
                <div className="flex justify-between text-success">
                  <span>Discount ({appliedPromo.name})</span>
                  <span className="font-semibold">
                    -{appliedPromo.isPercentage ? `${appliedPromo.discountAmount}%` : `Rs. ${appliedPromo.discountAmount.toLocaleString()}`}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-extrabold text-primary">Rs. {finalTotal.toLocaleString()}</div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-xs">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
              <div><b>Secure Booking.</b> Your details are safe and secure with us.</div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function SectionTitle({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>{children}</label>;
}
