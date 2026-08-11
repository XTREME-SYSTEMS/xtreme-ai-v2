import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import {
  Trophy, AlertTriangle, TrendingUp, TrendingDown, Eye, MousePointerClick,
  Search, RefreshCw, Target, Zap, FileText, BarChart3, CheckCircle,
  AlertCircle, Rocket, Crosshair, Clock, ShieldCheck,
} from "lucide-react";

export default function SeoAccelerator() {
  const [engines, setEngines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [engList, alertList] = await Promise.all([
        base44.entities.RankEngine.list("-created_date", 50),
        base44.entities.RankAlert.list("-created_date", 30),
      ]);
      setEngines(engList);
      setAlerts(alertList);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAction = async (action, engineId) => {
    const key = `${action}-${engineId}`;
    setRunning(key);
    setError("");
    try {
      await base44.functions.invoke(action, { engine_id: engineId });
      await load();
    } catch (e) { setError(e.message); }
    setRunning(null);
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await base44.entities.RankAlert.update(alertId, { acknowledged: true });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    } catch (e) { setError(e.message); }
  };

  const unacknowledged = alerts.filter(a => !a.acknowledged);
  const pageOneAlerts = alerts.filter(a => a.alert_type === "page_one" || a.alert_type === "top_three");
  const dropAlerts = alerts.filter(a => a.alert_type === "dropped" || a.alert_type === "lost_ranking");

  return (
    <div className="space-y-6">
      <PageHeader title="Page 1 Accelerator" subtitle="Every lever to get your sites to the top of Google — competitor gap analysis, technical SEO audits, content freshness, backlink drip outreach, and rank movement alerts.">
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Accelerator pillars */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PillarCard
          icon={Crosshair}
          title="Competitor Gap Analysis"
          description="Reverse-engineer top-ranking pages for each keyword. See what content depth, headings, and schema they use — and what your pages are missing."
          color="violet"
        />
        <PillarCard
          icon={ShieldCheck}
          title="Technical SEO Audit"
          description="Score every page on meta tags, schema, word count, heading structure, internal links, and image alt text. Fix critical issues blocking rankings."
          color="cyan"
        />
        <PillarCard
          icon={RefreshCw}
          title="Content Freshness"
          description="Auto-refresh stale pages (30+ days) with expanded content. Google rewards fresh, updated content with higher rankings."
          color="lime"
        />
        <PillarCard
          icon={Zap}
          title="Backlink Drip Outreach"
          description="Automated 2-step follow-up sequence for every outreach email. 4-day then 7-day cadence — maximizes response rates and link velocity."
          color="amber"
        />
      </div>

      {/* Rank Alerts */}
      <Panel title={`Rank Alerts (${unacknowledged.length} new)`} action={
        <div className="flex items-center gap-2 text-xs">
          {pageOneAlerts.length > 0 && <span className="text-lime-400 flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> {pageOneAlerts.length} wins</span>}
          {dropAlerts.length > 0 && <span className="text-rose-400 flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" /> {dropAlerts.length} drops</span>}
        </div>
      }>
        {alerts.length === 0 ? (
          <EmptyState icon={BarChart3} title="No rank alerts yet" subtitle="Alerts appear automatically when keywords hit page one, enter top 3, drop significantly, or get their first clicks. The Rank Alert Checker runs daily." />
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {alerts.slice(0, 20).map(a => (
              <div key={a.id} className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${a.acknowledged ? "border-white/5 bg-zinc-950 opacity-50" : ALERT_STYLES[a.alert_type]?.border || "border-white/10 bg-zinc-950"}`}>
                <div className={`shrink-0 ${ALERT_STYLES[a.alert_type]?.text || "text-white/60"}`}>
                  {ALERT_STYLES[a.alert_type]?.icon || <BarChart3 className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">{a.message}</div>
                  <div className="text-xs text-white/40">{new Date(a.created_date).toLocaleString()}</div>
                </div>
                {!a.acknowledged && (
                  <button onClick={() => acknowledgeAlert(a.id)} className="rounded border border-white/15 px-2 py-1 text-xs text-white/60 hover:bg-white/5">
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Per-engine accelerator actions */}
      <Panel title="Campaign Accelerators">
        {loading ? (
          <div className="text-sm text-white/40 py-8 text-center">Loading campaigns…</div>
        ) : engines.length === 0 ? (
          <EmptyState icon={Rocket} title="No active campaigns" subtitle="Create a campaign from the Rank Engine or add a domain to the Domain Portfolio to start accelerating." />
        ) : (
          <div className="space-y-3">
            {engines.map(eng => (
              <EngineAcceleratorCard key={eng.id} engine={eng} running={running} runAction={runAction} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function EngineAcceleratorCard({ engine, running, runAction }) {
  const techScore = engine.technical_seo_score || 0;
  const contentScore = engine.content_score || 0;
  const authorityScore = engine.authority_score || 0;
  const overall = engine.overall_rank_readiness || 0;
  const gapAnalyzed = engine.gap_analyzed_at;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-white">{engine.site_name}</div>
          <div className="text-xs text-white/40">{engine.niche} · {engine.target_keywords_count || 0} keywords · {engine.pages_generated || 0} pages</div>
        </div>
        <div className="flex items-center gap-2">
          <ScoreBadge label="Technical" score={techScore} />
          <ScoreBadge label="Content" score={contentScore} />
          <ScoreBadge label="Authority" score={authorityScore} />
          <ScoreBadge label="Readiness" score={overall} highlight />
        </div>
      </div>

      {/* Gap analysis status */}
      {gapAnalyzed && (
        <div className="mb-3 rounded-lg border border-violet-400/20 bg-violet-400/5 px-3 py-2 text-xs text-violet-300 flex items-center gap-2">
          <Crosshair className="h-3.5 w-3.5" />
          <span>Last gap analysis: {new Date(gapAnalyzed).toLocaleDateString()}</span>
          {engine.gaps?.length > 0 && <span className="text-violet-400/60">· {engine.gaps.length} gaps identified</span>}
        </div>
      )}

      {/* Gaps list */}
      {engine.gaps?.length > 0 && (
        <div className="mb-3 space-y-1">
          {engine.gaps.slice(0, 3).map((gap, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-white/50">
              <span className="text-violet-400/60 mt-0.5">→</span>
              <span>{gap}</span>
            </div>
          ))}
          {engine.gaps.length > 3 && <div className="text-xs text-white/30 pl-4">+{engine.gaps.length - 3} more gaps…</div>}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <LoadingButton
          onClick={() => runAction("analyzeCompetitorGaps", engine.id)}
          loading={running === `analyzeCompetitorGaps-${engine.id}`}
          variant="ghost"
          className="px-3 py-1.5 text-xs"
        >
          <Crosshair className="h-3.5 w-3.5" /> Analyze Competitors
        </LoadingButton>
        <LoadingButton
          onClick={() => runAction("runTechnicalSeoAudit", engine.id)}
          loading={running === `runTechnicalSeoAudit-${engine.id}`}
          variant="ghost"
          className="px-3 py-1.5 text-xs"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Audit Pages
        </LoadingButton>
        <LoadingButton
          onClick={() => runAction("refreshStaleContent", engine.id)}
          loading={running === `refreshStaleContent-${engine.id}`}
          variant="ghost"
          className="px-3 py-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Content
        </LoadingButton>
      </div>
    </div>
  );
}

function ScoreBadge({ label, score, highlight }) {
  const color = score >= 75 ? "text-lime-400 border-lime-400/30 bg-lime-400/5"
    : score >= 50 ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/5"
    : "text-rose-400 border-rose-400/30 bg-rose-400/5";
  return (
    <div className={`rounded-md border px-2 py-1 text-center ${highlight ? color + " min-w-[80px]" : "border-white/10 bg-zinc-950"}`}>
      <div className="text-[10px] uppercase text-white/40">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? "" : "text-white"}`}>{score}</div>
    </div>
  );
}

function PillarCard({ icon: Icon, title, description, color }) {
  const colors = {
    violet: "border-violet-400/20 text-violet-400",
    cyan: "border-cyan-400/20 text-cyan-400",
    lime: "border-lime-400/20 text-lime-400",
    amber: "border-amber-400/20 text-amber-400",
  };
  return (
    <div className={`rounded-xl border bg-zinc-950 p-4 ${colors[color]}`}>
      <Icon className="h-5 w-5 mb-2" />
      <div className="text-sm font-semibold text-white mb-1">{title}</div>
      <div className="text-xs text-white/50 leading-relaxed">{description}</div>
    </div>
  );
}

const ALERT_STYLES = {
  page_one: { icon: <Trophy className="h-4 w-4" />, text: "text-lime-400", border: "border-lime-400/20 bg-lime-400/5" },
  top_three: { icon: <Trophy className="h-4 w-4" />, text: "text-lime-400", border: "border-lime-400/20 bg-lime-400/5" },
  improved: { icon: <TrendingUp className="h-4 w-4" />, text: "text-cyan-400", border: "border-cyan-400/20 bg-cyan-400/5" },
  dropped: { icon: <TrendingDown className="h-4 w-4" />, text: "text-rose-400", border: "border-rose-400/20 bg-rose-400/5" },
  lost_ranking: { icon: <AlertTriangle className="h-4 w-4" />, text: "text-rose-400", border: "border-rose-400/20 bg-rose-400/5" },
  new_traffic: { icon: <MousePointerClick className="h-4 w-4" />, text: "text-amber-400", border: "border-amber-400/20 bg-amber-400/5" },
};