import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, Sparkles, Wrench } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — AutoCare Nepal" }] }),
  component: AI,
});

const suggestions = [
  "Why is my engine overheating?",
  "How often should I change oil?",
  "What does the check engine light mean?",
  "Best tyre pressure for city driving?",
  "How to jump-start a dead battery?",
  "What's included in a full service?",
];

function AI() {
  const [msgs, setMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm your AutoCare AI assistant 🤖 Ask me anything about your vehicle, servicing, or troubleshooting." },
  ]);
  const [text, setText] = useState("");
  const send = (t: string) => {
    if (!t.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setText("");
    setTimeout(() => setMsgs((m) => [...m, { role: "ai", text: "Great question! Based on our records for your Toyota Yaris, here's what I recommend: check the coolant level first, then inspect the radiator fan. If the issue persists, book a diagnostic service and I'll route you to our top technician. Want me to book that for you?" }]), 900);
  };
  return (
    <AppShell>
      <PageHeader title="AI Bike Assistant" subtitle="Get instant answers on troubleshooting, maintenance and servicing." />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div className="flex h-[70vh] flex-col rounded-2xl border border-border bg-card">
          <header className="flex items-center gap-3 border-b border-border p-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-soft"><Bot className="h-5 w-5" /></div>
            <div>
              <div className="flex items-center gap-2 font-bold">AutoCare AI <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">BETA</span></div>
              <div className="text-xs text-muted-foreground">Powered by AutoCare intelligence</div>
            </div>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {msgs.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "ai" && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-brand text-primary-foreground"><Bot className="h-4 w-4" /></div>}
                <div className={`max-w-lg rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary"}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-primary-soft hover:text-primary">
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(text)} placeholder="Ask me anything about your vehicle..." className="flex-1 bg-transparent py-2 text-sm outline-none" />
              <button onClick={() => send(text)} className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-lg font-bold">Quick tips</div>
            <ul className="mt-4 space-y-3 text-sm">
              {["Ask about warning lights", "Get maintenance schedule", "Troubleshoot startup issues", "Compare service plans"].map((t) => (
                <li key={t} className="flex items-start gap-2"><Wrench className="mt-0.5 h-4 w-4 text-primary" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-primary-soft/60 p-6">
            <div className="text-lg font-bold">Suggested prompts</div>
            <div className="mt-4 space-y-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-sm hover:border-primary/40">{s}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
