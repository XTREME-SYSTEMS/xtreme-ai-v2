import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, Loader2, AlertCircle, Sparkles, Radar,
  CheckCircle2, Brain, Send, Bot, User,
} from "lucide-react";
import { ONBOARDING_QUESTIONS } from "@/lib/onboardingQuestions";
import { cn } from "@/lib/utils";

// The chat panel — left side of the studio.
// Phase 1: structured onboarding Q&A (AI asks, user answers, skip-trace runs).
// Phase 2: free-form chat — user tells GPT what website to build / change.
export default function ChatPanel({
  session, setSession, traceResults, setTraceResults,
  onOnboardingComplete, onPackRefresh, previewHtml,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("onboarding"); // onboarding | chat
  const [step, setStep] = useState(0);
  const scrollRef = useRef(null);

  // Seed the first AI question when the session loads
  useEffect(() => {
    if (!session) return;
    if (session.current_step >= ONBOARDING_QUESTIONS.length) {
      setPhase("chat");
      setMessages([
        { role: "ai", text: "Onboarding complete! Your strategy is ready. Tell me what kind of website you want to build, or say \"generate website\" to start.", ts: Date.now() },
      ]);
    } else {
      setStep(session.current_step || 0);
      const q = ONBOARDING_QUESTIONS[session.current_step || 0];
      setMessages([
        { role: "ai", text: q.question, hint: q.hint, ts: Date.now() },
      ]);
    }
  }, [session]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  // Rebuild messages from traceResults when session has prior answers
  useEffect(() => {
    if (!session || messages.length > 0) return;
    const prior = Object.entries(traceResults);
    if (prior.length === 0) return;
    const rebuilt = [];
    prior.forEach(([key, val], idx) => {
      const q = ONBOARDING_QUESTIONS.find((x) => x.key === key);
      if (q) rebuilt.push({ role: "ai", text: q.question, ts: idx });
      rebuilt.push({ role: "user", text: val.answer_text, ts: idx + 0.5 });
      if (val.trace) {
        rebuilt.push({
          role: "system", text: `Skip-trace complete: ${val.trace.competitors?.length || 0} competitors found, ${val.trace.sources?.length || 0} sources, ${val.trace.confidence_score || 50}% confidence.`,
          ts: idx + 0.6,
        });
      }
    });
    const nextQ = ONBOARDING_QUESTIONS[session.current_step];
    if (nextQ && session.current_step < ONBOARDING_QUESTIONS.length) {
      rebuilt.push({ role: "ai", text: nextQ.question, hint: nextQ.hint, ts: Date.now() });
    } else if (session.current_step >= ONBOARDING_QUESTIONS.length) {
      setPhase("chat");
      rebuilt.push({ role: "ai", text: "Onboarding complete! Tell me what website to build.", ts: Date.now() });
    }
    setMessages(rebuilt);
  }, [session]);

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
        if (v.answer_text) context[k] = { answer_text: v.answer_text };
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
        [question.key]: {
          answer_text: userText,
          skip_trace_id: traceData?.id,
          answered_at: new Date().toISOString(),
          trace: traceData,
        },
      };
      setTraceResults(newAnswers);

      // System message with trace summary
      setMessages(prev => [...prev, {
        role: "system",
        text: `Researched "${userText}" — found ${traceData?.competitors?.length || 0} competitors, ${traceData?.sources?.length || 0} sources.`,
        trace: traceData,
        ts: Date.now(),
      }]);

      const nextStep = step + 1;
      await base44.entities.OnboardingSession.update(session.id, {
        current_step: nextStep,
        answers: newAnswers,
      });

      if (nextStep >= ONBOARDING_QUESTIONS.length) {
        setPhase("chat");
        setMessages(prev => [...prev, {
          role: "ai",
          text: "All questions answered! Your strategy is locked. Tell me what website to build — say \"generate website\" or describe what you want.",
          ts: Date.now(),
        }]);
        onOnboardingComplete?.(session.session_id || session.id);
      } else {
        const nextQ = ONBOARDING_QUESTIONS[nextStep];
        setStep(nextStep);
        setMessages(prev => [...prev, {
          role: "ai", text: nextQ.question, hint: nextQ.hint, ts: Date.now(),
        }]);
      }
    } catch (e) {
      setError(e.message || "Research failed. You can continue.");
      setMessages(prev => [...prev, {
        role: "system", text: "Research failed — you can continue anyway.", ts: Date.now(), error: true,
      }]);
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
      // If the user asks to generate a website, lock the strategy + send brief
      const wantsGenerate = /generate|build|create|make.*website|website/i.test(userText);

      if (wantsGenerate && !previewHtml) {
        // Lock strategy first (if not already locked)
        const lockRes = await base44.functions.invoke("lockStrategy", {
          session_id: session.session_id || session.id,
        });
        setMessages(prev => [...prev, {
          role: "ai",
          text: `Strategy locked. Here's your website brief — copy it into ChatGPT and paste the result back, or use the sync endpoint:\n\n${lockRes.data?.website_brief || lockRes.data?.strategy_summary || "Brief generated."}`,
          ts: Date.now(),
        }]);
      } else {
        // General chat — acknowledge and refresh packs
        setMessages(prev => [...prev, {
          role: "ai",
          text: "Got it. When GPT sends a mockup via the sync endpoint, it'll appear in the visual editor on the right. You can also paste HTML directly using the \"Paste HTML\" button in the editor.",
          ts: Date.now(),
        }]);
      }
      onPackRefresh?.();
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "ai", text: `Sorry, something went wrong: ${e.message}`, ts: Date.now(), error: true,
      }]);
    }
    setBusy(false);
  };

  const submit = phase === "onboarding" ? submitOnboarding : submitChat;
  const placeholder = phase === "onboarding"
    ? ONBOARDING_QUESTIONS[step]?.placeholder || "Type your answer..."
    : "Describe your website or say \"generate website\"...";

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">
            {phase === "onboarding" ? "AI Onboarding" : "Website Studio Chat"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {phase === "onboarding"
              ? `Step ${step + 1} of ${ONBOARDING_QUESTIONS.length}`
              : "Tell GPT what to build"}
          </div>
        </div>
        {phase === "onboarding" && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: ONBOARDING_QUESTIONS.length }).map((_, i) => (
              <div key={i} className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-muted"
              )} />
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {phase === "onboarding" ? "Researching..." : "Working..."}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder}
            disabled={busy}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 max-h-32"
          />
          <button
            onClick={submit}
            disabled={busy || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  if (msg.role === "ai") {
    return (
      <div className="flex gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 pt-0.5">
          <div className="rounded-lg rounded-tl-none bg-primary/5 px-3 py-2 text-sm text-foreground">
            {msg.text}
          </div>
          {msg.hint && (
            <div className="mt-1 text-xs text-muted-foreground">{msg.hint}</div>
          )}
        </div>
      </div>
    );
  }
  if (msg.role === "user") {
    return (
      <div className="flex gap-2.5 justify-end">
        <div className="flex-1 pt-0.5 text-right">
          <div className="inline-block rounded-lg rounded-tr-none bg-primary px-3 py-2 text-sm text-primary-foreground">
            {msg.text}
          </div>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }
  // system / trace
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {msg.error ? <AlertCircle className="h-4 w-4" /> : <Radar className="h-4 w-4" />}
      </div>
      <div className="flex-1 pt-0.5">
        <div className={cn(
          "rounded-lg border px-3 py-2 text-xs",
          msg.error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-muted/50 text-muted-foreground"
        )}>
          {msg.text}
        </div>
        {msg.trace?.competitors?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {msg.trace.competitors.slice(0, 4).map((c, i) => (
              <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {c.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}