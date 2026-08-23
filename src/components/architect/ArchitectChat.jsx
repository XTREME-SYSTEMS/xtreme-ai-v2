import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Brain, Send, Loader2, RefreshCw, Wrench, CheckCircle, XCircle, ChevronDown, User } from "lucide-react";

const AGENT_NAME = "chief_architect";

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status || "pending";
  const isFailed = status === "failed" || status === "error";
  const isRunning = status === "pending" || status === "running" || status === "in_progress";
  const isDone = status === "completed" || status === "success";

  const proj = toolCall.display_projection || {};
  const hideDetails = proj.hide_details && proj.details_redacted;

  let statusIcon, statusText, statusColor;
  if (isRunning) {
    statusIcon = <Loader2 className="h-3 w-3 animate-spin" />;
    statusText = proj.active_label || "Running";
    statusColor = "text-cyan-400";
  } else if (isFailed) {
    statusIcon = <XCircle className="h-3 w-3" />;
    statusText = proj.error_label || "Failed";
    statusColor = "text-red-400";
  } else {
    statusIcon = <CheckCircle className="h-3 w-3" />;
    statusText = proj.label || "Done";
    statusColor = "text-emerald-400";
  }

  let parsedArgs = null;
  try { parsedArgs = JSON.parse(toolCall.arguments_string); } catch { parsedArgs = toolCall.arguments_string; }

  let parsedResults = null;
  try { parsedResults = typeof toolCall.results === "string" ? JSON.parse(toolCall.results) : toolCall.results; } catch { parsedResults = toolCall.results; }

  const label = toolCall.name?.replace(/_/g, " ") || "tool";

  if (hideDetails) {
    return (
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
        {statusIcon}<span className={statusColor}>{statusText}</span>
        <span className="text-white/30">·</span>
        <span className="text-white/50">{label}</span>
      </div>
    );
  }

  return (
    <div className="mt-1.5 rounded-lg border border-white/10 bg-black/40 p-2 text-xs">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-1.5">
        {statusIcon}
        <span className={statusColor}>{statusText}</span>
        <span className="text-white/30">·</span>
        <span className="text-white/60 font-mono">{label}</span>
        <ChevronDown className={`ml-auto h-3 w-3 text-white/30 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5">
          {parsedArgs && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5">Parameters</div>
              <pre className="overflow-x-auto rounded bg-white/5 p-1.5 text-[10px] text-white/60">{JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults != null && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5">Result</div>
              <pre className="overflow-x-auto rounded bg-white/5 p-1.5 text-[10px] text-white/60 max-h-40">{JSON.stringify(parsedResults, null, 2).slice(0, 2000)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={`max-w-[85%] ${isUser ? "order-2" : ""}`}>
        <div className="flex items-center gap-1.5 mb-1">
          {isUser ? (
            <><span className="text-[10px] text-white/40">You</span><User className="h-3 w-3 text-white/40" /></>
          ) : (
            <><Brain className="h-3 w-3 text-cyan-400" /><span className="text-[10px] text-cyan-400/70">AI Chief Architect</span></>
          )}
        </div>
        <div className={`rounded-2xl px-3.5 py-2.5 ${isUser ? "bg-lime-400/15 border border-lime-400/20" : "bg-zinc-900 border border-white/10"}`}>
          {message.content && (
            isUser
              ? <p className="text-sm text-white/90 whitespace-pre-wrap">{message.content}</p>
              : <ReactMarkdown className="text-sm text-white/80 prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_code]:text-cyan-300 [&_a]:text-cyan-400">{message.content}</ReactMarkdown>
          )}
          {message.tool_calls?.map((tc, i) => <ToolCallDisplay key={i} toolCall={tc} />)}
        </div>
      </div>
    </div>
  );
}

export default function ArchitectChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const list = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      setConversations(list || []);
      if (list && list.length > 0 && !activeConv) {
        setActiveConv(list[0]);
      }
    } catch (e) {
      console.error("Failed to load conversations", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConv) return;
    setMessages(activeConv.messages || []);
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [activeConv?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const newConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: "New conversation", description: "Chat with the AI Chief Architect" },
      });
      setActiveConv(conv);
      setMessages([]);
      await loadConversations();
    } catch (e) {
      console.error("Failed to create conversation", e);
    }
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");

    if (!activeConv) {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: text.slice(0, 40), description: "Chat with the AI Chief Architect" },
        });
        setActiveConv(conv);
        await base44.agents.addMessage(conv, { role: "user", content: text });
        await loadConversations();
      } catch (e) {
        console.error(e);
      }
      return;
    }

    try {
      setSending(true);
      const conv = await base44.agents.getConversation(activeConv.id);
      await base44.agents.addMessage(conv, { role: "user", content: text });
    } catch (e) {
      console.error("Send failed", e);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/5 to-transparent overflow-hidden" style={{ height: "600px" }}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/15">
          <Brain className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">AI Chief Architect — Chat Agent</h3>
          <p className="text-[10px] text-white/40">Full system access · web browser · cloud browser · Google Workspace · operates on your behalf</p>
        </div>
        <button
          onClick={newConversation}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 hover:bg-cyan-400/20"
        >
          <RefreshCw className="h-3 w-3" /> New Chat
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Brain className="h-10 w-10 text-cyan-400/30" />
            <p className="mt-3 text-sm text-white/50">Ask me anything. I have full access to your system.</p>
            <p className="mt-1 text-xs text-white/30">I can run builds, provision ideas, scan for new tech, send emails, manage your calendar, and operate across your entire Google Workspace.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                "Run a Vision Cortex discovery cycle",
                "What should I build next?",
                "Scan for emerging AI technologies",
                "Check system health and fix issues",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/60 hover:border-cyan-400/30 hover:text-cyan-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <MessageBubble key={i} message={m} />)
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask the Architect to do anything — run builds, scan for tech, send emails, manage your calendar..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/40 focus:outline-none"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="flex items-center justify-center rounded-xl bg-cyan-400 px-3.5 py-2.5 text-black hover:bg-cyan-300 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}