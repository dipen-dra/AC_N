import { createFileRoute, redirect } from "@tanstack/react-router";
import { Bot, MessageSquare, Search, Send, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { getChatMessages, sendChatMessage, markChatAsRead } from "@/lib/db-server";

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
  const [activeEmail, setActiveEmail] = useState<string | null>(null);

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const msgs = await getChatMessages();
      setMessages(msgs);
    } catch (err) {
      toast.error("Failed to load chat messages.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const latest = await getChatMessages();
        setMessages((prev) => {
          if (latest.length !== prev.length || (latest.length > 0 && latest[latest.length - 1]._id !== prev[prev.length - 1]._id)) {
            return latest;
          }
          return prev;
        });
      } catch (err) {
        console.error("Polling admin chat failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on thread change or new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeEmail, messages.length]);

  // Group messages by unique customer userEmail
  const userEmails = [...new Set(messages.map((m: any) => m.userEmail).filter(Boolean))];

  useEffect(() => {
    if (userEmails.length > 0 && !activeEmail) {
      setActiveEmail(userEmails[0]);
    }
  }, [userEmails.length]);

  // Mark customer messages as read when admin views the thread
  useEffect(() => {
    if (activeEmail) {
      const hasUnread = messages.some(
        (m: any) => m.userEmail === activeEmail && m.senderRole !== "Admin" && !m.read
      );
      if (hasUnread) {
        markChatAsRead({ userEmail: activeEmail }).then((res) => {
          if (res.success) {
            setMessages((prev) =>
              prev.map((m) =>
                m.userEmail === activeEmail && m.senderRole !== "Admin"
                  ? { ...m, read: true }
                  : m
              )
            );
          }
        });
      }
    }
  }, [activeEmail, messages.length]);

  const threadMsgs = messages.filter((m: any) => m.userEmail === activeEmail);
  const filteredEmails = userEmails.filter((e) => e.toLowerCase().includes(searchQ.toLowerCase()));

  const latestByUser = (email: string) => {
    const msgs = messages.filter((m: any) => m.userEmail === email);
    return msgs[msgs.length - 1];
  };

  const getUnreadCount = (email: string) => {
    return messages.filter((m: any) => m.userEmail === email && m.senderRole !== "Admin" && !m.read).length;
  };

  const handleSend = async () => {
    if (!reply.trim() || !activeEmail || sending) return;
    setSending(true);
    const textToSend = reply.trim();
    setReply("");

    try {
      const res = await sendChatMessage({
        data: {
          text: textToSend,
          recipientEmail: activeEmail
        }
      });
      if (res.success || res.message) {
        const newMsg = res.message || {
          userEmail: activeEmail,
          senderEmail: user?.email || "admin@autocare.com",
          senderName: user?.name || "Support",
          senderRole: "Admin",
          text: textToSend,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: false
        };
        setMessages((prev) => [...prev, newMsg]);
      } else {
        toast.error("Failed to send reply.");
      }
    } catch {
      toast.error("Error occurred while sending message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Chats</h1>
          <p className="text-sm text-muted-foreground">Reply to customer conversations in real time.</p>
        </div>
        <button onClick={() => load(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-secondary cursor-pointer">
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
                const unread = getUnreadCount(email);
                return (
                  <button
                    key={email}
                    onClick={() => setActiveEmail(email)}
                    className={`flex w-full items-start gap-3 border-b border-border p-4 text-left hover:bg-secondary/50 cursor-pointer ${activeEmail === email ? "bg-primary-soft/60" : ""}`}
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary font-bold text-sm">{email[0].toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="truncate font-semibold text-sm">{email}</div>
                        <div className="text-[10px] text-muted-foreground shrink-0">{last ? last.time : ""}</div>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{last?.text || "No messages"}</div>
                    </div>
                    {unread > 0 && (
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-bounce">
                        {unread}
                      </span>
                    )}
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
              </header>
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {threadMsgs.map((m: any, i: number) => {
                  const isAdmin = m.senderRole === "Admin";
                  return (
                    <div key={m._id || i} className={`flex items-end gap-2 ${isAdmin ? "flex-row-reverse" : ""}`}>
                      {!isAdmin && <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-xs font-bold text-muted-foreground">{m.senderName?.[0]?.toUpperCase() || "C"}</div>}
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
                    className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 cursor-pointer"
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
