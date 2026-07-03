import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer, ShieldCheck, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/invoice/$id")({
  head: ({ params }) => ({ meta: [{ title: `Invoice ${params.id} — AutoCare Nepal` }] }),
  component: Invoice,
});

const lines = [
  { name: "Full Service — Complete inspection", qty: 1, price: 4000 },
  { name: "Engine oil (5W-30, 4L)", qty: 1, price: 1200 },
  { name: "Cabin air filter", qty: 1, price: 650 },
  { name: "Brake pad inspection", qty: 1, price: 300 },
  { name: "Labour", qty: 1, price: 800 },
];

function Invoice() {
  const { id } = Route.useParams();
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const tax = Math.round(subtotal * 0.13);
  const total = subtotal + tax;
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/bookings" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back to Bookings</Link>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold"><Printer className="h-4 w-4" /> Print</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Download className="h-4 w-4" /> Download PDF</button>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-secondary/40 p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground"><Wrench className="h-5 w-5" /></div>
                <div>
                  <div className="text-lg font-extrabold">AutoCare Nepal</div>
                  <div className="text-xs text-muted-foreground">Putalisadak, Kathmandu · support@autocare.np</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold">INVOICE</div>
                <div className="text-xs text-muted-foreground">{id}</div>
                <div className="mt-1 inline-block rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">PAID</div>
              </div>
            </div>
          </div>
          <div className="grid gap-4 border-b border-border p-8 sm:grid-cols-3">
            <div><div className="text-xs font-semibold uppercase text-muted-foreground">Billed to</div>
              <div className="mt-1 font-bold">Rehan Sharma</div>
              <div className="text-sm text-muted-foreground">rehan@autocare.np<br />+977 980-1234567</div>
            </div>
            <div><div className="text-xs font-semibold uppercase text-muted-foreground">Vehicle</div>
              <div className="mt-1 font-bold">BA 2 PA 5512</div>
              <div className="text-sm text-muted-foreground">Toyota Yaris · 2022</div>
            </div>
            <div><div className="text-xs font-semibold uppercase text-muted-foreground">Service date</div>
              <div className="mt-1 font-bold">15 May, 2026</div>
              <div className="text-sm text-muted-foreground">Completed 04:12 PM</div>
            </div>
          </div>
          <div className="p-8">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr><th className="pb-3 text-left font-semibold">Description</th><th className="pb-3 text-right font-semibold">Qty</th><th className="pb-3 text-right font-semibold">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((l) => (
                  <tr key={l.name}><td className="py-3">{l.name}</td><td className="py-3 text-right">{l.qty}</td><td className="py-3 text-right font-semibold">Rs. {l.price.toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm">
              <Row k="Subtotal" v={`Rs. ${subtotal.toLocaleString()}`} />
              <Row k="VAT (13%)" v={`Rs. ${tax.toLocaleString()}`} />
              <Row k="Loyalty discount" v="- Rs. 200" tone="text-success" />
              <div className="my-2 h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-extrabold text-primary">Rs. {(total - 200).toLocaleString()}</span>
              </div>
              <Row k="Paid via eSewa" v="15 May, 04:15 PM" tone="text-muted-foreground" />
            </div>
          </div>
          <div className="border-t border-border bg-secondary/40 p-6 text-xs text-muted-foreground">
            <ShieldCheck className="mr-1 inline h-4 w-4 text-success" /> This invoice is system-generated and requires no signature. VAT reg. no. 605231982.
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v, tone = "" }: { k: string; v: string; tone?: string }) {
  return <div className={`flex justify-between ${tone}`}><span>{k}</span><span className="font-medium">{v}</span></div>;
}
