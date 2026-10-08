import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2, AlertCircle, Radar, Send, Bot, User,
  Plus, BookOpen, Paperclip, Mic, Zap,
} from "lucide-react";
import { ONBOARDING_QUESTIONS } from "@/lib/onboardingQuestions";
import { cn } from "@/lib/utils";

const AMBER = "#FF8C00";

// Middle panel — the command shell chat on pure black.
export default function ChatPanel({
  session, setSession, traceResults, setTraceResults,
  onOnboardingComplete, onPackRefresh, previewHtml,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("onboarding");
  const [step, setStep] = useState(0);
  const [seeded, setSeeded] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!session || seeded) return;
    const startStep = session.current_step || 0;
    if (startStep >= ONBOARDING_QUESTIONS.length) {
      setPhase("chat");
      setMessages([
        { role: "ai", text: "Onboarding complete. Your strategy is locked. Tell me what website to build — say \"generate website\" or describe what you want.", ts: Date.now() },
      ]);
    } else {
      setStep(startStep);
      const q = ONBOARDING_QUESTIONS[startStep];
      setMessages([{ role: "ai", text: q.question, hint: q.hint, ts: Date.now() }]);
    }
    setSeeded(true);
  }, [session, seeded]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const submitOnboarding = async () => {
    if (!input.trim() || !session || busy) return;
    const userText = input.trim();
    const question = ONBOARDING_QUESTIONS[step];
    setMessages(prev => [...prev, { role: "user", text: userText, ts: Date.now() }]);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const context = {};
      Object.entries(traceResults).forEach(([k, v]) => {
        if (v?.answer_text) context[k] = { answer_text: v.answer_text };
      });
      const res = await base44.functions.invoke("skipTraceAnswer", {
        session_id: session.session_id || session.id,
        question_key: question.key,
        answer_text: userText,
        context,
      });
      const traceData = res.data?.report || res.data;
      const newAnswers = {
        ...traceResults,
        [question.key]: { answer_text: userText, skip_trace_id: traceData?.id, answered_at: new Date().toISOString(), trace: traceData },
      };
      setTraceResults(newAnswers);
      setMessages(prev => [...prev, {
        role: "system",
        text: `Researched "${userText}" — ${traceData?.competitors?.length || 0} competitors, ${traceData?.sources?.length || 0} sources, ${traceData?.confidence_score || 50}% confidence.`,
        trace: traceData, ts: Date.now(),
      }]);
      const nextStep = step + 1;
      await base44.entities.OnboardingSession.update(session.id, { current_step: nextStep, answers: newAnswers });
      if (nextStep >= ONBOARDING_QUESTIONS.length) {
        setPhase("chat");
        setMessages(prev => [...prev, { role: "ai", text: "All questions answered. Strategy locked. Tell me what website to build, or say \"generate website\".", ts: Date.now() }]);
        onOnboardingComplete?.(session.session_id || session.id);
      } else {
        const nextQ = ONBOARDING_QUESTIONS[nextStep];
        setStep(nextStep);
        setMessages(prev => [...prev, { role: "ai", text: nextQ.question, hint: nextQ.hint, ts: Date.now() }]);
      }
    } catch (e) {
      setError(e.message || "Research failed.");
      setMessages(prev => [...prev, { role: "system", text: "Research failed — you can continue anyway.", ts: Date.now(), error: true }]);
    }
    setBusy(false);
  };

  const submitChat = async () => {
    if (!input.trim() || busy) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userText, ts: Date.now() }]);
    setInput("");
    setBusy(true);
    try {
      const wantsGenerate = /generate|build|create|make.*website|website/i.test(userText);
      if (wantsGenerate && !previewHtml) {
        const lockRes = await base44.functions.invoke("lockStrategy", { session_id: session.session_id || session.id });
        setMessages(prev => [...prev, {
          role: "ai",
          text: `Strategy locked. Website brief ready — copy it into ChatGPT or use the sync endpoint. The mockup will appear in the workbench Preview tab.\n\n${(lockRes.data?.website_brief || lockRes.data?.strategy_summary || "Brief generated.").slice(0, 500)}...`,
          ts: Date.now(),
        }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: "Got it. When GPT sends a mockup via the sync endpoint, it appears in the workbench Preview tab. You can also paste HTML there directly.", ts: Date.now() }]);
      }
      onPackRefresh?.();
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", text: `Error: ${e.message}`, ts: Date.now(), error: true }]);
    }
    setBusy(false);
  };

  const submit = phase === "onboarding" ? submitOnboarding : submitChat;
  const isEmpty = messages.length === 0;
  const placeholder = phase === "onboarding"
    ? ONBOARDING_QUESTIONS[step]?.placeholder || "Type your answer..."
    : "Ask anything, build anything...";

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-black">
      {/* Glowing amber arc background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[420px] w-[420px] rounded-full opacity-20 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${AMBER} 0%, transparent 70%)` }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black text-white"
          style={{ background: AMBER }}>
          D2
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-white">Digital Dominance 2.0</div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[10px] font-medium text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Vercel Gateway
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> GPT · unbound
          </span>
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-bold text-green-400">
            AUTO ROUTING ON
          </span>
        </div>
      </div>

      {/* Messages / Empty state */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
        {isEmpty && !busy ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-bold text-white">
              What are we <span style={{ color: AMBER }}>dominating</span>?
            </h2>
            <p className="mt-3 text-sm text-white/40">
              Answer onboarding questions in the chat, or fill the intake form in the workbench.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: AMBER }} />
                {phase === "onboarding" ? "Researching..." : "Working..."}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="relative z-10 px-4 pb-3">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/80 backdrop-blur p-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder={placeholder}
              disabled={busy}
              rows={1}
              className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50 max-h-32"
            />
            <div className="flex items-center gap-1 px-2 pb-1.5">
              <ToolbarIcon icon={Plus} label="Add" />
              <button className="flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] text-white/30 hover:bg-white/5 hover:text-white/60">
                <BookOpen className="h-4 w-4" /> Prompts
              </button>
              <ToolbarIcon icon={Paperclip} label="Attach" />
              <ToolbarIcon icon={Mic} label="Voice" />
              <button onClick={submit} disabled={busy || !input.trim()}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-30"
                style={{ background: AMBER }}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="mt-1.5 text-center text-[10px] text-white/20">
            Digital Dominance 2.0 · Apex command · independently validated
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarIcon({ icon: Icon, label }) {
  return (
    <button title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white/60">
      <Icon className="h-4 w-4" />
    </button>
  );
}

function MessageBubble({ msg }) {
  if (msg.role === "ai") {
    return (
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ background: `${AMBER}20` }}>
          <Bot className="h-4 w-4" style={{ color: AMBER }} />
        </div>
        <div className="flex-1 pt-1">
          <div className="rounded-xl rounded-tl-none bg-[#1a1a1a] px-4 py-2.5 text-sm text-white whitespace-pre-wrap">{msg.text}</div>
          {msg.hint && <div className="mt-1.5 text-xs text-white/30">{msg.hint}</div>}
        </div>
      </div>
    );
  }
  if (msg.role === "user") {
    return (
      <div className="flex gap-3 justify-end">
        <div className="flex-1 pt-1 text-right">
          <div className="inline-block rounded-xl rounded-tr-none px-4 py-2.5 text-sm text-white"
            style={{ background: AMBER }}>
            {msg.text}
          </div>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/40">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/40">
        {msg.error ? <AlertCircle className="h-4 w-4" /> : <Radar className="h-4 w-4" />}
      </div>
      <div className="flex-1 pt-1">
        <div className={cn("rounded-lg border px-3 py-2 text-xs",
          msg.error ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-white/10 bg-white/5 text-white/50")}>
          {msg.text}
        </div>
        {msg.trace?.competitors?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {msg.trace.competitors.slice(0, 5).map((c, i) => (
              <span key={i} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">{c.name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}