import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { LoadingButton } from "@/components/ui";
import { Image } from "@/components/ui/image";
import { Wand2, CheckCircle2, Rocket, ArrowRight, FileText, Image as ImageIcon, Palette, Type } from "lucide-react";

export default function StepRebrandProgress({ project, onNext }) {
  const rp = project?.rebrand_package || {};
  const [initing, setIniting] = useState(false);
  const checklist = project?.rebrand_checklist || [];
  const initStartedRef = useRef(false);

  // Initialize checklist when entering this step (once per project)
  useEffect(() => {
    if (project?.id && !checklist.length && !initStartedRef.current) {
      initStartedRef.current = true;
      setIniting(true);
      base44.functions.invoke("rebrandAssistant", { action: "init_checklist", project_id: project.id })
        .catch(() => {})
        .finally(() => setIniting(false));
    }
  }, [project?.id, checklist.length]);

  const hasPackage = !!rp.new_brand?.name;
  const logos = rp.logos || [];
  const images = rp.replacement_images || [];
  const content = rp.replacement_content || [];
  const services = rp.services || [];
  const faq = rp.faq || [];
  const hero = rp.hero_content || {};

  const ready = hasPackage;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Rebrand Package Generated</h2>
          <p className="mt-1 text-sm text-white/50">AI has created all replacement assets. Review them, then approve to start autonomous provisioning.</p>
        </div>
        <LoadingButton onClick={onNext} variant="primary" disabled={!ready}>
          <Rocket className="h-4 w-4" /> Approve & Provision Everything
          <ArrowRight className="h-4 w-4" />
        </LoadingButton>
      </div>

      {/* Brand identity */}
      {rp.new_brand && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-lime-400" />
            <h3 className="text-sm font-semibold text-white">New Brand Identity</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs text-white/40">Brand Name</div>
              <div className="text-lg font-bold text-white">{rp.new_brand.name}</div>
              <div className="text-xs text-white/40 mt-2">Tagline</div>
              <div className="text-sm text-lime-400">{rp.new_brand.tagline}</div>
              <div className="text-xs text-white/40 mt-2">Voice</div>
              <div className="text-sm text-white/70">{rp.new_brand.voice}</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-2">Brand Colors</div>
              <div className="flex gap-3">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-lg border border-white/10" style={{ background: rp.new_brand.colors?.primary }} />
                  <div className="text-xs text-white/50 mt-1">{rp.new_brand.colors?.primary}</div>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 rounded-lg border border-white/10" style={{ background: rp.new_brand.colors?.accent }} />
                  <div className="text-xs text-white/50 mt-1">{rp.new_brand.colors?.accent}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logos */}
      {logos.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Type className="h-4 w-4 text-lime-400" />
            <h3 className="text-sm font-semibold text-white">Logo Options ({logos.length})</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {logos.map((logo, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white p-3">
                <Image src={logo.url} fittingType="fit" className="h-24 w-full" />
                <div className="text-xs text-white/50 mt-2 capitalize">{logo.style}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero content */}
      {hero.headline && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-lime-400" />
            <h3 className="text-sm font-semibold text-white">Hero Content</h3>
          </div>
          <div className="text-lg font-bold text-white">{hero.headline}</div>
          <div className="text-sm text-white/60 mt-1">{hero.subhead}</div>
          {hero.about && <div className="text-sm text-white/50 mt-2">{hero.about.slice(0, 200)}…</div>}
        </div>
      )}

      {/* Replacement images */}
      {images.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-4 w-4 text-lime-400" />
            <h3 className="text-sm font-semibold text-white">Replacement Images ({images.length})</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {images.map((img, i) => (
              <div key={i}>
                <Image src={img.new_url} className="h-32 w-full rounded-lg" />
                <div className="text-xs text-white/50 mt-1">{img.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services + FAQ */}
      <div className="grid gap-4 md:grid-cols-2">
        {services.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Services ({services.length})</h3>
            <div className="space-y-2">
              {services.map((s, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-black/40 p-3">
                  <div className="text-sm font-medium text-white">{s.title}</div>
                  <div className="text-xs text-white/50 mt-0.5">{s.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {faq.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">FAQ ({faq.length})</h3>
            <div className="space-y-2">
              {faq.map((f, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-black/40 p-3">
                  <div className="text-sm font-medium text-lime-400">Q: {f.question}</div>
                  <div className="text-xs text-white/60 mt-1">{f.answer}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 12-element checklist */}
      {(checklist.length > 0 || initing) && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-lime-400" />
            <h3 className="text-sm font-semibold text-white">12-Element Rebrand Checklist</h3>
          </div>
          {initing ? (
            <div className="text-sm text-white/50 py-4 text-center">Initializing checklist…</div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.status === "approved" || item.status === "ready" ? "text-lime-400" : "text-white/30"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-white">{item.label}</div>
                    <div className="text-[10px] text-white/40 capitalize">{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!hasPackage && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Wand2 className="h-5 w-5 animate-pulse text-amber-400" />
          <div className="text-sm text-amber-300">Rebrand package is still generating…</div>
        </div>
      )}
    </div>
  );
}