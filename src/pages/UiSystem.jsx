import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { getProductType } from "@/lib/buildProductTypes";
import BackButton from "@/components/client/BackButton";
import { useSystemBuildStep } from "@/hooks/useSystemBuildStep";
import {
  Loader2, Palette, RefreshCw, CheckCircle, ArrowRight, Zap,
  Type, Ruler, Component, Layout, Smartphone, Sun, Moon, Layers,
} from "lucide-react";

// UiSystem — the third "system" step for web_app / ecommerce / platform
// builds. Generates a complete UI design system (colors, typography, spacing,
// components, layout patterns, responsive breakpoints) via the
// generateUiSystem backend function, displays it for review, and lets the
// admin approve to advance the pipeline.
export default function UiSystem() {
  const autoBuild = useAutoBuild();
  const navigate = useNavigate();
  const { generating, error, approved, validationErrors, warnings, attempt, generate: runGenerate, approve: runApprove } = useSystemBuildStep("generateUiSystem", "ui_system", "ui_system");
  const [showDark, setShowDark] = useState(false);

  const build = autoBuild.build;
  const uiSystem = build?.ui_system;
  const architecture = build?.architecture;
  const productType = getProductType(build?.product_type);
  const TypeIcon = productType.icon;

  useEffect(() => {
    document.title = "UI System · Auto Builder";
  }, []);

  const generate = () => runGenerate({
    architecture,
    productType: build.product_type,
    businessName: build.business_name,
  });

  const approve = () => runApprove("/ui-system", "/codegen", navigate);

  if (autoBuild.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-lime-400" />
      </div>
    );
  }

  if (!build) {
    return (
      <div className="py-10 text-center text-white/50">
        No active build. Return to the Auto Builder to create one.
      </div>
    );
  }

  if (!architecture) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <BackButton to="/data-model" />
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-300">
          You need to generate the system architecture first before designing the UI system.
        </div>
      </div>
    );
  }

  const palette = uiSystem?.color_palette;
  const tokens = showDark ? uiSystem?.theme_tokens?.dark : uiSystem?.theme_tokens?.light;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <BackButton to="/data-model" />

      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <TypeIcon className="h-5 w-5 text-lime-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">UI Design System</h1>
            <p className="text-sm text-white/50">{productType.label} · {build.business_name}</p>
          </div>
          {uiSystem && !generating && (
            <button
              type="button"
              onClick={generate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-lime-400/50 hover:text-lime-300"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Generating */}
      {generating && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
          <p className="text-sm text-white/60">Designing color palette, typography, and component library…</p>
          <p className="text-xs text-white/30">This takes 15-30 seconds. The AI is creating a complete design system for your product.{attempt > 1 ? ` (retry ${attempt}/3)` : ""}</p>
        </div>
      )}

      {error && !generating && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>
      )}

      {validationErrors.length > 0 && !generating && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
          <p className="mb-1 text-sm font-semibold text-amber-300">Spec Validation Issues:</p>
          <ul className="space-y-0.5 text-xs text-amber-200/80">
            {validationErrors.map((err, i) => <li key={i}>• {err}</li>)}
          </ul>
        </div>
      )}

      {warnings.length > 0 && !generating && (
        <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-3">
          <p className="mb-1 text-xs font-semibold text-blue-300">Warnings:</p>
          <ul className="space-y-0.5 text-[11px] text-blue-200/70">
            {warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      )}

      {/* Generate button */}
      {!uiSystem && !generating && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Palette className="h-10 w-10 text-lime-400/50" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">Generate your UI design system</p>
            <p className="mt-1 text-xs text-white/40">The AI will design a complete design system — colors, typography, spacing, components, layout patterns, and responsive breakpoints.</p>
          </div>
          <button type="button" onClick={generate} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300">
            <Zap className="h-4 w-4" /> Generate UI System
          </button>
        </div>
      )}

      {/* UI system display */}
      {uiSystem && !generating && (
        <>
          {/* Design principles */}
          {uiSystem.design_principles?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <h2 className="mb-2 text-sm font-semibold text-white">Design Principles</h2>
              <div className="flex flex-wrap gap-2">
                {uiSystem.design_principles.map((p, i) => (
                  <span key={i} className="rounded-lg border border-lime-400/20 bg-lime-400/5 px-2.5 py-1 text-xs text-lime-300">{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Color palette */}
          {palette && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Color Palette</h2>
                {uiSystem.theme_tokens && (
                  <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 p-0.5">
                    <button onClick={() => setShowDark(false)} className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${!showDark ? "bg-lime-400/15 text-lime-300" : "text-white/40"}`}>
                      <Sun className="h-3 w-3" /> Light
                    </button>
                    <button onClick={() => setShowDark(true)} className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${showDark ? "bg-lime-400/15 text-lime-300" : "text-white/40"}`}>
                      <Moon className="h-3 w-3" /> Dark
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {Object.entries(palette).map(([key, hex]) => (
                  <div key={key} className="rounded-lg border border-white/5 bg-black/40 p-2.5">
                    <div className="mb-1.5 h-10 w-full rounded-md border border-white/10" style={{ backgroundColor: hex }} />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{key.replace(/_/g, " ")}</div>
                    <div className="font-mono text-xs text-white/80">{hex}</div>
                  </div>
                ))}
              </div>
              {/* Theme tokens preview */}
              {tokens && (
                <div className="mt-3">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">{showDark ? "Dark" : "Light"} Theme Tokens</div>
                  <pre className="overflow-x-auto rounded-lg border border-white/5 bg-black/40 p-2.5 text-[10px] text-white/50">{JSON.stringify(tokens, null, 2).slice(0, 600)}</pre>
                </div>
              )}
            </div>
          )}

          {/* Typography */}
          {uiSystem.typography && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Type className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Typography</h2>
              </div>
              <div className="mb-3 flex flex-wrap gap-3 text-xs">
                <span className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1">
                  <span className="text-white/40">Heading: </span>
                  <span className="text-white/80">{uiSystem.typography.font_heading}</span>
                </span>
                <span className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1">
                  <span className="text-white/40">Body: </span>
                  <span className="text-white/80">{uiSystem.typography.font_body}</span>
                </span>
                <span className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1">
                  <span className="text-white/40">Mono: </span>
                  <span className="text-white/80">{uiSystem.typography.font_mono}</span>
                </span>
              </div>
              <div className="space-y-1.5">
                {(uiSystem.typography.scale || []).map((s, i) => (
                  <div key={i} className="flex items-baseline gap-3 rounded-lg border border-white/5 bg-black/40 p-2.5">
                    <span className="w-10 font-mono text-[10px] text-lime-300">{s.name}</span>
                    <span style={{ fontSize: s.size, fontWeight: s.weight, lineHeight: s.line_height, fontFamily: uiSystem.typography.font_body }} className="text-white">
                      The quick brown fox
                    </span>
                    <span className="ml-auto whitespace-nowrap text-[10px] text-white/40">{s.size} · {s.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spacing */}
          {uiSystem.spacing && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Ruler className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Spacing</h2>
                <span className="ml-auto text-xs text-white/40">Unit: {uiSystem.spacing.unit}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {(uiSystem.spacing.scale || []).map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="rounded bg-lime-400/40" style={{ width: s.value, height: s.value, minWidth: "4px", minHeight: "4px" }} />
                    <span className="text-[10px] text-white/50">{s.name}</span>
                    <span className="font-mono text-[10px] text-white/30">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Components */}
          {uiSystem.components?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Component className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Components ({uiSystem.components.length})</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {uiSystem.components.map((c, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-black/40 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{c.name}</span>
                      <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">{c.category}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{c.description}</p>
                    {c.variants?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {c.variants.map((v, j) => (
                          <span key={j} className="rounded bg-lime-400/10 px-1.5 py-0.5 text-[10px] text-lime-300">{v}</span>
                        ))}
                      </div>
                    )}
                    {c.props?.length > 0 && (
                      <div className="mt-1.5 text-[10px] text-white/40">
                        Props: {c.props.map(p => p.name).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Layout patterns */}
          {uiSystem.layout_patterns?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Layout className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Layout Patterns ({uiSystem.layout_patterns.length})</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {uiSystem.layout_patterns.map((lp, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-black/40 p-3">
                    <div className="text-sm font-medium text-white">{lp.name}</div>
                    <p className="mt-0.5 text-xs text-white/50">{lp.description}</p>
                    <p className="mt-1 text-[10px] text-white/30">{lp.usage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Responsive */}
          {uiSystem.responsive && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Responsive Breakpoints</h2>
                <span className="ml-auto text-xs text-white/40">{uiSystem.responsive.strategy}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(uiSystem.responsive.breakpoints || []).map((bp, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-xs">
                    <span className="font-mono text-lime-300">{bp.name}</span>
                    <span className="text-white/40">≥</span>
                    <span className="text-white/80">{bp.min_width}</span>
                    <span className="text-white/40">{bp.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approve */}
          <div className="flex items-center justify-between rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <CheckCircle className="h-4 w-4 text-lime-400" />
              Review the design system above, then approve to continue.
            </div>
            <button type="button" onClick={approve} disabled={approved} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
              {approved ? <CheckCircle className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {approved ? "Approved" : "Approve & Continue"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}