import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Gauge, Loader2, Sparkles, CheckCircle2, AlertTriangle, Wand2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Self-service website quality panel. Lets the client run an AI quality
// audit on their generated website copy, see per-section scores + concrete
// fixes, and auto-enhance weak sections in place — no admin, no restarting
// the pipeline, no backtracking. This is the client-facing half of the
// generate→critique→fix loop (backed by the websiteQualityGate function).
export default function WebsiteQualityPanel({ content, profile, onEnhanced }) {
  const [running, setRunning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [enhanced, setEnhanced] = useState(false);

  const runCheck = async (autoFix = false) => {
    if (!content) return;
    if (autoFix) setFixing(true);
    else setRunning(true);
    setError("");
    try {
      const res = await base44.functions.invoke("websiteQualityGate", {
        content,
        profile,
        autoFix,
      });
      const data = res?.data || res;
      if (data?.ok) {
        setResult(data);
        if (autoFix && data.fixedContent && onEnhanced) {
          await onEnhanced(data.fixedContent);
          setEnhanced(true);
        }
      } else {
        setError(data?.error || "Quality check failed. Try again.");
      }
    } catch (e) {
      setError(e?.message || "Quality check failed. Try again.");
    } finally {
      setRunning(false);
      setFixing(false);
    }
  };

  const scoreColor = (n) =>
    n >= 80 ? "text-lime-400" : n >= 60 ? "text-amber-400" : "text-red-400";
  const scoreBg = (n) =>
    n >= 80 ? "bg-lime-400" : n >= 60 ? "bg-amber-400" : "bg-red-400";

  const overall = result?.overallScore || 0;

  return (
    <div className="mt-3 rounded-xl border border-lime-400/20 bg-lime-400/5 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
        <Gauge className="h-3.5 w-3.5" /> AI Quality Audit
      </div>
      <p className="mt-1 text-xs text-white/50">
        Run an AI quality audit on your website copy. See scores for conversion, local SEO, and AI-search readiness — then auto-enhance any weak sections instantly.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => runCheck(false)}
          disabled={running || fixing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-xs font-semibold text-lime-300 hover:bg-lime-400/20 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gauge className="h-3.5 w-3.5" />}
          {running ? "Auditing…" : "Run Quality Audit"}
        </button>
        {result && (
          <button
            type="button"
            onClick={() => runCheck(true)}
            disabled={running || fixing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
          >
            {fixing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {fixing ? "Enhancing…" : "Auto-Enhance Weak Sections"}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
          <AlertTriangle className="h-3.5 w-3.5" /> {error}
        </div>
      )}

      {enhanced && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-xs text-lime-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> Weak sections enhanced — your website copy has been updated.
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-3">
          {/* Overall score */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Overall Quality</span>
                <span className={cn("font-mono font-bold", scoreColor(overall))}>{overall}/100</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10">
                <div className={cn("h-full rounded-full transition-all", scoreBg(overall))} style={{ width: `${overall}%` }} />
              </div>
            </div>
          </div>

          {/* Per-section scores */}
          {result.sections && Object.keys(result.sections).length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(result.sections).map(([key, s]) => {
                const sc = s?.score ?? 0;
                return (
                  <div key={key} className="rounded-lg border border-white/10 bg-black/30 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{key}</span>
                      <span className={cn("font-mono text-xs font-bold", scoreColor(sc))}>{sc}</span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-white/10">
                      <div className={cn("h-full rounded-full", scoreBg(sc))} style={{ width: `${sc}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top fixes */}
          {result.fixes && result.fixes.length > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">Top fixes identified</div>
              <ul className="space-y-1.5">
                {result.fixes.slice(0, 5).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-white/60">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-lime-400/60" />
                    <span><span className="font-semibold text-white/80 capitalize">{f.section}:</span> {f.fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}