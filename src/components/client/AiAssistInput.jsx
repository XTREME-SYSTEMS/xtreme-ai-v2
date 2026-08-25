import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";

// Reusable AI-assisted text input. Renders a standard text input with a
// small AI button on the right. When pressed, it calls the aiAssistField
// backend function with the field name + everything chosen in prior steps
// (via the `context` prop), then shows the 5 best choices in a dropdown.
// The user clicks one to fill the input.
//
// Props:
//   value, onChange, placeholder — standard input props
//   field — the field key passed to the backend (e.g. "businessName")
//   context — object of prior-step data (industry, location, vision, etc.)
//   className — input className (defaults to the portal input style)
//   inputClassName — overrides the input element class
export default function AiAssistInput({
  value,
  onChange,
  placeholder,
  field,
  context = {},
  className = "",
  inputClassName = "w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none",
  onKeyDown,
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const wrapRef = useRef(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runAssist = async () => {
    setLoading(true);
    setError("");
    setSuggestions([]);
    setOpen(true);
    try {
      const res = await base44.functions.invoke("aiAssistField", {
        field,
        partialText: value || "",
        context,
      });
      const data = res?.data || res;
      if (data?.suggestions?.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        setError(data?.error || "No suggestions. Try typing a word first.");
      }
    } catch (e) {
      setError(e?.message || "Couldn't get suggestions. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const pick = (s) => {
    onChange({ target: { value: s } });
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex items-stretch gap-1.5">
        <input
          type="text"
          value={value || ""}
          onChange={onChange}
          onKeyDown={(e) => {
            if (onKeyDown) onKeyDown(e);
          }}
          placeholder={placeholder}
          className={`${inputClassName} pr-2`}
        />
        <button
          type="button"
          onClick={runAssist}
          disabled={loading}
          title="AI-assist — get 5 best choices based on your prior steps"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-lime-400/40 bg-lime-400/10 px-2.5 text-lime-400 transition-colors hover:bg-lime-400/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-full min-w-[220px] rounded-lg border border-lime-400/30 bg-zinc-950 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-lime-400">
              <Sparkles className="h-3 w-3" /> AI Suggestions
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white/70"
            >
              <ChevronDown className="h-3.5 w-3.5 rotate-180" />
            </button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-xs text-white/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-lime-400" /> Generating best choices…
            </div>
          ) : error ? (
            <div className="px-3 py-3 text-xs text-red-400">{error}</div>
          ) : (
            <div className="max-h-64 overflow-y-auto py-1">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(s)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-lime-400/10 hover:text-lime-300"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10 text-[9px] font-bold text-lime-400">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}