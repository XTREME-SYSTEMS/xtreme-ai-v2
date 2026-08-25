import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Eye, Loader2, CheckCircle, RefreshCw, Target, Users, TrendingUp,
  Sparkles, DollarSign, AlertTriangle, Rocket, Lightbulb, Shield,
} from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientTrack } from "@/hooks/useClientTrack";
import { useClientProject } from "@/hooks/useClientProject";
import BackButton from "@/components/client/BackButton";
import BrandedButton from "@/components/client/BrandedButton";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import { getVisibleSteps } from "@/lib/clientSteps";
import { useNavigate } from "react-router-dom";

export default function Vision() {
  const { user } = useClientUser();
  const { productId } = useClientTrack(user);
  const { project, saveProject, loading: projectLoading } = useClientProject(user);
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const vision = project?.vision;
  const visibleSteps = getVisibleSteps(productId, user);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateVision", {
        businessName: project?.business_name || "",
        industry: project?.industry || "",
        subIndustry: project?.sub_industry || "",
        primaryLocation: project?.profile?.primary_location || "",
        services: project?.profile?.services || [],
        productDescription: project?.profile?.product_description || "",
        targetAudience: project?.profile?.target_audience || "",
        businessType: project?.business_type || "local service business",
      });
      const data = res?.data || res;
      if (data?.vision) {
        // Project will be updated via the backend — reload
        window.location.reload();
      } else {
        setError(data?.error || "Could not generate vision.");
      }
    } catch (e) {
      setError(e?.message || "Could not generate vision. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const approve = async () => {
    await saveProject({ vision: { ...vision, approved: true } });
    try { localStorage.setItem("coach:done:/vision", "1"); } catch {}
    notifyStepComplete("vision", { clientEmail: user?.email || "" });
    const idx = visibleSteps.findIndex((s) => s.to === "/vision");
    const next = idx >= 0 && idx < visibleSteps.length - 1 ? visibleSteps[idx + 1] : null;
    navigate(next ? next.to : "/strategy");
  };

  const saveEdit = async () => {
    try {
      const updated = JSON.parse(editText);
      await saveProject({ vision: { ...updated, approved: vision?.approved || false } });
      setEditing(false);
      window.location.reload();
    } catch {
      setError("Invalid JSON. Please check your edit and try again.");
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackButton />
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Eye className="h-4 w-4" /> Vision — The Foundation
        </div>
        <p className="mt-1 text-sm text-white/50">
          Before we build anything, we need a clear vision. This defines <span className="text-lime-400">what we're building, why it matters, who it's for, and what success looks like</span>. Every downstream decision — your name, brand, website, content, SEO — flows from this.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {!vision && !generating && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-8 text-center">
          <Eye className="mx-auto h-12 w-12 text-lime-400/40" />
          <h3 className="mt-3 text-lg font-semibold text-white">No vision yet</h3>
          <p className="mt-1 text-sm text-white/50">
            Generate your vision document to define what we're building and why. This is mandatory before any building begins.
          </p>
          <button
            onClick={generate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300"
          >
            <Sparkles className="h-4 w-4" /> Generate Vision
          </button>
        </div>
      )}

      {generating && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-lime-400" />
          <p className="mt-3 text-sm text-white/50">Generating your vision document…</p>
        </div>
      )}

      {vision && !generating && (
        <>
          {/* Mission */}
          <VisionSection icon={Target} label="Mission" text={vision.mission} />
          <VisionSection icon={AlertTriangle} label="The Problem" text={vision.problem} />
          <VisionSection icon={Users} label="Target Audience" text={vision.target_audience} />
          <VisionSection icon={Eye} label="Long-Term Vision" text={vision.long_term_vision} />

          {/* Success Metrics */}
          {vision.success_metrics?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
                <TrendingUp className="h-3.5 w-3.5" /> Success Metrics
              </div>
              <ul className="mt-3 space-y-2">
                {vision.success_metrics.map((m, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10 text-[10px] font-bold text-lime-400">{i + 1}</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Core Values */}
          {vision.core_values?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
                <Shield className="h-3.5 w-3.5" /> Core Values
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {vision.core_values.map((v, i) => (
                  <span key={i} className="rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-sm text-lime-300">{v}</span>
                ))}
              </div>
            </div>
          )}

          <VisionSection icon={DollarSign} label="Value Proposition" text={vision.value_proposition} />
          <VisionSection icon={Rocket} label="Market Opportunity" text={vision.market_opportunity} />

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            <button
              onClick={generate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/70 hover:border-lime-400/40 hover:text-lime-300"
            >
              <RefreshCw className="h-4 w-4" /> Regenerate
            </button>
            <button
              onClick={() => { setEditText(JSON.stringify(vision, null, 2)); setEditing(true); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/70 hover:border-lime-400/40 hover:text-lime-300"
            >
              <Lightbulb className="h-4 w-4" /> Edit
            </button>
            {vision.approved ? (
              <BrandedButton
                onClick={() => {
                  const idx = visibleSteps.findIndex((s) => s.to === "/vision");
                  const next = idx >= 0 && idx < visibleSteps.length - 1 ? visibleSteps[idx + 1] : null;
                  navigate(next ? next.to : "/strategy");
                }}
                icon={Rocket}
                showLogo
              >
                Activate & Continue to Strategy
              </BrandedButton>
            ) : (
              <BrandedButton onClick={approve} icon={CheckCircle} showLogo>
                Approve Vision & Continue
              </BrandedButton>
            )}
          </div>

          {/* Edit modal */}
          {editing && (
            <div className="rounded-xl border border-lime-400/30 bg-zinc-950 p-4 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-lime-400">Edit Vision (JSON)</label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={20}
                className="w-full resize-none rounded-lg border border-white/15 bg-black px-3 py-2 font-mono text-xs text-white focus:border-lime-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300">Save</button>
                <button onClick={() => setEditing(false)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-white/30">Cancel</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function VisionSection({ icon: Icon, label, text }) {
  if (!text) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white/80">{text}</p>
    </div>
  );
}