import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, Download, Sparkles } from "lucide-react";
import { buildBusinessCardPrompt } from "@/lib/brandPrompts";

export default function StepBusinessCard({ project, persist, goNext, goBack }) {
  const card = project?.business_card || {};
  const strategy = project?.strategy || {};
  const contact = project?.contact || {};
  const colors = strategy.colors || {};
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [designing, setDesigning] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");

  const designWithAI = async () => {
    setDesigning(true); setError("");
    try {
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: buildBusinessCardPrompt(project) });
      await persist({ business_card: { ...card, front_url: url, prompt: buildBusinessCardPrompt(project) }, current_step: "brochure" });
    } catch (e) { setError(e.message || "AI design failed"); }
    finally { setDesigning(false); }
  };

  const download = async (ref, name) => {
    if (!ref.current) return;
    setDownloading(name);
    try {
      const canvas = await html2canvas(ref.current, { backgroundColor: null, scale: 3, useCORS: true });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${project.business_name || "brand"}-${name}.png`;
      a.click();
    } catch (e) { setError("Download failed — try the AI-designed card instead."); }
    finally { setDownloading(null); }
  };

  const primary = colors.primary || "#0a0a0a";
  const accent = colors.accent || "#D4FF4D";

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Digital Business Card</h2>
          <p className="text-xs text-white/40">Live card built from your brand — download as PNG</p>
        </div>
        <Button onClick={designWithAI} disabled={designing} variant="outline" className="border-white/15 text-white/80 hover:bg-white/5">
          {designing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          AI-Designed Card
        </Button>
      </div>

      {error && <div className="mb-3 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{error}</div>}

      {card.front_url && (
        <div className="mb-4">
          <div className="mb-1 text-xs uppercase tracking-wider text-white/40">AI-Designed Card</div>
          <Image src={card.front_url} alt="AI business card" fittingType="contain" className="w-full max-w-sm rounded-lg border border-white/10 bg-white" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Front */}
        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-white/40">Front</div>
          <div ref={frontRef} className="flex aspect-[1.75/1] flex-col justify-between rounded-lg p-4" style={{ background: primary, color: "#fff" }}>
            <div className="flex items-center gap-2">
              {project.selected_logo_url && <Image src={project.selected_logo_url} alt="logo" fittingType="contain" className="h-8 w-8 bg-white rounded p-0.5" />}
              <span className="text-sm font-semibold">{project.business_name}</span>
            </div>
            <div>
              <div className="text-lg font-bold leading-tight" style={{ color: accent }}>{strategy.tagline || project.business_name}</div>
              <div className="mt-1 text-[10px] opacity-70">{project.industry}</div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => download(frontRef, "card-front")} disabled={downloading === "card-front"} className="mt-2 text-white/70 hover:text-white">
            {downloading === "card-front" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download Front
          </Button>
        </div>
        {/* Back */}
        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-white/40">Back</div>
          <div ref={backRef} className="flex aspect-[1.75/1] flex-col justify-center gap-1.5 rounded-lg p-4" style={{ background: "#fff", color: primary }}>
            <div className="text-base font-bold">{project.business_name}</div>
            {contact.phone && <div className="text-xs">{contact.phone}</div>}
            {contact.email && <div className="text-xs">{contact.email}</div>}
            {contact.website && <div className="text-xs">{contact.website}</div>}
            {contact.address && <div className="text-xs opacity-70">{contact.address}</div>}
            <div className="mt-2 h-1 w-12 rounded" style={{ background: accent }} />
          </div>
          <Button size="sm" variant="ghost" onClick={() => download(backRef, "card-back")} disabled={downloading === "card-back"} className="mt-2 text-white/70 hover:text-white">
            {downloading === "card-back" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download Back
          </Button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} className="text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={goNext} className="bg-lime-400 text-black hover:bg-lime-300">Continue to Brochure <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}