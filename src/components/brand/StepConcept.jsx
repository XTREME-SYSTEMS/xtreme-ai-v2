import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Sparkles } from "lucide-react";
import { brandBriefSchema } from "@/lib/brandPrompts";

const QUESTIONS = [
  "What's the name of your business?",
  "What does your business do — what products or services do you offer?",
  "Who is your ideal customer?",
  "Where are you located, or what area do you serve?",
  "Describe the vibe or style you want for the brand (e.g. modern, luxury, friendly, bold, minimal).",
  "What contact info should appear on your brand assets? (phone, email, website)",
];

export default function StepConcept({ project, ensureProject, goNext }) {
  const [messages, setMessages] = useState([{ role: "ai", text: `Hi! I'm your brand strategist. Let's build your brand from scratch. ${QUESTIONS[0]}` }]);
  const [input, setInput] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  const send = async () => {
    if (!input.trim() || thinking) return;
    const answer = input.trim();
    const nextQ = qIndex + 1;
    setMessages((m) => [...m, { role: "user", text: answer }]);
    setInput("");
    setThinking(true);
    try {
      if (nextQ < QUESTIONS.length) {
        const prompt = `You are a friendly brand strategist interviewing a user to build their brand. You just asked: "${QUESTIONS[qIndex]}". They answered: "${answer}". Briefly acknowledge their answer in one short sentence, then naturally ask this next question: "${QUESTIONS[nextQ]}". Return only your message.`;
        const reply = await base44.integrations.Core.InvokeLLM({ prompt });
        setMessages((m) => [...m, { role: "ai", text: reply }]);
      } else {
        const prompt = `You are a friendly brand strategist. The user finished all intake questions. Their last answer: "${answer}". Thank them warmly in one sentence and say "That's everything I need — tap Generate Brand Brief below to build your strategy." Return only your message.`;
        const reply = await base44.integrations.Core.InvokeLLM({ prompt });
        setMessages((m) => [...m, { role: "ai", text: reply }]);
      }
      setQIndex(nextQ);
    } catch (e) {
      if (nextQ < QUESTIONS.length) setMessages((m) => [...m, { role: "ai", text: QUESTIONS[nextQ] }]);
      setQIndex(nextQ);
    } finally {
      setThinking(false);
    }
  };

  const generateBrief = async () => {
    setExtracting(true); setError("");
    try {
      const transcript = messages.map((m) => `${m.role === "ai" ? "Strategist" : "You"}: ${m.text}`).join("\n");
      const prompt = `From this brand intake conversation, extract a structured brand brief. Fill every field; use empty string if missing.\n\n${transcript}`;
      const brief = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: brandBriefSchema() });
      await ensureProject({
        business_name: brief.business_name || "Untitled Brand",
        industry: brief.industry || "",
        description: brief.description || "",
        audience: brief.audience || "",
        vibe: brief.vibe || "",
        contact: brief.contact || {},
        current_step: "strategy",
        status: "running",
        logs: ["Concept brief generated"],
      });
      goNext();
    } catch (e) {
      setError(e.message || "Failed to generate brief");
    } finally {
      setExtracting(false);
    }
  };

  const allAnswered = qIndex >= QUESTIONS.length;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-lime-400" />
        <h2 className="text-sm font-semibold text-white">Brand Interview</h2>
        <span className="text-xs text-white/40">· answer naturally, I'll guide you</span>
      </div>
      <div className="h-80 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-lime-400 text-black" : "bg-zinc-800 text-white"}`}>{m.text}</div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-800 px-4 py-2.5"><Loader2 className="h-4 w-4 animate-spin text-white/60" /></div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
      {error && <div className="mt-3 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{error}</div>}
      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={allAnswered ? "All set — generate your brief" : "Type your answer…"}
          className="flex-1 rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
        />
        {!allAnswered ? (
          <Button onClick={send} disabled={thinking || !input.trim()} className="h-10 bg-lime-400 text-black hover:bg-lime-300">
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={generateBrief} disabled={extracting} className="h-10 bg-lime-400 text-black hover:bg-lime-300">
            {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Brief
          </Button>
        )}
      </div>
    </div>
  );
}