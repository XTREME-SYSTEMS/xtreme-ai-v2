import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send } from "lucide-react";

// Lightweight assistant chat that lives in the client shell's right column.
export default function ClientAssistantChat({ user, pkg }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Hi${user?.full_name ? ` ${user.full_name}` : ""}! I'm your assistant. Ask me anything about your ${pkg?.title || "build"} or what's next.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    if (!input.trim() || thinking) return;
    const q = input.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    try {
      const prompt =
        `You are a friendly, concise assistant for a client on the "${pkg?.title || "Brand Build"}" plan. ` +
        `Their package steps: ${(pkg?.steps || []).map((s) => s.label).join(", ")}. ` +
        `Answer briefly and helpfully. If they should approve something, remind them approvals live in the timeline. Question: ${q}`;
      const reply = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: "Sorry, I couldn't reach the AI just now. Try again in a moment." }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
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
            placeholder="Ask about your build…"
            className="flex-1 rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={thinking || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-400 text-black hover:bg-lime-300 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}