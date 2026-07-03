import { createFileRoute } from "@tanstack/react-router";
import { Bot, MessageSquare, Search, Send } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin/chats")({
  head: () => ({ meta: [{ title: "Chats — Admin" }] }),
  component: AdminChats,
});

const threads = [
  { id: 1, name: "Rehan Sharma", last: "I want to reschedule my booking.", time: "10:25 AM", unread: 2, active: true },
  { id: 2, name: "Aayusha KC", last: "When can you pick up my car?", time: "9:41 AM", unread: 0 },
  { id: 3, name: "Bikash Thapa", last: "Thanks for the service 🙌", time: "Yesterday", unread: 0 },
  { id: 4, name: "Sneha Rai", last: "Please cancel booking #0087", time: "2 days", unread: 1 },
  { id: 5, name: "Prakash Adhikari", last: "Do you offer same day AC service?", time: "3 days", unread: 0 },
];

function AdminChats() {
  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Chats</h1>
        <p className="text-sm text-muted-foreground">Reply to customer conversations in real time.</p>
      </div>
      <div className="grid h-[75vh] gap-4 rounded-2xl border border-border bg-card lg:grid-cols-[320px_1fr]">
        <aside className="flex flex-col border-r border-border">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Search conversations..." className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map((t) => (
              <button key={t.id} className={`flex w-full items-start gap-3 border-b border-border p-4 text-left hover:bg-secondary/50 ${t.active ? "bg-primary-soft/60" : ""}`}>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary font-bold">{t.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="truncate font-semibold">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground">{t.time}</div>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{t.last}</div>
                </div>
                {t.unread > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{t.unread}</span>}
              </button>
            ))}
          </div>
        </aside>
        <section className="flex flex-col">
          <header className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft font-bold text-primary">R</div>
              <div>
                <div className="font-bold">Rehan Sharma</div>
                <div className="text-xs text-success">● Online · Booking #AC-2026-0515-000123</div>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold"><Bot className="h-4 w-4 text-primary" /> AI suggest reply</button>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div className="text-center text-xs text-muted-foreground">Today</div>
            <div className="flex items-end gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-xs font-bold">R</div>
              <div className="max-w-md rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm">Hello, I want to reschedule my booking for tomorrow.</div>
            </div>
            <div className="flex items-end justify-end gap-2">
              <div className="max-w-md rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">Hi Rehan! Sure, what date and time works best for you?</div>
            </div>
            <div className="flex items-end gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-xs font-bold">R</div>
              <div className="max-w-md rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm">17 May, morning slot please.</div>
            </div>
          </div>
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <input placeholder="Type your reply..." className="flex-1 bg-transparent py-2 text-sm outline-none" />
              <button className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
