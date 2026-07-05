import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, Search, ShieldCheck, Star, Wrench, Droplet, Disc, Cog, Snowflake, Sparkles, Check } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { getServices } from "@/lib/db-server";

export const Route = createFileRoute("/services")({
  loader: () => getServices(),
  head: () => ({ meta: [{ title: "Services — AutoCare Nepal" }, { name: "description", content: "Browse car services with transparent pricing." }] }),
  component: Services,
});

const iconMap: Record<string, any> = { wrench: Wrench, droplet: Droplet, disc: Disc, cog: Cog, snowflake: Snowflake, sparkles: Sparkles };

function Services() {
  const initialServices = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Popular");

  const services = useMemo(() => {
    let filtered = initialServices.filter((s: any) => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.desc.toLowerCase().includes(search.toLowerCase())
    );
    return filtered.sort((a: any, b: any) => {
      if (sort === "Price low → high") return a.price - b.price;
      if (sort === "Price high → low") return b.price - a.price;
      if (sort === "Rating") return b.rating - a.rating;
      return 0;
    });
  }, [initialServices, search, sort]);

  return (
    <AppShell>
      <PageHeader title="Choose the Right Service for Your Vehicle" subtitle="Professional care for your vehicle. Transparent pricing, trusted by thousands." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
              <MapPin className="h-4 w-4 text-primary" /> Lalitpur, Nepal
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                placeholder="Search services..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-72 rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary" 
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort by:</span>
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium outline-none focus:border-primary"
            >
              <option>Popular</option><option>Price low → high</option><option>Price high → low</option><option>Rating</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {services.map((s: any) => {
            const Icon = iconMap[s.icon] ?? Wrench;
            return (
              <div key={s.id} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-elevated">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary"><Icon className="h-7 w-7" /></div>
                  <div className="flex-1">
                    <div className="text-lg font-bold">{s.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {s.rating} ({s.reviews} Reviews)
                    </div>
                    <div className="mt-2 text-lg font-extrabold text-primary">Rs. {s.price.toLocaleString()}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {s.duration}</div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{s.desc}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
                  {s.features.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-foreground/80"><Check className="h-3.5 w-3.5 text-success" /> {f}</div>
                  ))}
                </div>
                <Link to="/book" className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  Book Now
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-center gap-4 rounded-2xl border border-border bg-primary-soft/60 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <div className="font-bold">100% Satisfaction Guarantee</div>
            <div className="text-sm text-muted-foreground">We use genuine parts and advanced equipment for your vehicle.</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
