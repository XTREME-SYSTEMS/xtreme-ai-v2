import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  ClipboardList, Loader2, CheckCircle, RefreshCw, Target, TrendingUp,
  DollarSign, Sparkles, AlertTriangle, Rocket, Shield, Zap, Handshake,
  Edit3,
} from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientTrack } from "@/hooks/useClientTrack";
import { useClientProject } from "@/hooks/useClientProject";
import BackButton from "@/components/client/BackButton";
import BrandedButton from "@/components/client/BrandedButton";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import { getVisibleSteps } from "@/lib/clientSteps";
import { useNavigate } from "react-router-dom";

export default function Strategy() {
  const { user } = useClientUser();
  const { productId } = useClientTrack(user);
  const { project, saveProject, loading: projectLoading } = useClientProject(user);
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const strategy = project?.strategy;
  const vision = project?.vision;
  const visibleSteps = getVisibleSteps(productId, user);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateStrategy", {});
      const data = res?.data || res;
      if (data?.strategy) {
        window.location.reload();
      } else {
        setError(data?.error || "Could not generate strategy.");
      }
    } catch (e) {
      setError(e?.message || "Could not generate strategy. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const approve = async () => {
    await saveProject({ strategy: { ...strategy, approved: true } });
    try { localStorage.setItem("coach:done:/strategy", "1"); } catch {}
    notifyStepComplete("strategy", { clientEmail: user?.email || "" });
    const idx = visibleSteps.findIndex((s) => s.to === "/strategy");
    const next = idx >= 0 && idx < visibleSteps.length - 1 ? visibleSteps[idx + 1] : null;
    navigate(next ? next.to : "/business-name-studio");
  };

  const saveEdit = async () => {
    try {
      const updated = JSON.parse(editText);
      await saveProject({ strategy: { ...updated, approved: strategy?.approved || false } });
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

  if (!vision) {
    return (
      <div className="space-y-5">
        <BackButton />
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-400/60" />
          <h3 className="mt-3 text-lg font-semibold text-white">Vision required first</h3>
          <p className="mt-1 text-sm text-white/50">
            You must generate and approve your vision before creating a strategy. The strategy builds directly on the vision.
          </p>
          <button
            onClick={() => navigate("/vision")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300"
          >
            <Target className="h-4 w-4" /> Go to Vision
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackButton />
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <ClipboardList className="h-4 w-4" /> Strategy — The Plan
        </div>
        <p className="mt-1 text-sm text-white/50">
          Now that we have a vision, we need a strategy to get there. This defines <span className="text-lime-400">how we win — positioning, go-to-market, revenue model, pricing, channels, roadmap, and risks</span>. Every execution decision flows from this.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {!strategy && !generating && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-8 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-lime-400/40" />
          <h3 className="mt-3 text-lg font-semibold text-white">No strategy yet</h3>
          <p className="mt-1 text-sm text-white/50">
            Generate your strategy document to define how we'll execute the vision. This is mandatory before any building begins.
          </p>
          <button
            onClick={generate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300"
          >
            <Sparkles className="h-4 w-4" /> Generate Strategy
          </button>
        </div>
      )}

      {generating && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-lime-400" />
          <p className="mt-3 text-sm text-white/50">Generating your strategy document…</p>
        </div>
      )}

      {strategy && !generating && (
        <>
          <StrategySection icon={Target} label="Competitive Positioning" text={strategy.competitive_positioning} />
          <StrategySection icon={Rocket} label="Go-to-Market Plan" text={strategy.go_to_market} />
          <StrategySection icon={DollarSign} label="Revenue Model" text={strategy.revenue_model} />
          <StrategySection icon={DollarSign} label="Pricing Strategy" text={strategy.pricing_strategy} />

          {/* Acquisition Channels */}
          {strategy.acquisition_channels?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
                <Zap className="h-3.5 w-3.5" /> Acquisition Channels
              </div>
              <ol className="mt-3 space-y-2">
                {strategy.acquisition_channels.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10 text-[10px] font-bold text-lime-400">{i + 1}</span>
                    {c}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Roadmap */}
          {strategy.roadmap?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
                <TrendingUp className="h-3.5 w-3.5" /> Execution Roadmap
              </div>
              <div className="mt-3 space-y-4">
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

          {/* Risks */}
          {strategy.risks?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Key Risks & Mitigations
              </div>
              <div className="mt-3 space-y-3">
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

          <StrategySection icon={Shield} label="Resources Needed" text={strategy.resources} />
          <StrategySection icon={Shield} label="Differentiation / Moat" text={strategy.differentiation} />
          <StrategySection icon={Handshake} label="Key Partnerships" text={strategy.partnerships} />

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
              onClick={() => { setEditText(JSON.stringify(strategy, null, 2)); setEditing(true); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/70 hover:border-lime-400/40 hover:text-lime-300"
            >
              <Edit3 className="h-4 w-4" /> Edit
            </button>
            {strategy.approved ? (
              <BrandedButton
                onClick={() => {
                  const idx = visibleSteps.findIndex((s) => s.to === "/strategy");
                  const next = idx >= 0 && idx < visibleSteps.length - 1 ? visibleSteps[idx + 1] : null;
                  navigate(next ? next.to : "/business-name-studio");
                }}
                icon={Rocket}
                showLogo
              >
                Activate & Continue to Next Step
              </BrandedButton>
            ) : (
              <BrandedButton onClick={approve} icon={CheckCircle} showLogo>
                Approve Strategy & Continue
              </BrandedButton>
            )}
          </div>

          {/* Edit modal */}
          {editing && (
            <div className="rounded-xl border border-lime-400/30 bg-zinc-950 p-4 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-lime-400">Edit Strategy (JSON)</label>
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

function StrategySection({ icon: Icon, label, text }) {
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