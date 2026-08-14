import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, CheckCircle2, Sparkles } from "lucide-react";

export default function StepReview({ project, persist, goBack }) {
  const strategy = project?.strategy || {};
  const colors = strategy.colors || {};
  const contact = project?.contact || {};
  const brochure = project?.brochure || {};
  const posts = project?.social_posts || [];
  const video = project?.video || {};

  const dl = (url, name) => { const a = document.createElement("a"); a.href = url; a.download = name; a.target = "_blank"; a.click(); };

  const complete = async () => {
    await persist({ current_step: "complete", status: "complete" });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-lime-400" />
          <h2 className="text-sm font-semibold text-white">Your Brand Kit is Ready</h2>
        </div>
        <p className="mt-1 text-xs text-white/50">{project.business_name} · {project.industry}</p>
      </div>

      {/* Strategy */}
      <Section title="Brand Strategy">
        <div className="text-lg font-semibold text-white">“{strategy.tagline}”</div>
        <p className="text-sm text-white/70">{strategy.positioning}</p>
        <div className="mt-2 flex gap-2">
          {["primary", "accent", "neutral"].map((k) => (
            <div key={k} className="flex items-center gap-1.5 rounded border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] text-white/60">
              <span className="h-3 w-3 rounded" style={{ background: colors[k] || "#222" }} /> {k}
            </div>
          ))}
        </div>
      </Section>

      {/* Logo */}
      {project.selected_logo_url && (
        <Section title="Logo">
          <div className="flex items-center gap-3">
            <Image src={project.selected_logo_url} alt="logo" fittingType="contain" className="h-24 w-24 rounded-lg border border-white/10 bg-white p-1" />
            <Button size="sm" variant="ghost" onClick={() => dl(project.selected_logo_url, "logo.png")} className="text-white/70 hover:text-white"><Download className="h-3.5 w-3.5" /> PNG</Button>
          </div>
        </Section>
      )}

      {/* Business card */}
      {project.business_card?.front_url && (
        <Section title="Business Card">
          <Image src={project.business_card.front_url} alt="card" fittingType="contain" className="w-full max-w-sm rounded-lg border border-white/10 bg-white" />
        </Section>
      )}

      {/* Brochure */}
      {brochure.cover_url && (
        <Section title="Brochure">
          <div className="flex items-start gap-3">
            <Image src={brochure.cover_url} alt="brochure" fittingType="fill" className="aspect-[3/4] w-28 rounded-lg border border-white/10" />
            <p className="text-xs text-white/60">{brochure.copy ? JSON.parse(brochure.copy).intro : ""}</p>
          </div>
        </Section>
      )}

      {/* Social */}
      {posts.length > 0 && (
        <Section title="Social Posts">
          <div className="grid grid-cols-3 gap-2">
            {posts.map((p) => (
              <Image key={p.platform} src={p.image_url} alt={p.platform} fittingType="fill" className="aspect-square w-full rounded-lg border border-white/10" />
            ))}
          </div>
        </Section>
      )}

      {/* Video */}
      {video.url && (
        <Section title="Promo Video">
          <video src={video.url} controls className="aspect-video w-full rounded-lg border border-white/10 bg-black" />
        </Section>
      )}

      {/* Contact */}
      <Section title="Contact on file">
        <div className="text-xs text-white/60">
          {contact.phone && <div>{contact.phone}</div>}
          {contact.email && <div>{contact.email}</div>}
          {contact.website && <div>{contact.website}</div>}
          {contact.address && <div>{contact.address}</div>}
        </div>
      </Section>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} className="text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={complete} className="bg-lime-400 text-black hover:bg-lime-300"><CheckCircle2 className="h-4 w-4" /> Mark Brand Complete</Button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-lime-400/80">{title}</div>
      {children}
    </div>
  );
}