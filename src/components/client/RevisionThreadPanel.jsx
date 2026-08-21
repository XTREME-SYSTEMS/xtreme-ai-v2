import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// D6 — Two-way revision messaging panel. Shows a conversation thread between
// the client and the admin team. The client can send messages and see replies.
// Props: thread (RevisionThread record), onSend (async (body) => void), onClose
export default function RevisionThreadPanel({ thread, onSend, onClose }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages?.length]);

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await onSend(message.trim());
      setMessage("");
    } catch (e) {
      // best effort
    } finally {
      setSending(false);
    }
  };

  if (!thread) return null;

  const messages = thread.messages || [];

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-400/10">
          <MessageSquare className="h-4 w-4 text-lime-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">{thread.subject || thread.step_label || "Revision Thread"}</h3>
          <p className="text-[11px] text-white/40">
            {thread.status === "open" ? "Open conversation" : thread.status === "resolved" ? "Resolved" : "Closed"}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="max-h-80 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-white/40">No messages yet. Start the conversation below.</p>
        ) : (
          messages.map((msg, i) => {
            const isClient = msg.sender === "client";
            return (
              <div key={i} className={cn("flex", isClient ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                  isClient ? "bg-lime-400 text-black" : "bg-white/10 text-white"
                )}>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className={cn("mt-1 text-[10px]", isClient ? "text-black/50" : "text-white/40")}>
                    {msg.sender_name || (isClient ? "You" : "Team")} · {new Date(msg.sent_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={1}
            placeholder="Type your message…"
            className="flex-1 resize-none rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!message.trim() || sending}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-400 text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}