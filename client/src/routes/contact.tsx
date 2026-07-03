import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, ChevronDown, Headphones, Mail, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { faqs } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact Us — AutoCare Nepal" }] }),
  component: Contact,
});

function Contact() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <AppShell>
      <PageHeader title="Contact Us" subtitle="We're here to help! Reach out to us through any of the following options." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { icon: MessageCircle, tone: "bg-primary-soft text-primary", title: "Chat with Support", desc: "Get instant help from our support team.", bullets: ["Instant responses", "Available 24/7", "For all your queries"], cta: "Start Chat", to: "/chat", primary: true },
            { icon: Mail, tone: "bg-info/15 text-info", title: "Email Us", desc: "Drop us an email and we'll get back to you.", bullets: ["support@autocare.np", "We reply within 24 hours", "For detailed support"], cta: "Send Email", to: "/contact", primary: false },
            { icon: Phone, tone: "bg-success/15 text-success", title: "Call Us", desc: "Speak directly with our support team.", bullets: ["+977 980-1234567", "Mon - Sun: 8:00 AM - 8:00 PM", "For urgent support"], cta: "Call Now", to: "/contact", primary: false },
          ].map((c) => (
            <div key={c.title} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className={cn("grid h-14 w-14 place-items-center rounded-2xl", c.tone)}><c.icon className="h-7 w-7" /></div>
                <div>
                  <div className="text-lg font-bold">{c.title}</div>
                  <div className="text-sm text-muted-foreground">{c.desc}</div>
                </div>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {c.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-success text-[10px] text-success-foreground">✓</span>{b}</li>
                ))}
              </ul>
              <Link to={c.to as any} className={cn("mt-6 inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold",
                c.primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-primary text-primary hover:bg-primary-soft"
              )}>
                <c.icon className="h-4 w-4" /> {c.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold">Frequently Asked Questions</div>
                <div className="text-sm text-muted-foreground">Find quick answers to common questions</div>
              </div>
              <Link to="/contact" className="hidden items-center gap-1.5 text-sm font-semibold text-primary sm:inline-flex">View All FAQs <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-5 space-y-2">
              {faqs.map((f, i) => (
                <div key={f.q} className="rounded-xl border border-border">
                  <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold">
                    {f.q}
                    <ChevronDown className={cn("h-4 w-4 transition-transform", open === i && "rotate-180")} />
                  </button>
                  {open === i && <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{f.a}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold">Support Hours</div>
            <ul className="mt-5 space-y-4 text-sm">
              {[
                ["Monday - Friday", "8:00 AM - 8:00 PM"],
                ["Saturday", "9:00 AM - 6:00 PM"],
                ["Sunday", "9:00 AM - 4:00 PM"],
                ["Public Holidays", "9:00 AM - 4:00 PM"],
              ].map(([d, h]) => (
                <li key={d} className="flex items-center justify-between border-b border-border pb-3 last:border-none">
                  <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {d}</span>
                  <span className="font-semibold">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-primary/20 bg-primary-soft/60 p-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck className="h-7 w-7" /></div>
          <div className="flex-1">
            <div className="text-lg font-bold">We're Here for You!</div>
            <div className="text-sm text-muted-foreground">Your satisfaction is our priority. If you have any queries or need assistance, don't hesitate to reach out to us.</div>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-info/15 text-info"><Headphones className="h-7 w-7" /></div>
        </div>
      </div>
    </AppShell>
  );
}
