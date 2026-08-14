import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, Sparkles, RefreshCw, Video, AlertTriangle } from "lucide-react";
import { buildVideoPrompt } from "@/lib/brandPrompts";

export default function StepVideo({ project, persist, goNext, goBack }) {
  const video = project?.video || {};
  const [url, setUrl] = useState(video.url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const prompt = buildVideoPrompt(project);
      const res = await base44.integrations.Core.GenerateVideo({ prompt, duration: 6, aspect_ratio: "16:9", generate_audio: false });
      setUrl(res.url);
      await persist({ video: { url: res.url, prompt }, current_step: "review" });
    } catch (e) { setError(e.message || "Video generation failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Promo Video</h2>
          <p className="text-xs text-white/40">A short cinematic brand video</p>
        </div>
        <Button onClick={generate} disabled={loading} className="bg-lime-400 text-black hover:bg-lime-300">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : url ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {url ? "Regenerate" : "Generate Video"}
        </Button>
      </div>

      <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-300">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Video generation uses more credits and takes ~30-60s. You can skip this step and continue.</span>
      </div>

      {error && <div className="mb-3 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{error}</div>}

      {loading && (
        <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/15 bg-zinc-950">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-lime-400" />
            <p className="mt-2 text-xs text-white/50">Rendering your brand video…</p>
          </div>
        </div>
      )}

      {!loading && url && (
        <video src={url} controls className="aspect-video w-full rounded-lg border border-white/10 bg-black" />
      )}

      {!loading && !url && (
        <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/15 bg-zinc-950">
          <div className="text-center text-white/40">
            <Video className="mx-auto h-8 w-8" />
            <p className="mt-2 text-xs">No video yet</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} className="text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={goNext} className="bg-lime-400 text-black hover:bg-lime-300">Continue to Review <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}