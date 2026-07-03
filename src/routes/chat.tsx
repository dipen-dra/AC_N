import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Bot, CheckCheck, Paperclip, Send, Smile, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { getChatMessages, sendChatMessage } from "@/lib/db-server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getChatMessages(),
  head: () => ({ meta: [{ title: "Chat with Support — AutoCare Nepal" }] }),
  component: Chat,
});

function Chat() {
  const initialMessages = Route.useLoaderData();
  const router = useRouter();
  const [msgs, setMsgs] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setMsgs(initialMessages);
  }, [initialMessages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    const userText = text;
    setText("");
    setSending(true);

    try {
      // 1. Send user message to DB
      await sendChatMessage({ data: { role: "user", text: userText } });
      await router.invalidate();

      // 2. Simulate AI response
      setTimeout(async () => {
        const botReply = "Thanks! One of our specialists will be with you shortly.";
        await sendChatMessage({ data: { role: "bot", text: botReply } });
        await router.invalidate();
      }, 1000);
    } catch (err) {
      console.error("Failed to send chat message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Home</Link>
        <h1 className="mt-3 text-3xl font-extrabold">Chat with Support</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" /> We're online and ready to help!</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="font-bold">Conversations</div>
              <button className="grid h-8 w-8 place-items-center rounded-lg border border-border"><SlidersHorizontal className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-4 space-y-2">
              <button className="w-full rounded-xl border border-primary/30 bg-primary-soft p-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">AI Assistant</div>
                      <div className="text-[10px] text-muted-foreground">Just now</div>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">Ask me anything, I'm here to help!</div>
                  </div>
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
                </div>
              </button>
              <button className="w-full rounded-xl p-3 text-left hover:bg-secondary">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary font-bold">R</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between"><div className="font-semibold">Ramesh KC</div><div className="text-[10px] text-muted-foreground">Yesterday</div></div>
                    <div className="truncate text-xs text-muted-foreground">Your service is completed 🎉</div>
                  </div>
                </div>
              </button>
            </div>
          </aside>

          <section className="flex h-[70vh] flex-col rounded-2xl border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
                <div>
                  <div className="flex items-center gap-2 font-bold">AI Assistant <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">AI</span></div>
                  <div className="text-xs text-muted-foreground">Typically replies instantly</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" /> Online</div>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
              <div className="text-center text-xs text-muted-foreground">Today</div>
              {msgs.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No messages yet. Start a conversation with our AI Assistant!
                </div>
              ) : (
                msgs.map((m, i) => (
                  <div key={i} className={cn("flex items-end gap-2", m.role === "user" && "flex-row-reverse")}>
                    {m.role === "bot" && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></div>}
                    <div className={cn(
                      "max-w-md rounded-2xl px-4 py-2.5 text-sm",
                      m.role === "user" ? "rounded-br-sm bg-primary-soft text-foreground" : "rounded-bl-sm bg-secondary"
                    )}>
                      <div>{m.text}</div>
                      <div className={cn("mt-1 flex items-center gap-1 text-[10px] text-muted-foreground", m.role === "user" && "justify-end")}>
                        {m.time} {m.role === "user" && <CheckCheck className="h-3 w-3 text-primary" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <button className="text-muted-foreground hover:text-foreground"><Paperclip className="h-4 w-4" /></button>
                <button className="text-muted-foreground hover:text-foreground"><Smile className="h-4 w-4" /></button>
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type your message..." className="flex-1 bg-transparent py-2 text-sm outline-none" />
                <button onClick={send} className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Send className="h-4 w-4" /></button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
