import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader } from "@/components/ui";
import BrandStepper from "@/components/brand/BrandStepper";
import StepConcept from "@/components/brand/StepConcept";
import StepStrategy from "@/components/brand/StepStrategy";
import StepLogo from "@/components/brand/StepLogo";
import StepBusinessCard from "@/components/brand/StepBusinessCard";
import StepBrochure from "@/components/brand/StepBrochure";
import StepSocial from "@/components/brand/StepSocial";
import StepVideo from "@/components/brand/StepVideo";
import StepReview from "@/components/brand/StepReview";

const STEPS = [
  { key: "concept", label: "Concept", desc: "AI brand interview" },
  { key: "strategy", label: "Strategy", desc: "Positioning & identity" },
  { key: "logo", label: "Logo", desc: "Generate logo options" },
  { key: "business_card", label: "Business Card", desc: "Digital card" },
  { key: "brochure", label: "Brochure", desc: "Digital brochure" },
  { key: "social", label: "Social Posts", desc: "Posts + captions" },
  { key: "video", label: "Promo Video", desc: "Short brand video" },
  { key: "review", label: "Review & Export", desc: "Your brand kit" },
];

export default function BrandFactory() {
  const [params] = useSearchParams();
  const [project, setProject] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const id = params.get("id");
      if (id) {
        try {
          const p = await base44.entities.BrandProject.get(id);
          setProject(p);
          const idx = STEPS.findIndex((s) => s.key === p.current_step);
          setStepIndex(idx >= 0 ? idx : 0);
        } catch (e) {}
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (patch) => {
    const merged = { ...project, ...patch };
    setProject(merged);
    if (merged.id) {
      try {
        const updated = await base44.entities.BrandProject.update(merged.id, patch);
        setProject(updated);
        return updated;
      } catch (e) {}
    }
    return merged;
  };

  const ensureProject = async (initial) => {
    if (project?.id) {
      const updated = await base44.entities.BrandProject.update(project.id, initial);
      setProject(updated);
      return updated;
    }
    const created = await base44.entities.BrandProject.create(initial);
    setProject(created);
    return created;
  };

  const goNext = () => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-lime-400" />
      </div>
    );
  }

  const step = STEPS[stepIndex];
  const common = { project, persist, ensureProject, goNext, goBack };

  return (
    <div>
      <PageHeader title="Brand Factory" subtitle="AI-guided concept-to-reality brand pipeline · build your brand, then sell it as a service" />
      <BrandStepper steps={STEPS} stepIndex={stepIndex} onStep={setStepIndex} />
      <div className="mt-6">
        {step.key === "concept" && <StepConcept {...common} />}
        {step.key === "strategy" && <StepStrategy {...common} />}
        {step.key === "logo" && <StepLogo {...common} />}
        {step.key === "business_card" && <StepBusinessCard {...common} />}
        {step.key === "brochure" && <StepBrochure {...common} />}
        {step.key === "social" && <StepSocial {...common} />}
        {step.key === "video" && <StepVideo {...common} />}
        {step.key === "review" && <StepReview {...common} />}
      </div>
    </div>
  );
}