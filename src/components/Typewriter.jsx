import { useEffect, useState } from "react";

// Types out `text` character-by-character with a blinking cursor, preceded
// by a brief "assistant is typing" indicator — gives a chatbot-talking feel.
export default function Typewriter({ text, speed = 24, startDelay = 650, className, onDone }) {
  const [phase, setPhase] = useState("typing");
  const [shown, setShown] = useState("");

  useEffect(() => {
    setPhase("typing");
    setShown("");
    let interval = null;
    let i = 0;
    const startTimer = setTimeout(() => {
      setPhase("writing");
      interval = setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          interval = null;
          setPhase("done");
          if (onDone) onDone();
        }
      }, speed);
    }, startDelay);
    return () => { clearTimeout(startTimer); if (interval) clearInterval(interval); };
  }, [text, speed, startDelay]);

  if (phase === "typing") {
    return (
      <span className={`inline-flex items-center gap-1 ${className || ""}`}>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "300ms" }} />
      </span>
    );
  }

  return (
    <span className={className}>
      {shown}
      <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse rounded-sm bg-lime-500" />
    </span>
  );
}