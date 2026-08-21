import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send, X, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

// D6/G2 — Admin-side revision thread panel. Shows all open revision threads
// across all clients, with the ability to reply. Displayed on the admin
// Approvals page below the approval table.
export default function AdminRevisionThreads() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const all = await base44.entities.RevisionThread.list("-last_message_at", 50);
      setThreads(all || []);
    } catch (e) {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = base44.entities.RevisionThread.subscribe(() => load());
    return unsub;
  }, [load]);

  const sendReply = async () => {
    if (!activeThread || !reply.trim()) return;
    setSending(true);
    try {
      const newMsg = {
        sender: "admin",
        sender_email: "admin",
        sender_name: "Admin Team",
        body: reply.trim(),
        sent_at: new Date().toISOString(),
      };
      await base44.entities.RevisionThread.update(activeThread.id, {
        messages: [...(activeThread.messages || []), newMsg],
        last_message_at: new Date().toISOString(),
        client_unread_count: (activeThread.client_unread_count || 0) + 1,
      });
      // G4 — Notify the client about the new reply
      try {
        await base44.functions.invoke("notifyThreadMessage", {
          message: reply.trim(),
          sender: "admin",
          clientEmail: activeThread.client_email,
          stepLabel: activeThread.step_label || activeThread.step_key,
          threadId: activeThread.id,
        });
      } catch {}
      setReply("");
      await load();
      // Refresh active thread
      const updated = (await base44.entities.RevisionThread.filter({ id: activeThread.id }))[0];
      if (updated) setActiveThread(updated);
    } catch (e) {
      // best effort
    } finally {
      setSending(false);
    }
  };

  const resolveThread = async (thread) => {
    try {
      await base44.entities.RevisionThread.update(thread.id, { status: "resolved" });
      await load();
      if (activeThread?.id === thread.id) setActiveThread(null);
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin text-lime-400" /> Loading revision threads…
      </div>
    );
  }

  if (threads.length === 0) {
    return null; // Don't show the panel if there are no threads
  }

  const openThreads = threads.filter((t) => t.status === "open");

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-lime-400" />
        <h2 className="text-sm font-semibold text-white">Revision Conversations</h2>
        {openThreads.length > 0 && (
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            {openThreads.length} open
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Thread list */}
        <div className="space-y-2">
          {threads.map((t) => {
            const lastMsg = (t.messages || [])[0];
            const isActive = activeThread?.id === t.id;
            const unread = t.admin_unread_count > 0;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveThread(t)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  isActive ? "border-lime-400 bg-lime-400/5" : "border-white/10 bg-zinc-950 hover:border-white/25"
                )}
              >
                <div className="flex items-center gap-2">
                  {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />}
                  <span className="truncate text-xs font-semibold text-white">{t.client_email}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-white/40">{t.step_label}</span>
                </div>
                <p className="mt-1 truncate text-[11px] text-white/50">
                  {lastMsg?.body || "No messages"}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-medium uppercase",
                    t.status === "open" ? "bg-amber-400/15 text-amber-300" : "bg-lime-400/15 text-lime-300"
                  )}>
                    {t.status}
                  </span>
                  <span className="text-[10px] text-white/30">
                    {t.last_message_at ? new Date(t.last_message_at).toLocaleDateString() : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active thread conversation */}
        {activeThread ? (
          <div className="flex flex-col rounded-lg border border-white/10 bg-zinc-950">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{activeThread.subject}</p>
                <p className="text-[10px] text-white/40">{activeThread.client_email} · {activeThread.step_label}</p>
              </div>
              <button
                type="button"
                onClick={() => resolveThread(activeThread)}
                className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-[10px] font-medium text-lime-300 hover:bg-lime-400/20"
              >
                Resolve
              </button>
              <button onClick={() => setActiveThread(null)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto px-3 py-2.5 space-y-2">
              {(activeThread.messages || []).map((msg, i) => {
                const isAdmin = msg.sender === "admin";
                return (
                  <div key={i} className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-xs",
                      isAdmin ? "bg-lime-400 text-black" : "bg-white/10 text-white"
                    )}>
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                      <p className={cn("mt-0.5 text-[9px]", isAdmin ? "text-black/50" : "text-white/40")}>
                        {msg.sender_name || (isAdmin ? "Team" : "Client")} · {new Date(msg.sent_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-white/10 p-2.5">
              <div className="flex items-end gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={1}
                  placeholder="Reply to client…"
                  className="flex-1 resize-none rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-400 text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-white/10 bg-zinc-950 p-8 text-xs text-white/40">
            <Mail className="mr-1.5 h-4 w-4" /> Select a conversation to reply
          </div>
        )}
      </div>
    </div>
  );
}