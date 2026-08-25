import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Eye, ClipboardList, Loader2, CheckCircle, RefreshCw, Target, Users,
  TrendingUp, Sparkles, DollarSign, AlertTriangle, Rocket, Shield, Zap,
  Handshake, Lightbulb, Edit3,
} from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientProject } from "@/hooks/useClientProject";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import { getVisibleSteps } from "@/lib/clientSteps";
import { useClientTrack } from "@/hooks/useClientTrack";
import { useNavigate } from "react-router-dom";

// Combined Vision + Strategy generation panel — embeds directly in the
// Welcome / Business Generator page so users define their vision and
// strategy as the very first thing, before any building begins.
// Both are mandatory: Strategy cannot be generated until Vision is approved.
export default function VisionStrategyPanel() {
  const { user } = useClientUser();
  const { productId } = useClientTrack(user);
  const { project, saveProject, loading: projectLoading } = useClientProject(user);
  const navigate = useNavigate();
  const visibleSteps = getVisibleSteps(productId, user);

  const [genVision, setGenVision] = useState(false);
  const [genStrategy, setGenStrategy] = useState(false);
  const [visionError, setVisionError] = useState("");
  const [strategyError, setStrategyError] = useState("");
  const [editVision, setEditVision] = useState(false);
  const [editVisionText, setEditVisionText] = useState("");
  const [editStrategy, setEditStrategy] = useState(false);
  const [editStrategyText, setEditStrategyText] = useState("");

  const vision = project?.vision;
  const strategy = project?.strategy;

  // ── Vision ──────────────────────────────────────────────────────────
  const generateVision = async () => {
    setGenVision(true);
    setVisionError("");
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
        window.location.reload();
      } else {
        setVisionError(data?.error || "Could not generate vision.");
      }
    } catch (e) {
      setVisionError(e?.message || "Could not generate vision. Please try again.");
    } finally {
      setGenVision(false);
    }
  };

  const approveVision = async () => {
    await saveProject({ vision: { ...vision, approved: true } });
    try { localStorage.setItem("coach:done:/vision", "1"); } catch {}
    notifyStepComplete("vision", { clientEmail: user?.email || "" });
  };

  const saveVisionEdit = async () => {
    try {
      const updated = JSON.parse(editVisionText);
      await saveProject({ vision: { ...updated, approved: vision?.approved || false } });
      setEditVision(false);
      window.location.reload();
    } catch {
      setVisionError("Invalid JSON. Please check your edit and try again.");
    }
  };

  // ── Strategy ────────────────────────────────────────────────────────
  const generateStrategy = async () => {
    setGenStrategy(true);
    setStrategyError("");
    try {
      const res = await base44.functions.invoke("generateStrategy", {});
      const data = res?.data || res;
      if (data?.strategy) {
        window.location.reload();
      } else {
        setStrategyError(data?.error || "Could not generate strategy.");
      }
    } catch (e) {
      setStrategyError(e?.message || "Could not generate strategy. Please try again.");
    } finally {
      setGenStrategy(false);
    }
  };

  const approveStrategy = async () => {
    await saveProject({ strategy: { ...strategy, approved: true } });
    try { localStorage.setItem("coach:done:/strategy", "1"); } catch {}
    notifyStepComplete("strategy", { clientEmail: user?.email || "" });
  };

  const saveStrategyEdit = async () => {
    try {
      const updated = JSON.parse(editStrategyText);
      await saveProject({ strategy: { ...updated, approved: strategy?.approved || false } });
      setEditStrategy(false);
      window.location.reload();
    } catch {
      setStrategyError("Invalid JSON. Please check your edit and try again.");
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-7 w-7 animate-spin text-lime-400" />
      </div>
    );
  }

  const visionApproved = !!vision?.approved;
  const strategyApproved = !!strategy?.approved;
  const bothApproved = visionApproved && strategyApproved;

  return (
    <div className="space-y-5">
      {/* ── Vision Section ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <Eye className="h-4 w-4" /> Step 1: Vision — The Foundation
          </div>
          {visionApproved && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-lime-400/50 bg-lime-400/10 px-2.5 py-1 text-[11px] font-semibold text-lime-300">
              <CheckCircle className="h-3 w-3" /> Approved
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-white/50">
          Define <span className="text-lime-400">what we're building, why it matters, who it's for, and what success looks like</span>. Every downstream decision flows from this.
        </p>
      </div>

      {visionError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {visionError}
        </div>
      )}

      {!vision && !genVision && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 text-center">
          <Eye className="mx-auto h-10 w-10 text-lime-400/40" />
          <h3 className="mt-2 text-base font-semibold text-white">No vision yet</h3>
          <p className="mt-1 text-sm text-white/50">
            Generate your vision document — mandatory before any building begins.
          </p>
          <button
            onClick={generateVision}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2 text-sm font-semibold text-black hover:bg-lime-300"
          >
            <Sparkles className="h-4 w-4" /> Generate Vision
          </button>
        </div>
      )}

      {genVision && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-lime-400" />
          <p className="mt-2 text-sm text-white/50">Generating your vision document…</p>
        </div>
      )}

      {vision && !genVision && (
        <>
          <VSField icon={Target} label="Mission" text={vision.mission} />
          <VSField icon={AlertTriangle} label="The Problem" text={vision.problem} />
          <VSField icon={Users} label="Target Audience" text={vision.target_audience} />
          <VSField icon={Eye} label="Long-Term Vision" text={vision.long_term_vision} />

          {vision.success_metrics?.length > 0 && (
            <VSList icon={TrendingUp} label="Success Metrics" items={vision.success_metrics} />
          )}
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

          <VSField icon={DollarSign} label="Value Proposition" text={vision.value_proposition} />
          <VSField icon={Rocket} label="Market Opportunity" text={vision.market_opportunity} />

          {/* Vision actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <button
              onClick={generateVision}
              disabled={genVision}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-lime-400/40 hover:text-lime-300"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
            <button
              onClick={() => { setEditVisionText(JSON.stringify(vision, null, 2)); setEditVision(true); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-lime-400/40 hover:text-lime-300"
            >
              <Lightbulb className="h-3.5 w-3.5" /> Edit
            </button>
            {!visionApproved && (
              <button
                onClick={approveVision}
                className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-1.5 text-xs font-semibold text-black hover:bg-lime-300"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Approve Vision
              </button>
            )}
          </div>

          {editVision && (
            <div className="rounded-xl border border-lime-400/30 bg-zinc-950 p-4 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-lime-400">Edit Vision (JSON)</label>
              <textarea
                value={editVisionText}
                onChange={(e) => setEditVisionText(e.target.value)}
                rows={16}
                className="w-full resize-none rounded-lg border border-white/15 bg-black px-3 py-2 font-mono text-xs text-white focus:border-lime-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button onClick={saveVisionEdit} className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300">Save</button>
                <button onClick={() => setEditVision(false)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-white/30">Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Strategy Section ──────────────────────────────────────── */}
      <div className={`rounded-xl border p-5 transition-colors ${
        visionApproved
          ? "border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent"
          : "border-white/10 bg-zinc-950/50 opacity-60"
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <ClipboardList className="h-4 w-4" /> Step 2: Strategy — The Plan
          </div>
          {strategyApproved && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-lime-400/50 bg-lime-400/10 px-2.5 py-1 text-[11px] font-semibold text-lime-300">
              <CheckCircle className="h-3 w-3" /> Approved
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-white/50">
          Define <span className="text-lime-400">how we win — positioning, go-to-market, revenue, pricing, channels, roadmap, and risks</span>. Requires an approved vision first.
        </p>
      </div>

      {!visionApproved && !strategy && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 text-center">
          <ClipboardList className="mx-auto h-9 w-9 text-white/20" />
          <p className="mt-2 text-sm text-white/40">
            Approve your vision above to unlock strategy generation.
          </p>
        </div>
      )}

      {visionApproved && strategyError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {strategyError}
        </div>
      )}

      {visionApproved && !strategy && !genStrategy && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-lime-400/40" />
          <h3 className="mt-2 text-base font-semibold text-white">No strategy yet</h3>
          <p className="mt-1 text-sm text-white/50">
            Generate your strategy document — mandatory before any building begins.
          </p>
          <button
            onClick={generateStrategy}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2 text-sm font-semibold text-black hover:bg-lime-300"
          >
            <Sparkles className="h-4 w-4" /> Generate Strategy
          </button>
        </div>
      )}

      {visionApproved && genStrategy && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-lime-400" />
          <p className="mt-2 text-sm text-white/50">Generating your strategy document…</p>
        </div>
      )}

      {visionApproved && strategy && !genStrategy && (
        <>
          <VSField icon={Target} label="Competitive Positioning" text={strategy.competitive_positioning} />
          <VSField icon={Rocket} label="Go-to-Market Plan" text={strategy.go_to_market} />
          <VSField icon={DollarSign} label="Revenue Model" text={strategy.revenue_model} />
          <VSField icon={DollarSign} label="Pricing Strategy" text={strategy.pricing_strategy} />

          {strategy.acquisition_channels?.length > 0 && (
            <VSList icon={Zap} label="Acquisition Channels" items={strategy.acquisition_channels} />
          )}

          {strategy.roadmap?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
                <TrendingUp className="h-3.5 w-3.5" /> Execution Roadmap
              </div>
              <div className="mt-3 space-y-3">
                {strategy.roadmap.map((phase, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-400 text-[10px] font-bold text-black">{i + 1}</span>
                      <span className="text-sm font-semibold text-white">{phase.phase}</span>
                      <span className="ml-auto text-xs text-lime-400/60">{phase.timeline}</span>
                    </div>
                    {phase.goals?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-[10px] font-semibold uppercase text-white/40">Goals</div>
                        <ul className="mt-1 space-y-1">
                          {phase.goals.map((g, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-white/70">
                              <CheckCircle className="h-3 w-3 shrink-0 text-lime-400/50 mt-0.5" /> {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {phase.key_initiatives?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-[10px] font-semibold uppercase text-white/40">Key Initiatives</div>
                        <ul className="mt-1 space-y-1">
                          {phase.key_initiatives.map((k, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-white/70">
                              <Zap className="h-3 w-3 shrink-0 text-lime-400/50 mt-0.5" /> {k}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy.risks?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Key Risks & Mitigations
              </div>
              <div className="mt-3 space-y-2">
                {strategy.risks.map((r, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        r.severity === "high" ? "bg-red-400/20 text-red-400" :
                        r.severity === "medium" ? "bg-yellow-400/20 text-yellow-400" :
                        "bg-lime-400/20 text-lime-400"
                      }`}>{r.severity || "medium"}</span>
                      <span className="text-sm font-medium text-white">{r.risk}</span>
                    </div>
                    {r.mitigation && (
                      <p className="mt-1.5 text-xs text-white/50"><span className="text-lime-400/60">Mitigation:</span> {r.mitigation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <VSField icon={Shield} label="Resources Needed" text={strategy.resources} />
          <VSField icon={Shield} label="Differentiation / Moat" text={strategy.differentiation} />
          <VSField icon={Handshake} label="Key Partnerships" text={strategy.partnerships} />

          {/* Strategy actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <button
              onClick={generateStrategy}
              disabled={genStrategy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-lime-400/40 hover:text-lime-300"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
            <button
              onClick={() => { setEditStrategyText(JSON.stringify(strategy, null, 2)); setEditStrategy(true); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-lime-400/40 hover:text-lime-300"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
            {!strategyApproved && (
              <button
                onClick={approveStrategy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-1.5 text-xs font-semibold text-black hover:bg-lime-300"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Approve Strategy
              </button>
            )}
          </div>

          {editStrategy && (
            <div className="rounded-xl border border-lime-400/30 bg-zinc-950 p-4 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-lime-400">Edit Strategy (JSON)</label>
              <textarea
                value={editStrategyText}
                onChange={(e) => setEditStrategyText(e.target.value)}
                rows={16}
                className="w-full resize-none rounded-lg border border-white/15 bg-black px-3 py-2 font-mono text-xs text-white focus:border-lime-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button onClick={saveStrategyEdit} className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300">Save</button>
                <button onClick={() => setEditStrategy(false)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-white/30">Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Both approved → unlock continue ────────────────────────── */}
      {bothApproved && (
        <div className="rounded-xl border border-lime-400/50 bg-lime-400/10 p-4 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-lime-400" />
          <p className="mt-2 text-sm font-semibold text-lime-300">
            Vision and Strategy approved — you're ready to build!
          </p>
        </div>
      )}
    </div>
  );
}

function VSField({ icon: Icon, label, text }) {
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

function VSList({ icon: Icon, label, items }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((m, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10 text-[10px] font-bold text-lime-400">{i + 1}</span>
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}