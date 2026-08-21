import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Loader2, Send, Sparkles, Paperclip, X } from "lucide-react";

function defaultReplyPrompt(qIndex, answer, nextQuestion, currentQuestion, hasImage) {
  return `You are a friendly brand strategist interviewing a user to build their brand. You just asked: "${currentQuestion}". They answered: "${answer}". ${hasImage ? "They also attached an inspiration image — acknowledge it briefly in your reply. " : ""}Briefly acknowledge their answer in one short sentence, then naturally ask this next question: "${nextQuestion}". Return only your message.`;
}

function defaultFinalPrompt(answer, hasImage, completeLabel) {
  return `You are a friendly brand strategist. The user finished all intake questions. Their last answer: "${answer}". ${hasImage ? "They attached an inspiration image. " : ""}Thank them warmly in one sentence and say "That's everything I need — tap ${completeLabel} below to continue." Return only your message.`;
}

export default function AiOnboardingChat({
  title,
  subtitle,
  questions,
  greetingPrefix,
  replyPrompt,
  finalPrompt,
  extractionPrompt,
  extractionSchema,
  onComplete,
  completeLabel = "Generate Brief",
  aiRoleName = "Strategist",
}) {
  const [messages, setMessages] = useState([{ role: "ai", text: `${greetingPrefix} ${questions[0]}` }]);
  const [input, setInput] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachment({ url: file_url, name: file.name, preview: URL.createObjectURL(file) });
    } catch (err) {
      setError("Couldn't upload that image — try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const send = async () => {
    if ((!input.trim() && !attachment) || thinking) return;
    const answer = input.trim();
    const nextQ = qIndex + 1;
    const attachedUrl = attachment?.url;
    setMessages((m) => [...m, { role: "user", text: answer || "(image attached)", image: attachedUrl }]);
    setInput("");
    setAttachment(null);
    setThinking(true);
    try {
      const fileUrls = attachedUrl ? [attachedUrl] : undefined;
      if (nextQ < questions.length) {
        const prompt = replyPrompt
          ? replyPrompt(qIndex, answer, questions[nextQ], questions[qIndex], !!attachedUrl)
          : defaultReplyPrompt(qIndex, answer, questions[nextQ], questions[qIndex], !!attachedUrl);
        const reply = await base44.integrations.Core.InvokeLLM(fileUrls ? { prompt, file_urls: fileUrls } : { prompt });
        setMessages((m) => [...m, { role: "ai", text: reply }]);
      } else {
        const prompt = finalPrompt
          ? finalPrompt(answer, !!attachedUrl)
          : defaultFinalPrompt(answer, !!attachedUrl, completeLabel);
        const reply = await base44.integrations.Core.InvokeLLM(fileUrls ? { prompt, file_urls: fileUrls } : { prompt });
        setMessages((m) => [...m, { role: "ai", text: reply }]);
      }
      setQIndex(nextQ);
    } catch (e) {
      if (nextQ < questions.length) setMessages((m) => [...m, { role: "ai", text: questions[nextQ] }]);
      setQIndex(nextQ);
    } finally {
      setThinking(false);
    }
  };

  const finish = async () => {
    setExtracting(true); setError("");
    try {
      const transcript = messages.map((m) => `${m.role === "ai" ? aiRoleName : "You"}: ${m.text}${m.image ? " [image attached]" : ""}`).join("\n");
      const prompt = extractionPrompt(transcript);
      const data = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: extractionSchema });
      await onComplete(data);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setExtracting(false);
    }
  };

  const allAnswered = qIndex >= questions.length;
  const canSend = !!input.trim() || !!attachment;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-lime-400" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-xs text-white/40">· {subtitle}</span>
      </div>

      <div ref={scrollRef} className="h-80 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-lime-400 text-black" : "bg-zinc-800 text-white"}`}>
              {m.image && <Image src={m.image} alt="attachment" fittingType="fill" className="mb-1 h-28 w-28 rounded-lg" />}
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-800 px-4 py-2.5"><Loader2 className="h-4 w-4 animate-spin text-white/60" /></div>
          </div>
        )}
        <div />
      </div>

      {error && <div className="mt-3 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{error}</div>}

      {attachment && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-zinc-950 px-2 py-1">
          <img src={attachment.preview} alt="preview" className="h-8 w-8 rounded object-cover" />
          <span className="max-w-[140px] truncate text-xs text-white/60">{attachment.name}</span>
          <button onClick={() => setAttachment(null)} className="text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={allAnswered ? "All set — finish up below" : "Type your answer…"}
          className="flex-1 rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
        />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={thinking || uploading}
          variant="outline"
          className="h-10 shrink-0 border-white/15 text-white/70 hover:bg-white/5 hover:text-white"
          title="Attach an inspiration image"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </Button>
        {!allAnswered ? (
          <Button onClick={send} disabled={thinking || !canSend} className="h-10 shrink-0 bg-lime-400 text-black hover:bg-lime-300">
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={extracting} className="h-10 shrink-0 bg-lime-400 text-black hover:bg-lime-300">
            {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {completeLabel}
          </Button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
    </div>
  );
}