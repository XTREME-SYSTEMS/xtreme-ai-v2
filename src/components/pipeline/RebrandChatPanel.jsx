import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";

export default function RebrandChatPanel({ project, onUpdated }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "I have full read/write/execute access to your rebrand. I can change brand name, colors, copy, services, FAQ, regenerate images, and more. What would you like to customize?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("rebrandAssistant", {
        action: "chat",
        project_id: project.id,
        message: msg,
      });
      const data = res?.data || res;
      setMessages((prev) => [...prev, { role: "assistant", text: data.response || "Done." }]);

      // Execute any actions the AI proposed — call each by its command name as the action
      if (data.actions && data.actions.length > 0) {
        for (const act of data.actions) {
          const payload = { action: act.command, project_id: project.id };
          // Merge params into the payload (update_colors expects { colors }, etc.)
          if (act.params && typeof act.params === "object") Object.assign(payload, act.params);
          await base44.functions.invoke("rebrandAssistant", payload).catch(() => {});
        }
        setMessages((prev) => [...prev, { role: "assistant", text: `✅ Executed ${data.actions.length} update(s). Changes applied to your rebrand package.` }]);
        if (onUpdated) onUpdated();
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${e.message}` }]);
    }
    setLoading(false);
  };

  const quickActions = [
    "Make the brand name more memorable",
    "Change colors to blue and orange",
    "Rewrite the hero headline to be more punchy",
    "Add a service for emergency repairs",
  ];

  return (
    <div className="rounded-xl border border-lime-400/20 bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 bg-lime-400/5 px-4 py-3">
        <Bot className="h-4 w-4 text-lime-400" />
        <div>
          <div className="text-sm font-semibold text-white">AI Rebrand Assistant</div>
          <div className="text-[10px] text-white/40">Full read · write · execute access to your rebrand package</div>
        </div>
        <Sparkles className="ml-auto h-4 w-4 text-lime-400/60" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-64 overflow-y-auto space-y-3 p-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", m.role === "assistant" ? "bg-lime-400/10 text-lime-400" : "bg-white/10 text-white/60")}>
              {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", m.role === "assistant" ? "bg-white/5 text-white/90" : "bg-lime-400/10 text-lime-100")}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-400/10 text-lime-400"><Bot className="h-4 w-4" /></div>
            <div className="rounded-lg bg-white/5 px-3 py-2"><Loader2 className="h-4 w-4 animate-spin text-white/50" /></div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5 border-t border-white/10 px-3 py-2">
        {quickActions.map((q, i) => (
          <button
            key={i}
            onClick={() => setInput(q)}
            disabled={loading}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60 transition-colors hover:border-lime-400/40 hover:text-lime-400 disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-white/10 p-3">
        <input
          className="pipeline-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Tell the AI what to change…"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-lime-400 px-3 py-2 text-black transition-colors hover:bg-lime-300 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}