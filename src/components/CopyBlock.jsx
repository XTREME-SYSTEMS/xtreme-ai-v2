import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyBlock({ label, value, type = "text" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value || ""); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const isCode = type === "code";
  return (
    <div className="rounded-lg border border-white/10 bg-black">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</span>
        <button onClick={copy} className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-lime-300 hover:bg-lime-400/10">{copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}</button>
      </div>
      {isCode ? <pre className="max-h-64 overflow-auto p-3 text-xs text-white/70">{value}</pre> : <div className="p-3 text-sm text-white/80">{value}</div>}
    </div>
  );
}