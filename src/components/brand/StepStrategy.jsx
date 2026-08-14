import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Palette, Type, MessageSquareQuote } from "lucide-react";
import { strategySchema, buildStrategyPrompt } from "@/lib/brandPrompts";

export default function StepStrategy({ project, persist, goNext, goBack }) {
  const [strategy, setStrategy] = useState(project?.strategy || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const data = await base44.integrations.Core.InvokeLLM({ prompt: buildStrategyPrompt(project), response_json_schema: strategySchema() });
      setStrategy(data);
      await persist({ strategy: data, current_step: "logo" });
    } catch (e) { setError(e.message || "Failed to generate strategy"); }
    finally { setLoading(false); }
  };

  const colors = strategy?.colors || {};

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Brand Strategy</h2>
          <p className="text-xs text-white/40">AI builds your positioning, voice, palette & type</p>
        </div>
        <Button onClick={generate} disabled={loading} className="bg-lime-400 text-black hover:bg-lime-300">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {strategy ? "Regenerate" : "Generate Strategy"}
        </Button>
      </div>

      {error && <div className="mb-3 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{error}</div>}

      {!strategy && !loading && (
        <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
          Click <span className="text-lime-400">Generate Strategy</span> to build your brand identity from the brief.
        </div>
      )}

      {strategy && (
        <div className="space-y-4">
          <div className="rounded-lg border border-lime-400/30 bg-lime-400/5 p-4 text-center">
            <div className="text-xs uppercase tracking-wider text-lime-400/80">Tagline</div>
            <div className="mt-1 text-xl font-semibold text-white">“{strategy.tagline}”</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Positioning" value={strategy.positioning} />
            <Field label="Brand Promise" value={strategy.promise} />
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-950 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40"><MessageSquareQuote className="h-3.5 w-3.5" /> Voice</div>
            <p className="text-sm text-white/80">{strategy.voice}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-zinc-950 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40"><Palette className="h-3.5 w-3.5" /> Colors</div>
              <div className="flex gap-2">
                {["primary", "accent", "neutral"].map((k) => (
                  <div key={k} className="flex-1">
                    <div className="h-10 rounded border border-white/10" style={{ background: colors[k] || "#222" }} />
                    <div className="mt-1 text-[10px] text-white/50">{k}: {colors[k] || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-zinc-950 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40"><Type className="h-3.5 w-3.5" /> Typography</div>
              <div className="text-sm text-white/80"><span className="text-white/40">Heading:</span> {strategy.typography?.heading || "—"}</div>
              <div className="text-sm text-white/80"><span className="text-white/40">Body:</span> {strategy.typography?.body || "—"}</div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-950 p-3">
            <div className="mb-1 text-xs uppercase tracking-wider text-white/40">Logo Direction</div>
            <p className="text-sm text-white/80">{strategy.logo_direction}</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} className="text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={goNext} disabled={!strategy} className="bg-lime-400 text-black hover:bg-lime-300">Continue to Logo <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950 p-3">
      <div className="mb-1 text-xs uppercase tracking-wider text-white/40">{label}</div>
      <p className="text-sm text-white/80">{value || "—"}</p>
    </div>
  );
}