import { createFileRoute, redirect } from "@tanstack/react-router";
import { Bot, MessageSquare, Search, Send, RefreshCw, Trash2, Smile, Paperclip, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { getChatMessages, sendChatMessage, markChatAsRead, clearChatMessages, getAdminSettings, updateAdminSettings } from "@/lib/db-server";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/chats")({
  beforeLoad: ({ context }) => {
    if (!context.user || (context.user.role !== "Admin")) {
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
  const [aiEnabled, setAiEnabled] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  
  const emojis = ["😊", "👍", "🚗", "🔧", "🔥", "❤️", "🎉", "👋", "✅", "👀", "🛠️", "💬"];

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [msgs, settings] = await Promise.all([
        getChatMessages(),
        getAdminSettings()
      ]);
      setMessages(msgs);
      if (settings) {
        setAiEnabled(settings.aiChatbotAutoReply || false);
      }
    } catch (err) {
      toast.error("Failed to load chat data.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleToggleAi = async () => {
    const newVal = !aiEnabled;
    setAiEnabled(newVal);
    try {
      await updateAdminSettings({ aiChatbotAutoReply: newVal });
      toast.success(newVal ? "AI Auto-Reply Enabled" : "AI Auto-Reply Disabled");
    } catch {
      toast.error("Failed to update AI settings.");
      setAiEnabled(!newVal);
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

  // Scroll to bottom on thread change or new messages (with a slight rendering timeout)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEmail) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      setSending(true);
      try {
        const res = await sendChatMessage({
          data: {
            text: base64Data,
            recipientEmail: activeEmail
          }
        });
        if (res.success || res.message) {
          const newMsg = res.message || {
            userEmail: activeEmail,
            senderEmail: user?.email || "admin@autocare.com",
            senderName: user?.name || "Support",
            senderRole: "Admin",
            text: base64Data,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            read: false
          };
          setMessages((prev) => [...prev, newMsg]);
        } else {
          toast.error("Failed to send file.");
        }
      } catch (err) {
        toast.error("Failed to upload file.");
      } finally {
        setSending(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearChat = async () => {
    if (!activeEmail) return;
    setIsClearConfirmOpen(false);
    try {
      const res = await clearChatMessages({ userEmail: activeEmail });
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m.userEmail !== activeEmail));
        toast.success(`Chat history with ${activeEmail} cleared.`);
      } else {
        toast.error(res.error || "Failed to clear chat history.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Bot className="h-4 w-4" /> AI Auto-Reply</span>
            <button
              onClick={handleToggleAi}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                aiEnabled ? "bg-primary" : "bg-input"
              )}
            >
              <span className={cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform", aiEnabled ? "translate-x-4" : "translate-x-0")} />
            </button>
          </div>
          <button onClick={() => load(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-secondary cursor-pointer">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground">Loading...</div>
            ) : filteredEmails.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">No conversations yet.</div>
            ) : (
              filteredEmails.map((email) => {
                const last = latestByUser(email);
                const unread = getUnreadCount(email);
                const isActive = activeEmail === email;
                return (
                  <button
                    key={email}
                    onClick={() => setActiveEmail(email)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors cursor-pointer",
                      isActive ? "border border-primary/30 bg-primary-soft" : "border border-transparent hover:bg-secondary/50"
                    )}
                  >
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl font-bold text-sm", isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>{email[0].toUpperCase()}</div>
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
        <section className="flex flex-col min-h-0">
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
                <button
                  onClick={() => setIsClearConfirmOpen(true)}
                  className="rounded-lg border border-border p-2 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title="Clear conversation history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </header>
              <div ref={bottomRef} className="flex-1 space-y-4 overflow-y-auto p-6 min-h-0">
                {threadMsgs.map((m: any, i: number) => {
                  const isAdmin = m.senderRole !== "Customer";
                  const isImage = m.text.startsWith("data:image/");
                  return (
                    <div key={m._id || i} className={`flex items-end gap-2 ${isAdmin ? "flex-row-reverse" : ""}`}>
                      {!isAdmin && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">{m.senderEmail?.[0]?.toUpperCase() || "C"}</div>}
                      <div className={cn(
                        "max-w-[75%] text-sm shadow-sm",
                        isAdmin ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground" : "rounded-2xl rounded-bl-sm bg-secondary text-secondary-foreground",
                        isImage ? "p-1" : "px-4 py-2.5"
                      )}>
                        {m.text.startsWith("data:") ? (
                          isImage ? (
                            <img src={m.text} alt="Uploaded attachment" className="max-w-[280px] max-h-[280px] rounded-xl object-cover" />
                          ) : (
                            <a href={m.text} download="attachment" className={cn(isAdmin ? "text-white underline" : "text-primary underline", "flex items-center gap-1 p-2")}>Download attachment</a>
                          )
                        ) : (
                          <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        )}
                        <div className={cn("mt-1 flex items-center gap-1 text-[10px]", isAdmin ? "justify-end text-primary-foreground/80" : "text-muted-foreground")}>
                          {m.time} {isAdmin && <CheckCheck className={cn("h-3.5 w-3.5", m.read ? "text-white font-extrabold" : "opacity-60")} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border p-4 relative">
                {showEmojis && (
                  <div className="absolute bottom-20 left-4 z-20 grid grid-cols-6 gap-2 rounded-xl border border-border bg-card p-3 shadow-lg max-w-[240px]">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setReply((r) => r + emoji);
                          setShowEmojis(false);
                        }}
                        className="text-lg hover:scale-125 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                />
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmojis((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
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
      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        title="Clear Conversation History"
        description={`Are you sure you want to permanently delete all message history with customer "${activeEmail}"? This action is irreversible.`}
        confirmText="Clear History"
        cancelText="Cancel"
        onConfirm={handleClearChat}
        onCancel={() => setIsClearConfirmOpen(false)}
        icon={Trash2}
        variant="danger"
      />
    </AdminShell>
  );
}
