import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send } from "lucide-react";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";
import {
  computePipelineState,
  currentPipelineStep,
} from "@/lib/pipelineState";
import {
  buildAssistantPrompt,
  buildOpener,
} from "@/lib/assistantStepPrompts";

// Lightweight assistant chat that lives in the client shell's right column.
// It scopes every reply to the user's CURRENT pipeline step — asking only the
// specific questions relevant to that step, plus what comes next — instead of
// being an open-ended "ask me anything" box.
export default function ClientAssistantChat({ user, pkg }) {
  const { effectiveEmail } = usePreviewEmail(user);
  const [approvals, setApprovals] = useState([]);
  const [signals, setSignals] = useState({});
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  // Resolve the user's current pipeline step (same logic as ClientStartHere).
  useEffect(() => {
    if (!effectiveEmail) { setReady(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const [a, sigRes] = await Promise.all([
          base44.entities.Approval.filter(
            { client_email: effectiveEmail },
            "-created_date",
            100
          ),
          base44.functions
            .invoke("getPipelineSignals", { email: effectiveEmail })
            .then((r) => r.data || {})
            .catch(() => ({})),
        ]);
        if (cancelled) return;
        setApprovals(a || []);
        setSignals(sigRes);
      } catch (e) {
        /* ignore */
      }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, [effectiveEmail]);

  const states = computePipelineState(user, approvals, signals);
  const current = currentPipelineStep(user, approvals, signals);
  const step = current?.step;
  const pendingApproval = current?.pendingApproval || null;

  // Seed the step-specific opener once the step is known.
  useEffect(() => {
    if (!ready || !step || messages.length > 0) return;
    setMessages([{ role: "ai", text: buildOpener(step, pendingApproval, user) }]);
  }, [ready, step, pendingApproval, user, messages.length]);

  // If the step changes (e.g. an approval was decided), re-seed with the new opener.
  const stepKey = step?.key;
  const lastStepKeyRef = useRef(stepKey);
  useEffect(() => {
    if (!ready || !stepKey) return;
    if (lastStepKeyRef.current && lastStepKeyRef.current !== stepKey) {
      setMessages([{ role: "ai", text: buildOpener(step, pendingApproval, user) }]);
    }
    lastStepKeyRef.current = stepKey;
  }, [stepKey, ready, step, pendingApproval, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    if (!input.trim() || thinking || !step) return;
    const q = input.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    try {
      const systemPrompt = buildAssistantPrompt(step, pendingApproval);
      const history = messages
        .map((m) => `${m.role === "user" ? "Client" : "Assistant"}: ${m.text}`)
        .join("\n");
      const prompt =
        `${systemPrompt}\n\nConversation so far:\n${history}\n\nClient: ${q}\n\nAssistant:`;
      const reply = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: "Sorry, I couldn't reach the AI just now. Try again in a moment." }]);
    } finally {
      setThinking(false);
    }
  };

  const placeholder = step
    ? pendingApproval
      ? "Ask about what you're approving…"
      : "Answer the question above…"
    : "Loading your step…";

  return (
    <div className="flex h-full flex-col">
      {/* Step badge so the user knows which step the chat is scoped to */}
      {step && (
        <div className="border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <step.icon className="h-4 w-4 text-lime-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
              {step.label}
            </span>
            {pendingApproval && (
              <span className="ml-auto rounded-full border border-amber-400/50 bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                Approval needed
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-lime-400 text-black" : "bg-zinc-800 text-white"}`}>
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-800 px-3 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-white/60" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={placeholder}
            disabled={!step}
            className="flex-1 rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={thinking || !input.trim() || !step}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-400 text-black hover:bg-lime-300 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}