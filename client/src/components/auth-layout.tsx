import { Link } from "@tanstack/react-router";
import { Calendar, Clock, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/app-shell";
import authCar from "@/assets/auth-car.jpg";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/40 p-4 sm:p-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-border bg-card shadow-elevated lg:grid-cols-2">
        <div className="relative flex flex-col justify-between bg-primary-soft/50 p-8 sm:p-10">
          <div>
            <BrandLogo />
            <h2 className="mt-10 text-4xl font-extrabold leading-tight sm:text-5xl">{title}</h2>
            <p className="mt-4 max-w-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="relative my-10">
            <img src={authCar} alt="Car in the workshop" width={900} height={1100} loading="lazy" className="mx-auto max-h-72 w-auto object-contain drop-shadow-2xl" />
          </div>
          <ul className="space-y-4">
            {[
              { i: Calendar, t: "Easy Booking", d: "Book your car service in just a few clicks." },
              { i: ShieldCheck, t: "Trusted & Secure", d: "Your data and payments are always safe." },
              { i: Clock, t: "Track in Real-time", d: "Get real-time updates of your service." },
            ].map((f) => (
              <li key={f.t} className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary shadow-sm"><f.i className="h-5 w-5" /></div>
                <div><div className="font-semibold">{f.t}</div><div className="text-sm text-muted-foreground">{f.d}</div></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-center p-8 sm:p-12">
          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 text-sm font-semibold hover:bg-secondary">
      <svg className="h-4 w-4" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
      {label}
    </button>
  );
}
