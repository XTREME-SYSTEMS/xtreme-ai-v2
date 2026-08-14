import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, Sparkles, RefreshCw, Download } from "lucide-react";
import { buildBrochureCoverPrompt, buildBrochureCopyPrompt, brochureCopySchema } from "@/lib/brandPrompts";

export default function StepBrochure({ project, persist, goNext, goBack }) {
  const brochure = project?.brochure || {};
  const [cover, setCover] = useState(brochure.cover_url || null);
  const [copy, setCopy] = useState(brochure.copy ? JSON.parse(brochure.copy) : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const [img, text] = await Promise.all([
        base44.integrations.Core.GenerateImage({ prompt: buildBrochureCoverPrompt(project) }),
        base44.integrations.Core.InvokeLLM({ prompt: buildBrochureCopyPrompt(project), response_json_schema: brochureCopySchema() }),
      ]);
      setCover(img.url);
      setCopy(text);
      await persist({ brochure: { cover_url: img.url, copy: JSON.stringify(text), pages: [] }, current_step: "social" });
    } catch (e) { setError(e.message || "Brochure generation failed"); }
    finally { setLoading(false); }
  };

  const downloadCopy = () => {
    if (!copy) return;
    const text = `${copy.headline}\n\n${copy.intro}\n\nServices:\n${(copy.services || []).map((s) => `• ${s.title} — ${s.description}`).join("\n")}\n\nWhy us: ${copy.why_us}\n\n${copy.cta}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = `${project.business_name || "brand"}-brochure.txt`;
    a.click();
  };

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Digital Brochure</h2>
          <p className="text-xs text-white/40">AI-designed cover + written brochure copy</p>
        </div>
        <Button onClick={generate} disabled={loading} className="bg-lime-400 text-black hover:bg-lime-300">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : cover ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {cover ? "Regenerate" : "Generate Brochure"}
        </Button>
      </div>

      {error && <div className="mb-3 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{error}</div>}

      {!cover && !loading && (
        <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
          Click <span className="text-lime-400">Generate Brochure</span> to create your cover and copy.
        </div>
      )}

      {cover && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-1 text-xs uppercase tracking-wider text-white/40">Cover</div>
            <Image src={cover} alt="brochure cover" fittingType="fill" className="aspect-[3/4] w-full max-w-xs rounded-lg border border-white/10" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-white/40">Copy</div>
              <Button size="sm" variant="ghost" onClick={downloadCopy} className="text-white/70 hover:text-white"><Download className="h-3.5 w-3.5" /> .txt</Button>
            </div>
            {copy && (
              <div className="space-y-3 rounded-lg border border-white/10 bg-zinc-950 p-4">
                <div>
                  <div className="text-lg font-bold text-white">{copy.headline}</div>
                  <p className="mt-1 text-sm text-white/70">{copy.intro}</p>
                </div>
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wider text-lime-400/80">Services</div>
                  {(copy.services || []).map((s, i) => (
                    <div key={i}>
                      <div className="text-sm font-medium text-white">{s.title}</div>
                      <div className="text-xs text-white/50">{s.description}</div>
                    </div>
                  ))}
                </div>
                <div className="text-sm"><span className="text-white/40">Why us: </span><span className="text-white/80">{copy.why_us}</span></div>
                <div className="rounded bg-lime-400/10 p-2 text-sm text-lime-300">{copy.cta}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} className="text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={goNext} disabled={!cover} className="bg-lime-400 text-black hover:bg-lime-300">Continue to Social <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}