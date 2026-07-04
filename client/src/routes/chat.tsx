import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Bot, CheckCheck, Paperclip, Send, Smile, SlidersHorizontal, MessageSquare, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { getChatMessages, sendChatMessage, markChatAsRead, clearChatMessages } from "@/lib/db-server";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  beforeLoad: ({ context }: { context: any }) => {
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
  const [msgs, setMsgs] = useState<any[]>(initialMessages || []);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs(initialMessages || []);
  }, [initialMessages]);

  // Scroll to bottom on load or new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Real-time polling: refetch messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const latest = await getChatMessages();
        setMsgs((prev) => {
          if (latest.length !== prev.length || (latest.length > 0 && latest[latest.length - 1]._id !== prev[prev.length - 1]._id)) {
            return latest;
          }
          return prev;
        });
      } catch (err) {
        console.error("Polling chat failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Mark admin replies as read when customer views chat
  useEffect(() => {
    const hasUnread = msgs.some((m: any) => m.senderRole === "Admin" && !m.read);
    if (hasUnread) {
      markChatAsRead().then((res) => {
        if (res.success) {
          setMsgs((prev) =>
            prev.map((m) => (m.senderRole === "Admin" ? { ...m, read: true } : m))
          );
        }
      });
    }
  }, [msgs]);

  const handleClearChat = async () => {
    setIsClearConfirmOpen(false);
    try {
      const res = await clearChatMessages();
      if (res.success) {
        setMsgs([]);
        toast.success("Chat history cleared successfully.");
      } else {
        toast.error(res.error || "Failed to clear chat history.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    const userText = text;
    setText("");
    setSending(true);

    try {
      const res = await sendChatMessage({ data: { text: userText } });
      if (res.success || res.message) {
        const newMsg = res.message || {
          senderRole: "Customer",
          text: userText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: false
        };
        setMsgs((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error("Failed to send chat message:", err);
    } finally {
      setSending(false);
    }
  };

  const unseenCount = msgs.filter((m: any) => m.senderRole === "Admin" && !m.read).length;
  const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Home</Link>
        <h1 className="mt-3 text-3xl font-extrabold">Chat with Support</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success animate-pulse" /> We're online and ready to help!</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-2xl border border-border bg-card p-4 h-fit">
            <div className="flex items-center justify-between">
              <div className="font-bold">Conversations</div>
              <button className="grid h-8 w-8 place-items-center rounded-lg border border-border"><SlidersHorizontal className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-4 space-y-2">
              <button className="w-full rounded-xl border border-primary/30 bg-primary-soft p-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><MessageSquare className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm">Helpdesk support</div>
                      <div className="text-[10px] text-muted-foreground">{lastMsg ? lastMsg.time : "Just now"}</div>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{lastMsg ? lastMsg.text : "Start a conversation with our support team!"}</div>
                  </div>
                  {unseenCount > 0 && (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-bounce">
                      {unseenCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </aside>

          <section className="flex h-[70vh] flex-col rounded-2xl border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><MessageSquare className="h-5 w-5" /></div>
                <div>
                  <div className="flex items-center gap-2 font-bold">Helpdesk Support <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">Live</span></div>
                  <div className="text-xs text-muted-foreground">Ask us anything, our support representatives typically reply in minutes.</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Connected</div>
                <button
                  onClick={() => setIsClearConfirmOpen(true)}
                  className="rounded-lg border border-border p-2 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title="Clear chat history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
              <div className="text-center text-xs text-muted-foreground mb-4">Today</div>
              {msgs.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No messages yet. Send a message to start chatting with our Support center!
                </div>
              ) : (
                msgs.map((m: any, i: number) => {
                  const isUser = m.senderRole === "Customer";
                  return (
                    <div key={m._id || i} className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
                      {!isUser && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold text-muted-foreground">{m.senderName?.[0]?.toUpperCase() || "S"}</div>}
                      <div className={cn(
                        "max-w-md rounded-2xl px-4 py-2.5 text-sm",
                        isUser ? "rounded-br-sm bg-primary-soft text-foreground" : "rounded-bl-sm bg-secondary"
                      )}>
                        <div>{m.text}</div>
                        <div className={cn("mt-1 flex items-center gap-1 text-[10px] text-muted-foreground", isUser && "justify-end")}>
                          {m.time} {isUser && <CheckCheck className={cn("h-3.5 w-3.5", m.read ? "text-primary font-extrabold" : "text-muted-foreground")} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            <div className="border-t border-border p-4">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <button className="text-muted-foreground hover:text-foreground"><Paperclip className="h-4 w-4" /></button>
                <button className="text-muted-foreground hover:text-foreground"><Smile className="h-4 w-4" /></button>
                <input 
                  value={text} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)} 
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && send()} 
                  placeholder="Type your message..." 
                  className="flex-1 bg-transparent py-2 text-sm outline-none" 
                />
                <button onClick={send} className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Send className="h-4 w-4" /></button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        title="Clear Chat History"
        description="Are you sure you want to permanently delete all messages in this conversation? This action cannot be undone."
        confirmText="Clear Chat"
        cancelText="Cancel"
        onConfirm={handleClearChat}
        onCancel={() => setIsClearConfirmOpen(false)}
        icon={Trash2}
        variant="danger"
      />
    </AppShell>
  );
}
