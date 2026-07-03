import { createFileRoute, redirect } from "@tanstack/react-router";
import { Bot, MessageSquare, Search, Send, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { getChatMessages, sendChatMessage } from "@/lib/db-server";

export const Route = createFileRoute("/admin/chats")({
  beforeLoad: ({ context }) => {
    if (!context.user || (context.user.role !== "Admin" && context.user.role !== "Superadmin")) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Chats — Admin" }] }),
  component: AdminChats,
});

function AdminChats() {
  const { user } = Route.useRouteContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const msgs = await getChatMessages();
    setMessages(msgs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Group messages by unique users
  const userEmails = [...new Set(messages.map((m: any) => m.senderEmail).filter(Boolean))];
  const [activeEmail, setActiveEmail] = useState<string | null>(null);

  useEffect(() => {
    if (userEmails.length > 0 && !activeEmail) setActiveEmail(userEmails[0]);
  }, [userEmails.length]);

  const threadMsgs = messages.filter((m: any) =>
    m.senderEmail === activeEmail || m.recipientEmail === activeEmail
  );

  const activeUser = messages.find((m: any) => m.senderEmail === activeEmail);

  const filteredEmails = userEmails.filter((e) => e.toLowerCase().includes(searchQ.toLowerCase()));
  const latestByUser = (email: string) => {
    const msgs = messages.filter((m: any) => m.senderEmail === email || m.recipientEmail === email);
    return msgs[msgs.length - 1];
  };

  const handleSend = async () => {
    if (!reply.trim() || !activeEmail) return;
    setSending(true);
    const res = await sendChatMessage({ data: {
      text: reply.trim(),
      senderRole: "Admin",
      senderName: user?.name || "Support",
      senderEmail: "admin@autocare.np",
      recipientEmail: activeEmail,
    }});
    if (res.success || res._id) {
      await load();
      setReply("");
    } else {
      toast.error("Failed to send reply.");
    }
    setSending(false);
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Chats</h1>
          <p className="text-sm text-muted-foreground">Reply to customer conversations in real time.</p>
        </div>
        <button onClick={load} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-secondary">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="grid h-[75vh] gap-4 rounded-2xl border border-border bg-card lg:grid-cols-[320px_1fr]">
        {/* Thread list */}
        <aside className="flex flex-col border-r border-border">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search conversations..."
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</div>
            ) : (
              filteredEmails.map((email) => {
                const last = latestByUser(email);
                return (
                  <button
                    key={email}
                    onClick={() => setActiveEmail(email)}
                    className={`flex w-full items-start gap-3 border-b border-border p-4 text-left hover:bg-secondary/50 ${activeEmail === email ? "bg-primary-soft/60" : ""}`}
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary font-bold">{email[0].toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="truncate font-semibold text-sm">{email}</div>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{last?.text || "No messages"}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat window */}
        <section className="flex flex-col">
          {!activeEmail ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">Select a conversation</div>
          ) : (
            <>
              <header className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft font-bold text-primary">{activeEmail[0].toUpperCase()}</div>
                  <div>
                    <div className="font-bold">{activeEmail}</div>
                    <div className="text-xs text-success">● Live conversation</div>
                  </div>
                </div>
                <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold">
                  <Bot className="h-4 w-4 text-primary" /> AI suggest reply
                </button>
              </header>
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {threadMsgs.map((m: any, i: number) => {
                  const isAdmin = m.senderRole === "Admin";
                  return (
                    <div key={m._id || i} className={`flex items-end gap-2 ${isAdmin ? "flex-row-reverse" : ""}`}>
                      {!isAdmin && <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-xs font-bold">{m.senderEmail?.[0]?.toUpperCase()}</div>}
                      <div className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${isAdmin ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary"}`}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-border p-4">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type your reply..."
                    className="flex-1 bg-transparent py-2 text-sm outline-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !reply.trim()}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
