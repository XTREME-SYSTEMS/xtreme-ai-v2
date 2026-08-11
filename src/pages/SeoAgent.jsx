import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import { Bot, Send, Plus, MessageSquare, Zap, TrendingUp, Activity, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";

const AGENT_NAME = "seo_standard_agent";

const QUICK_PROMPTS = [
  "Check rankings for all active sites",
  "Run a technical SEO audit",
  "Monitor our AI visibility in ChatGPT and Perplexity",
  "Generate technical assets (llms.txt, robots.txt) for all sites",
  "Submit all sites to IndexNow for instant Bing indexing",
  "Prospect new backlinks for all active portfolios",
  "Show me the SEO Standard Checklist progress",
  "Analyze competitor gaps for all sites",
];

export default function SeoAgent() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      setConversations(list || []);
      if (list && list.length > 0 && !activeConv) {
        setActiveConv(list[0]);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeConv) return;
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const newConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `SEO Session ${new Date().toLocaleString()}` },
      });
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv);
      setMessages([]);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || !activeConv) return;
    setSending(true);
    setInput("");
    try {
      await base44.agents.addMessage(activeConv, { role: "user", content: msg });
    } catch (e) { console.error(e); }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="SEO AI Agent" subtitle="Autonomous AI that monitors rankings, executes all 446 SEO methods, tracks AI visibility, and manages your entire SEO operation.">
        <LoadingButton onClick={newConversation} variant="primary">
          <Plus className="h-4 w-4" /> New Session
        </LoadingButton>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Conversation List */}
        <Panel title="Sessions" className="h-[calc(100vh-220px)] overflow-hidden">
          {loading ? (
            <div className="text-sm text-white/40 py-4 text-center">Loading…</div>
          ) : conversations.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No sessions" subtitle="Start a new session to begin." />
          ) : (
            <div className="space-y-1.5 overflow-y-auto h-full">
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveConv(c)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${activeConv?.id === c.id ? "bg-lime-400/10 text-white" : "text-white/60 hover:bg-white/5"}`}
                >
                  <div className="truncate">{c.metadata?.name || "SEO Session"}</div>
                  <div className="text-xs text-white/30">{c.created_date ? new Date(c.created_date).toLocaleDateString() : ""}</div>
                </button>
              ))}
            </div>
          )}
        </Panel>

        {/* Chat */}
        <Panel className="h-[calc(100vh-220px)] flex flex-col">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={Bot} title="Start a session" subtitle="Create a new session to chat with the SEO AI agent."
                children={<LoadingButton onClick={newConversation} variant="primary"><Plus className="h-4 w-4" /> New Session</LoadingButton>} />
            </div>
          ) : (
            <>
              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-1.5 border-b border-white/10 p-3">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    disabled={sending}
                    className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="h-12 w-12 text-lime-400/40 mb-3" />
                    <p className="text-sm text-white/50 max-w-md">
                      Ask me anything about your SEO performance. I can check rankings, run audits, prospect backlinks, monitor AI visibility, generate technical assets, and execute any of the 446 SEO methods.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 max-w-lg">
                      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white/60"><TrendingUp className="h-3.5 w-3.5 text-lime-400" /> Track Rankings</div>
                      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white/60"><ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Technical Audit</div>
                      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white/60"><Bot className="h-3.5 w-3.5 text-fuchsia-400" /> AI Visibility</div>
                      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white/60"><Activity className="h-3.5 w-3.5 text-amber-400" /> Backlink Prospecting</div>
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div className={`max-w-[85%] rounded-lg px-4 py-2.5 ${m.role === "user" ? "bg-lime-400/10 border border-lime-400/20 text-white" : "bg-zinc-950 border border-white/10 text-white/90"}`}>
                      {m.role === "user" ? (
                        <p className="text-sm">{m.content}</p>
                      ) : (
                        <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none prose-p:my-1 prose-li:my-0 prose-headings:my-2 prose-a:text-lime-400">{m.content || ""}</ReactMarkdown>
                      )}
                      {m.tool_calls?.map((tc, j) => (
                        <div key={j} className="mt-2 rounded border border-white/10 bg-black/50 px-2 py-1.5 text-xs">
                          <span className="text-white/40">⚙ {tc.name || tc.function_name} </span>
                          <span className={tc.status === "success" || tc.status === "completed" ? "text-lime-400" : tc.status === "failed" || tc.status === "error" ? "text-rose-400" : "text-amber-400"}>
                            {tc.status || "running"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/10 p-3">
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
                    placeholder="Ask the SEO agent anything…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    disabled={sending || !activeConv}
                  />
                  <LoadingButton onClick={() => sendMessage()} loading={sending} variant="primary" disabled={!activeConv}>
                    <Send className="h-4 w-4" />
                  </LoadingButton>
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}