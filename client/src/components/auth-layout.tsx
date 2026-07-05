import { Link } from "@tanstack/react-router";
import { Calendar, Clock, ShieldCheck } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { BrandLogo } from "@/components/app-shell";
import authCar from "@/assets/auth-car.jpg";
import { toast } from "sonner";

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

export function GoogleButton() {
  useEffect(() => {
    // Load script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    const handleCredentialResponse = async (response: any) => {
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        
        const json = await res.json();
        if (json.success) {
          toast.success("Successfully logged in with Google!");
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          toast.error(json.error || "Google sign-in failed.");
        }
      } catch (err) {
        toast.error("Failed to authenticate with Google.");
        console.error(err);
      }
    };

    script.onload = () => {
      const g = (window as any).google;
      if (g) {
        g.accounts.id.initialize({
          client_id: "583516832517-i1vcusmsiafecllognh1k63rh2dbrfq0.apps.googleusercontent.com",
          callback: handleCredentialResponse
        });
        g.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", width: 280, text: "continue_with", shape: "pill" }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="flex w-full justify-center py-2">
      <div id="google-signin-btn"></div>
    </div>
  );
}
