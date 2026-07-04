import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, ChevronDown, Headphones, Mail, MessageCircle, Phone, ShieldCheck, Send, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { submitContact } from "@/lib/db-server";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "How do I book a service?", a: "Head to Book Service, select your vehicle, choose a service, and pick a date and time. Confirm and pay online or opt for cash." },
  { q: "How can I track my service?", a: "Every booking has a Track Service link that shows live status from booking to completion." },
  { q: "What payment methods do you accept?", a: "We accept eSewa, Khalti, all major cards, and cash on delivery at pickup." },
  { q: "How can I reschedule my booking?", a: "Open the booking from My Bookings and use the reschedule action, or chat with support." },
  { q: "Do you offer pickup and drop service?", a: "Yes, we offer free pickup and drop within the Kathmandu valley for all bookings." },
];

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact Us — AutoCare Nepal" }] }),
  component: Contact,
});

function Contact() {
  const { user } = Route.useRouteContext() as any;
  const [open, setOpen] = useState<number | null>(0);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSending(true);
    try {
      const res = await submitContact(form);
      if (res.success) {
        setSent(true);
        toast.success("Message sent! We'll get back to you within 24 hours.");
        setForm({ name: user?.name || "", email: user?.email || "", subject: "", message: "" });
      } else {
        toast.error(res.error || "Failed to send message.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Contact Us" subtitle="We're here to help! Reach out to us through any of the following options." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { icon: MessageCircle, tone: "bg-primary-soft text-primary", title: "Chat with Support", desc: "Get instant help from our support team.", bullets: ["Instant responses", "Available 24/7", "For all your queries"], cta: "Start Chat", to: "/chat", primary: true },
            { icon: Mail, tone: "bg-info/15 text-info", title: "Email Us", desc: "Drop us an email and we'll get back to you.", bullets: ["support@autocare.np", "We reply within 24 hours", "For detailed support"], cta: "Send Email", to: "#contact-form", primary: false },
            { icon: Phone, tone: "bg-success/15 text-success", title: "Call Us", desc: "Speak directly with our support team.", bullets: ["+977 980-1234567", "Mon - Sun: 8:00 AM - 8:00 PM", "For urgent support"], cta: "Call Now", to: "tel:+9779801234567", primary: false },
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

        {/* Contact Form */}
        <div id="contact-form" className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold mb-1">Send us a Message</div>
            <p className="text-sm text-muted-foreground mb-6">We'll respond within 24 hours.</p>
            {sent ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success"><CheckCircle className="h-8 w-8" /></div>
                <div className="text-lg font-bold">Message Sent!</div>
                <p className="text-sm text-muted-foreground">Thank you for reaching out. Our team will get back to you shortly.</p>
                <button onClick={() => setSent(false)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">Name *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">Email *</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">Subject *</label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                    <option value="">Select a subject</option>
                    <option>Booking Issue</option>
                    <option>Service Enquiry</option>
                    <option>Payment / Invoice</option>
                    <option>Complaint</option>
                    <option>General Query</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">Message *</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Describe your query in detail..." className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary resize-none" />
                </div>
                <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60 hover:bg-primary/90">
                  {sending ? "Sending..." : <><Send className="h-4 w-4" /> Send Message</>}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-lg font-bold">Support Hours</div>
              <ul className="mt-5 space-y-4 text-sm">
                {[["Monday - Friday", "8:00 AM - 8:00 PM"], ["Saturday", "9:00 AM - 6:00 PM"], ["Sunday", "9:00 AM - 4:00 PM"], ["Public Holidays", "9:00 AM - 4:00 PM"]].map(([d, h]) => (
                  <li key={d} className="flex items-center justify-between border-b border-border pb-3 last:border-none">
                    <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {d}</span>
                    <span className="font-semibold">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-lg font-bold mb-4">Frequently Asked Questions</div>
              <div className="space-y-2">
                {faqs.slice(0, 4).map((f, i) => (
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
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-primary/20 bg-primary-soft/60 p-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck className="h-7 w-7" /></div>
          <div className="flex-1">
            <div className="text-lg font-bold">We're Here for You!</div>
            <div className="text-sm text-muted-foreground">Your satisfaction is our priority. We guarantee a response within 24 hours.</div>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-info/15 text-info"><Headphones className="h-7 w-7" /></div>
        </div>
      </div>
    </AppShell>
  );
}
