import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Check, RefreshCw } from "lucide-react";
import { buildLogoPrompt } from "@/lib/brandPrompts";

const STYLES = ["minimalist geometric mark", "modern wordmark", "emblem badge", "abstract icon"];

export default function StepLogo({ project, persist, goNext, goBack }) {
  const [logos, setLogos] = useState(project?.logos || []);
  const [selected, setSelected] = useState(project?.selected_logo_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const results = await Promise.all(STYLES.slice(0, 3).map(async (style) => {
        const { url } = await base44.integrations.Core.GenerateImage({ prompt: buildLogoPrompt(project, style) });
        return { url, prompt: buildLogoPrompt(project, style), style, selected: false };
      }));
      setLogos(results);
    } catch (e) { setError(e.message || "Logo generation failed"); }
    finally { setLoading(false); }
  };

  const pick = async (url) => {
    setSelected(url);
    const updated = logos.map((l) => ({ ...l, selected: l.url === url }));
    setLogos(updated);
    await persist({ logos: updated, selected_logo_url: url, current_step: "business_card" });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Logo Generator</h2>
          <p className="text-xs text-white/40">AI generates 3 logo options from your brand direction</p>
        </div>
        <Button onClick={generate} disabled={loading} className="bg-lime-400 text-black hover:bg-lime-300">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : logos.length ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {logos.length ? "Regenerate" : "Generate Logos"}
        </Button>
      </div>

      {error && <div className="mb-3 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{error}</div>}

      {loading && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-zinc-800" />)}
        </div>
      )}

      {!loading && logos.length === 0 && (
        <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
          Click <span className="text-lime-400">Generate Logos</span> to create your logo options.
        </div>
      )}

      {logos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {logos.map((l) => (
            <button key={l.url} onClick={() => pick(l.url)} className={`group relative overflow-hidden rounded-lg border bg-white p-2 transition-colors ${selected === l.url ? "border-lime-400 ring-2 ring-lime-400/40" : "border-white/10 hover:border-white/30"}`}>
              <Image src={l.url} alt={l.style} fittingType="contain" className="aspect-square w-full" />
              {selected === l.url && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-lime-400 text-black"><Check className="h-4 w-4" /></div>
              )}
              <div className="mt-1 text-[10px] capitalize text-white/0">{l.style}</div>
            </button>
          ))}
        </div>
      )}

      {selected && <p className="mt-3 text-xs text-lime-400">✓ Logo selected — continue to build your business card.</p>}

      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} className="text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={goNext} disabled={!selected} className="bg-lime-400 text-black hover:bg-lime-300">Continue to Business Card <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}