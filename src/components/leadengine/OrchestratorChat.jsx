import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, X, Send, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

// OrchestratorChat — the ORCHESTRATOR agent's chat panel. Collapsible,
// embedded in the Lead Engine page. The operator asks "what's hot
// today?", the agent answers using the lead engine data + functions.
export default function OrchestratorChat() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Create or resume a conversation with the orchestrator agent
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const existing = await base44.agents.listConversations({ agent_name: "lead_engine_orchestrator" });
        let conv = existing && existing.length > 0 ? existing[0] : null;
        if (!conv) {
          conv = await base44.agents.createConversation({
            agent_name: "lead_engine_orchestrator",
            metadata: { name: "Lead Engine Assistant" },
          });
        }
        setConversation(conv);
        setMessages(conv.messages || []);
      } catch (err) {
        console.error("Failed to init orchestrator conversation:", err);
      }
    })();
  }, [open]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !conversation || loading) return;
    setInput("");
    setLoading(true);
    try {
      // addMessage triggers the agent; subscription updates messages
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } catch (err) {
      console.error("Failed to send message:", err);
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-black shadow-lg shadow-amber-400/30 transition-transform hover:scale-105"
        title="Ask the Lead Engine Assistant"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-amber-400/40 bg-zinc-950 shadow-2xl shadow-amber-400/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/15">
            <Bot className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Lead Engine Assistant</div>
            <div className="text-[10px] text-amber-400/70">ORCHESTRATOR · online</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/40">
            <MessageSquare className="h-8 w-8 mb-2 text-amber-400/40" />
            <p className="text-sm">Ask me anything about your leads.</p>
            <p className="text-xs mt-1 text-white/30">Try: "What's hot today?"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-sm",
              msg.role === "user"
                ? "bg-amber-400 text-black"
                : "bg-white/5 text-white border border-white/10"
            )}>
              {msg.role === "user"
                ? <p>{msg.content}</p>
                : <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-white/90">{msg.content || ""}</ReactMarkdown>
              }
              {/* Tool call indicators */}
              {msg.tool_calls?.map((tc, j) => (
                <div key={j} className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-400/70">
                  <Loader2 className={cn("h-3 w-3", tc.status === "completed" || tc.status === "success" ? "hidden" : "animate-spin")} />
                  <span>{tc.name || "tool"} · {tc.status}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {loading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="What's hot today? Pause outreach to Plano..."
            className="flex-1 rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-black transition-colors hover:bg-amber-300 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}