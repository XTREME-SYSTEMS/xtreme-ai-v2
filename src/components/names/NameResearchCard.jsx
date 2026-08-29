import { useState } from "react";
import {
  Globe, CheckCircle2, Search, Building2, TrendingUp, ChevronDown,
  ChevronUp, Sparkles, ArrowRight, Loader2, AlertCircle, Shield,
  Zap, Eye, Award, Target, Plus,
} from "lucide-react";

// NameResearchCard — displays a single AI-researched business name with
// full transparency: all 8 scoring dimensions, Google search scrape data,
// US state registry check results, and the AI's rationale. Only shown for
// 100% confirmed available domains.
export default function NameResearchCard({
  suggestion: s, rank, saving, saved, purchasing, purchased, purchaseError, onRetry, onRequest, onUseName, usingName, usedName, onAddToBill, domainAdded,
}) {
  const [expanded, setExpanded] = useState(false);

  const overall = s.overall_score || s.viral_score || 0;
  const scoreColor = overall >= 80 ? "text-lime-400" : overall >= 60 ? "text-amber-400" : "text-white/60";
  const scoreBg = overall >= 80 ? "bg-lime-400" : overall >= 60 ? "bg-amber-400" : "bg-white/30";

  const dimensions = [
    { key: "viral_score", label: "Viral Potential", icon: Zap },
    { key: "local_seo_score", label: "Local SEO", icon: Target },
    { key: "searchability_score", label: "Searchability", icon: Search },
    { key: "brandability_score", label: "Brandability", icon: Award },
    { key: "domain_strength_score", label: "Domain Strength", icon: Globe },
    { key: "trademark_safety_score", label: "Trademark Safety", icon: Shield },
    { key: "google_uniqueness_score", label: "Google Uniqueness", icon: Eye },
    { key: "registry_clearance_score", label: "Registry Clearance", icon: Building2 },
  ];

  return (
    <div className="rounded-xl border border-lime-400/40 bg-zinc-950 p-4 transition-colors">
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-lime-400/30 bg-lime-400/10 text-sm font-bold text-lime-400">
          {rank}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name + domain */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">{s.name}</h3>
            {s.tagline && <span className="text-xs text-white/40">— {s.tagline}</span>}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-lime-400" />
            <span className="text-sm font-mono text-white/70">{s.domain}</span>
            <span className="rounded border border-lime-400/40 bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-bold text-lime-300">
              <CheckCircle2 className="mr-0.5 inline h-2.5 w-2.5" /> 100% AVAILABLE
            </span>
          </div>

          {/* Overall score */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-white/50">
                  <TrendingUp className="h-3 w-3" /> Overall Brand Score
                </span>
                <span className={`font-mono text-sm font-semibold ${scoreColor}`}>{overall}/100</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10">
                <div className={`h-full rounded-full ${scoreBg} transition-all`} style={{ width: `${overall}%` }} />
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/60 hover:text-white"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Hide" : "Research"}
            </button>
          </div>

          {/* Expanded research data */}
          {expanded && (
            <div className="mt-4 space-y-4">
              {/* Score dimensions grid */}
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-lime-400/60">
                  8-Dimension AI Scoring
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {dimensions.map((d) => {
                    const val = s[d.key] || 0;
                    const color = val >= 80 ? "text-lime-400" : val >= 60 ? "text-amber-400" : "text-white/50";
                    return (
                      <div key={d.key} className="rounded-lg border border-white/10 bg-black/30 p-2">
                        <div className="flex items-center gap-1">
                          <d.icon className={`h-3 w-3 ${color}`} />
                          <span className="text-[9px] font-medium text-white/40">{d.label}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="h-1 flex-1 rounded-full bg-white/10">
                            <div className={`h-full rounded-full ${val >= 80 ? "bg-lime-400" : val >= 60 ? "bg-amber-400" : "bg-white/30"}`} style={{ width: `${val}%` }} />
                          </div>
                          <span className={`font-mono text-[10px] font-semibold ${color}`}>{val}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Google research */}
              {s.google_research && (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-3.5 w-3.5 text-lime-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Google Search Verification</span>
                    <span className={`ml-auto rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                      s.google_research.uniqueness === 'highly_unique' ? 'border-lime-400/40 bg-lime-400/10 text-lime-300' :
                      s.google_research.uniqueness === 'unique' ? 'border-lime-400/30 bg-lime-400/5 text-lime-400' :
                      s.google_research.uniqueness === 'moderate' ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' :
                      s.google_research.uniqueness === 'common' ? 'border-red-400/30 bg-red-400/10 text-red-300' :
                      'border-white/15 bg-white/5 text-white/40'
                    }`}>
                      {s.google_research.uniqueness?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-white/50">
                    <div>Query: <span className="font-mono text-white/40">{s.google_research.query}</span></div>
                    {s.google_research.result_count !== null && (
                      <div>Results: <span className="font-mono text-white/70">{s.google_research.result_count.toLocaleString()}</span></div>
                    )}
                    {s.google_research.has_exact_match && (
                      <div className="text-amber-400">⚠ Exact name match found in search results</div>
                    )}
                    {s.google_research.top_results?.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        <span className="text-white/40">Top results:</span>
                        {s.google_research.top_results.slice(0, 3).map((r, i) => (
                          <div key={i} className="truncate text-white/30">• {r}</div>
                        ))}
                      </div>
                    )}
                    <div className="text-white/30">Method: {s.google_research.method}</div>
                  </div>
                </div>
              )}

              {/* State registry */}
              {s.state_registry && (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-lime-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">US State Business Registry</span>
                    <span className={`ml-auto rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                      s.state_registry.status === 'available' ? 'border-lime-400/40 bg-lime-400/10 text-lime-300' :
                      s.state_registry.status === 'likely_available' ? 'border-lime-400/30 bg-lime-400/5 text-lime-400' :
                      s.state_registry.status === 'exists' ? 'border-red-400/30 bg-red-400/10 text-red-300' :
                      'border-white/15 bg-white/5 text-white/40'
                    }`}>
                      {s.state_registry.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-white/50">
                    <div>Jurisdiction: <span className="font-mono text-white/70">{s.state_registry.jurisdiction}</span></div>
                    <div>Total matches: <span className="font-mono text-white/70">{s.state_registry.total_results}</span></div>
                    <div>Exact name matches: <span className={`font-mono ${s.state_registry.exact_matches > 0 ? 'text-red-400' : 'text-lime-400'}`}>{s.state_registry.exact_matches}</span></div>
                    {s.state_registry.sample_companies?.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        <span className="text-white/40">Similar companies:</span>
                        {s.state_registry.sample_companies.map((c, i) => (
                          <div key={i} className="text-white/30">• {c}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rationale */}
              {s.rationale && (
                <div className="rounded-lg border border-lime-400/10 bg-lime-400/5 p-2.5">
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-lime-400/60">
                    <Sparkles className="h-3 w-3" /> AI Rationale
                  </div>
                  <p className="text-xs text-lime-300/70 leading-relaxed">{s.rationale}</p>
                </div>
              )}
            </div>
          )}

          {/* Action */}
          <div className="mt-3">
            {purchased ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-xs text-lime-300">
                <CheckCircle2 className="h-4 w-4" /> Purchased! We're securing <span className="font-mono">{s.domain}</span> for you now.
              </div>
            ) : purchasing ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/30 bg-lime-400/5 px-3 py-2 text-xs text-lime-300">
                <Loader2 className="h-4 w-4 animate-spin" /> Purchasing your domain…
              </div>
            ) : saved && purchaseError ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                  <AlertCircle className="h-4 w-4" /> {purchaseError}
                </div>
                <button onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-xs font-semibold text-black hover:bg-lime-300">
                  <ArrowRight className="h-3.5 w-3.5" /> Try again
                </button>
              </div>
            ) : saved ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-xs text-lime-300">
                <CheckCircle2 className="h-4 w-4" /> Request sent! Our team will secure this domain for you.
              </div>
            ) : usedName ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-xs text-lime-300">
                <CheckCircle2 className="h-4 w-4" /> Name saved! Continue to the next step.
              </div>
            ) : domainAdded ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                <CheckCircle2 className="h-4 w-4" /> Added to your bill! The $20 domain fee will be included in your final invoice.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onUseName}
                  disabled={usingName}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/40 bg-lime-400/10 px-4 py-2 text-xs font-semibold text-lime-300 transition-colors hover:bg-lime-400/20 disabled:opacity-50"
                >
                  {usingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {usingName ? "Saving…" : "Use This Name"}
                </button>
                <button
                  onClick={onAddToBill}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-400/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  {saving ? "Adding…" : "Add to Bill ($20)"}
                </button>
                <button
                  onClick={onRequest}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  {saving ? "Working…" : "Buy Domain Now"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}