import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, Clock, PlayCircle, Shield, ShieldCheck, Sparkles, Star, Truck, Wrench, Droplet, Disc, Cog, Snowflake, Headphones, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getServices } from "@/lib/db-server";
import heroCar from "@/assets/hero-car.jpg";

export const Route = createFileRoute("/")({
  loader: () => getServices(),
  component: Home,
});

const iconMap: Record<string, any> = { wrench: Wrench, droplet: Droplet, disc: Disc, cog: Cog, snowflake: Snowflake, sparkles: Sparkles };

function Home() {
  const services = Route.useLoaderData();
  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-soft/60 via-background to-background" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Nepal's #1 rated car care platform
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Reliable <span className="text-gradient-brand">Car Care</span><br /> You Can Trust
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Professional care for your vehicle. Transparent pricing, certified experts and doorstep pickup — trusted by thousands across Kathmandu, Lalitpur & Bhaktapur.
            </p>
            <div className="mt-8 grid max-w-md grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { i: Shield, l: "Trusted Experts" },
                { i: Clock, l: "Transparent Pricing" },
                { i: Truck, l: "Pick-up & Drop" },
                { i: Award, l: "Quality Service" },
              ].map((f) => (
                <div key={f.l} className="text-center">
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><f.i className="h-5 w-5" /></div>
                  <div className="mt-2 text-[11px] font-medium text-muted-foreground">{f.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/book" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
                Book a Service <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-semibold hover:bg-accent">
                <PlayCircle className="h-4 w-4 text-primary" /> How It Works
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 blur-2xl" />
            <img src={heroCar} alt="AutoCare service center with a red car" width={1600} height={1100} className="w-full rounded-3xl shadow-elevated" />
            <div className="absolute -bottom-6 -left-6 hidden max-w-[220px] rounded-2xl border border-border bg-card p-4 shadow-elevated sm:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm font-bold">100% Safe & Secure</div>
                  <div className="text-xs text-muted-foreground">Your vehicle is in safe hands.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Our Services</div>
            <h2 className="mt-1 text-3xl font-extrabold sm:text-4xl">Everything your car needs</h2>
          </div>
          <Link to="/services" className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:inline-flex">
            View all services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {services.map((s) => {
            const Icon = iconMap[s.icon] ?? Wrench;
            return (
              <Link key={s.id} to="/book" className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="h-6 w-6" /></div>
                <div className="mt-4 font-semibold">{s.name}</div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.desc}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-bold text-primary">Rs. {s.price.toLocaleString()}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-warning text-warning" /> {s.rating}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-secondary/50 p-6 sm:p-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { i: Truck, t: "Pick-up & Drop", d: "We pick up your vehicle and drop it back.", tone: "bg-primary-soft text-primary" },
              { i: Shield, t: "Genuine Parts", d: "We use only genuine parts for your vehicle.", tone: "bg-success/15 text-success" },
              { i: Clock, t: "On-time Delivery", d: "We value your time and deliver on time.", tone: "bg-warning/20 text-warning-foreground" },
              { i: Headphones, t: "24/7 Support", d: "Our support team is always here to help you.", tone: "bg-info/15 text-info" },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-4">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${f.tone}`}><f.i className="h-6 w-6" /></div>
                <div>
                  <div className="font-semibold">{f.t}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-8 sm:grid-cols-4">
          {[
            { v: "10K+", l: "Happy Customers", tone: "bg-primary-soft text-primary" },
            { v: "50K+", l: "Services Completed", tone: "bg-success/15 text-success" },
            { v: "4.8", l: "Average Rating", tone: "bg-warning/20 text-warning-foreground" },
            { v: "100%", l: "Satisfaction Guarantee", tone: "bg-info/15 text-info" },
          ].map((s) => (
            <div key={s.l} className="flex items-center gap-4">
              <div className={`grid h-14 w-14 place-items-center rounded-2xl ${s.tone}`}><CheckCircle2 className="h-7 w-7" /></div>
              <div>
                <div className="text-3xl font-extrabold">{s.v}</div>
                <div className="text-sm text-muted-foreground">{s.l}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-brand p-10 text-primary-foreground shadow-elevated sm:p-14">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <h3 className="text-3xl font-extrabold sm:text-4xl">Ready to service your car?</h3>
              <p className="mt-3 max-w-xl text-primary-foreground/85">Book in 60 seconds, we handle the rest. Enjoy free pick-up & drop across Kathmandu valley.</p>
            </div>
            <Link to="/book" className="inline-flex w-fit items-center gap-2 rounded-xl bg-background px-6 py-3.5 text-sm font-semibold text-foreground shadow-elevated hover:bg-accent">
              Book Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
