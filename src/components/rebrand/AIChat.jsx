import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { LoadingButton } from "@/components/ui";
import { Send, Bot, User, Sparkles, AlertCircle, Loader2, MousePointerClick } from "lucide-react";

export default function AIChat({ project, selectedElement, onElementAnalyzed, onActionExecuted }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [elementAnalysis, setElementAnalysis] = useState(null);
  const [elementLoading, setElementLoading] = useState(false);
  const [executing, setExecuting] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (project) {
      setMessages([{
        role: "ai",
        text: `I'm your XtremeClone AI assistant. I can read, write, and execute changes to this project.\n\nAsk me anything about the rebrand, legal compliance, SEO, or tell me what to change. You can also click any element in the Inspector preview and I'll analyze it for you.`,
      }]);
      setElementAnalysis(null);
    }
  }, [project?.id]);

  useEffect(() => {
    if (selectedElement && project) {
      analyzeElement(selectedElement);
    }
  }, [selectedElement, project?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, elementAnalysis, elementLoading]);

  const analyzeElement = async (el) => {
    setElementLoading(true);
    try {
      const res = await base44.functions.invoke("rebrandAssistant", {
        action: "analyze_element",
        project_id: project.id,
        clicked_element: el,
      });
      setElementAnalysis(res.data);
      onElementAnalyzed?.(res.data);
    } catch (e) {
      setElementAnalysis({ description: "Error: " + e.message, needs_change: false });
    }
    setElementLoading(false);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("rebrandAssistant", {
        action: "chat",
        project_id: project.id,
        message: msg,
      });
      setMessages(prev => [...prev, {
        role: "ai",
        text: res.data.response,
        actions: res.data.actions || [],
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", text: "Error: " + e.message }]);
    }
    setLoading(false);
  };

  const executeAction = async (action) => {
    setExecuting(action.label);
    try {
      const res = await base44.functions.invoke("rebrandAssistant", {
        action: "execute",
        project_id: project.id,
        command: { type: action.command, params: action.params },
      });
      setMessages(prev => [...prev, { role: "ai", text: `✅ ${res.data.message || "Done."}` }]);
      onActionExecuted?.();
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", text: `Error: ${e.message}` }]);
    }
    setExecuting(null);
  };

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-zinc-950" style={{ height: "600px" }}>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Bot className="h-4 w-4 text-lime-400" />
        <span className="text-sm font-semibold text-white">XtremeClone AI</span>
        <span className="ml-auto rounded-md border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[10px] text-lime-300">READ · WRITE · EXECUTE</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-white/10" : "bg-lime-400/20"}`}>
              {m.role === "user" ? <User className="h-3.5 w-3.5 text-white/60" /> : <Bot className="h-3.5 w-3.5 text-lime-400" />}
            </div>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-white/5 text-white" : "bg-lime-400/5 text-white/90"}`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.actions?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {m.actions.map((a, j) => (
                    <button
                      key={j}
                      onClick={() => executeAction(a)}
                      disabled={!!executing}
                      className="flex w-full items-center gap-1.5 rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1.5 text-xs text-lime-300 hover:bg-lime-400/20 disabled:opacity-50"
                    >
                      {executing === a.label ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Element analysis panel */}
        {elementLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-lime-400/20 bg-lime-400/5 px-3 py-2 text-sm text-white/60">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-lime-400" /> Analyzing clicked element…
          </div>
        )}
        {elementAnalysis && !elementLoading && (
          <div className="rounded-lg border border-lime-400/30 bg-lime-400/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-lime-300 mb-2">
              <MousePointerClick className="h-3 w-3" /> Element Analysis
            </div>
            <p className="text-sm text-white/90">{elementAnalysis.description}</p>
            {elementAnalysis.needs_change !== undefined && (
              <div className={`mt-2 flex items-center gap-1.5 text-xs ${elementAnalysis.needs_change ? "text-amber-400" : "text-lime-400"}`}>
                {elementAnalysis.needs_change ? <AlertCircle className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                {elementAnalysis.needs_change ? "Must change" : "Can keep"}
              </div>
            )}
            {elementAnalysis.reason && <p className="mt-1 text-xs text-white/50">Reason: {elementAnalysis.reason}</p>}
            {elementAnalysis.suggested_replacement && <p className="mt-1 text-xs text-white/70">Replacement: {elementAnalysis.suggested_replacement}</p>}
            {elementAnalysis.seo_notes && <p className="mt-1 text-xs text-white/40">SEO: {elementAnalysis.seo_notes}</p>}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask AI to analyze, change, or execute…"
            className="flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-lime-400/50"
          />
          <LoadingButton onClick={send} loading={loading} variant="primary" className="px-3 py-2">
            <Send className="h-3.5 w-3.5" />
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}