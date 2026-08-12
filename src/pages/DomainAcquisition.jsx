import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import { Radar, Zap, ExternalLink, Plus, RefreshCw, TrendingUp, Target, DollarSign, Search, Filter, AlertCircle, CheckCircle, Trophy } from "lucide-react";

const NICHES = [
  "roofing", "hvac", "plumbing", "epoxy flooring", "water damage restoration",
  "mold remediation", "solar installation", "pest control", "tree removal",
  "fencing", "concrete", "electrician", "garage door repair", "foundation repair",
  "junk removal", "moving company", "cleaning services", "landscaping",
  "chiropractor", "dentist", "med spa", "personal injury lawyer", "dui lawyer",
  "divorce lawyer", "bankruptcy lawyer"
];

const PRIORITY_COLORS = {
  buy_now: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  strong_buy: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  consider: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  pass: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const PRIORITY_LABELS = {
  buy_now: "BUY NOW",
  strong_buy: "STRONG BUY",
  consider: "CONSIDER",
  pass: "PASS",
};

export default function DomainAcquisition() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [discoverResult, setDiscoverResult] = useState(null);
  const [error, setError] = useState("");
  const [showNichePicker, setShowNichePicker] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState([]);
  const [filterNiche, setFilterNiche] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [adding, setAdding] = useState(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.DomainCandidate.list('-roi_score', 200);
      setCandidates(list);
    } catch (e) { setError(e.message); setCandidates([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const checkAvailability = async () => {
    setChecking(true);
    setError("");
    try {
      const unknownDomains = candidates
        .filter(c => !c.availability_status || c.availability_status === 'UNKNOWN')
        .map(c => c.domain);
      if (unknownDomains.length === 0) {
        setChecking(false);
        return;
      }
      for (let i = 0; i < unknownDomains.length; i += 8) {
        const batch = unknownDomains.slice(i, i + 8);
        await base44.functions.invoke('checkDomainAvailability', { domains: batch });
      }
      await load();
    } catch (e) { setError(e.message); }
    setChecking(false);
  };

  const discover = async () => {
    setDiscovering(true);
    setError("");
    setDiscoverResult(null);
    try {
      const payload = selectedNiches.length > 0 ? { niches: selectedNiches } : {};
      const res = await base44.functions.invoke('discoverHighValueDomains', payload);
      const data = res?.data || res;
      setDiscoverResult(data);
      await load();
    } catch (e) { setError(e.message); }
    setDiscovering(false);
  };

  const addToPortfolio = async (c) => {
    setAdding(c.id);
    setError("");
    try {
      await base44.entities.DomainPortfolio.create({
        domain: c.domain,
        tld: '.' + c.domain.split('.').slice(-1)[0],
        niche: c.niche,
        status: 'acquired',
        acquired_date: new Date().toISOString().slice(0, 10),
        notes: `AI-recommended (ROI: ${c.roi_score?.toFixed(0)}/100, Est. revenue: $${c.estimated_monthly_revenue?.toLocaleString()}/mo)`,
        logs: [`Added from Domain Acquisition system — ROI score: ${c.roi_score?.toFixed(0)}`],
      });
      await base44.entities.DomainCandidate.update(c.id, { selected: true });
      await load();
    } catch (e) { setError(e.message); }
    setAdding(null);
  };

  const filtered = candidates.filter(c => {
    if (filterNiche && c.niche !== filterNiche) return false;
    if (filterPriority && c.acquisition_priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: candidates.length,
    available: candidates.filter(c => c.availability_status === 'AVAILABLE').length,
    registered: candidates.filter(c => c.availability_status === 'REGISTERED').length,
    buyNow: candidates.filter(c => c.acquisition_priority === 'buy_now' && c.availability_status !== 'REGISTERED').length,
    totalRevenue: candidates.filter(c => c.availability_status !== 'REGISTERED').reduce((a, c) => a + (c.estimated_monthly_revenue || 0), 0),
    avgSerpWeakness: candidates.length > 0 ? candidates.reduce((a, c) => a + (c.serp_weakness_score || 0), 0) / candidates.length : 0,
  };

  const toggleNiche = (n) => {
    setSelectedNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domain Acquisition Intelligence"
        subtitle="AI scans Google SERPs, analyzes competition weakness, and predicts dollar ROI for every domain candidate — before you buy."
      >
        <LoadingButton onClick={() => setShowNichePicker(true)} variant="ghost">
          <Filter className="h-4 w-4" /> Select Niches ({selectedNiches.length})
        </LoadingButton>
        <LoadingButton onClick={checkAvailability} loading={checking} variant="ghost">
          <CheckCircle className="h-4 w-4" /> Check Availability
        </LoadingButton>
        <LoadingButton onClick={discover} loading={discovering} variant="primary">
          <Radar className="h-4 w-4" /> Scan SERPs & Score Domains
        </LoadingButton>
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {discoverResult && (
        <div className="rounded-lg border border-lime-400/30 bg-lime-400/5 px-4 py-3 text-sm text-lime-300">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="h-4 w-4" /> Scanned {discoverResult.niches_processed} niches
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {discoverResult.results?.filter(r => !r.error).slice(0, 15).map((r, i) => (
              <span key={i} className="rounded border border-lime-400/20 px-1.5 py-0.5 text-[10px] text-lime-300/80">
                {r.niche}: {r.search_volume?.toLocaleString()} searches/mo, SERP weakness {r.serp_weakness?.toFixed(0)}/100
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Target} label="Candidates" value={stats.total} />
        <StatCard icon={CheckCircle} label="Available" value={stats.available} color="text-lime-400" />
        <StatCard icon={Zap} label="Buy Now" value={stats.buyNow} color="text-rose-400" />
        <StatCard icon={DollarSign} label="Est. Revenue/mo" value={`$${(stats.totalRevenue / 1000).toFixed(1)}k`} color="text-lime-400" />
        <StatCard icon={Radar} label="Avg SERP Weakness" value={`${stats.avgSerpWeakness.toFixed(0)}/100`} color="text-cyan-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <select value={filterNiche} onChange={e => setFilterNiche(e.target.value)} className="rounded-lg border border-white/15 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-lime-400">
            <option value="">All Niches</option>
            {[...new Set(candidates.map(c => c.niche).filter(Boolean))].sort().map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="rounded-lg border border-white/15 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-lime-400">
            <option value="">All Priorities</option>
            <option value="buy_now">Buy Now</option>
            <option value="strong_buy">Strong Buy</option>
            <option value="consider">Consider</option>
            <option value="pass">Pass</option>
          </select>
        </div>
        <span className="text-xs text-white/40">{filtered.length} domains</span>
      </div>

      {/* Domain cards */}
      <Panel title={`AI-Scored Domain Candidates (${filtered.length})`}>
        {loading ? (
          <div className="text-sm text-white/40 py-8 text-center">Loading candidates…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Radar}
            title="No domains analyzed yet"
            subtitle="Click 'Scan SERPs & Score Domains' to run AI analysis on high-value niches. The system will search Google, analyze competition, and predict ROI for each domain."
            children={<LoadingButton onClick={discover} loading={discovering} variant="primary"><Radar className="h-4 w-4" /> Start AI Scan</LoadingButton>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(c => (
              <DomainCard key={c.id} candidate={c} onAdd={addToPortfolio} adding={adding === c.id} />
            ))}
          </div>
        )}
      </Panel>

      {/* Niche picker modal */}
      {showNichePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowNichePicker(false)}>
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-zinc-950 p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-1">Select Niches to Scan</h3>
            <p className="text-sm text-white/50 mb-4">Choose which high-value niches the AI should analyze. Each niche generates 8 domain candidates with full SERP analysis.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NICHES.map(n => (
                <button
                  key={n}
                  onClick={() => toggleNiche(n)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors text-left ${
                    selectedNiches.includes(n)
                      ? "border-lime-400 bg-lime-400/10 text-lime-300"
                      : "border-white/15 text-white/70 hover:bg-white/5"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-between items-center">
              <button onClick={() => setSelectedNiches([])} className="text-xs text-white/40 hover:text-white">Clear selection</button>
              <div className="flex gap-2">
                <LoadingButton onClick={() => setShowNichePicker(false)} variant="ghost">Cancel</LoadingButton>
                <LoadingButton
                  onClick={() => { setShowNichePicker(false); discover(); }}
                  variant="primary"
                  disabled={false}
                >
                  <Radar className="h-4 w-4" /> Scan {selectedNiches.length || 'All'} Niches
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DomainCard({ candidate: c, onAdd, adding }) {
  const priority = c.acquisition_priority || 'consider';
  return (
    <div className={`rounded-xl border bg-zinc-900 p-4 transition-colors ${
      c.availability_status === 'REGISTERED' ? 'border-white/10 opacity-50' :
      priority === 'buy_now' ? 'border-rose-500/40' :
      priority === 'strong_buy' ? 'border-amber-500/30' :
      'border-white/10'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{c.domain}</div>
          <div className="mt-0.5 text-xs text-white/40">{c.niche} · {c.domain_type}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLORS[priority]}`}>
            {PRIORITY_LABELS[priority]}
          </span>
          {c.availability_status === 'AVAILABLE' && (
            <span className="rounded border border-lime-400/40 bg-lime-400/10 px-2 py-0.5 text-[10px] font-bold text-lime-300">AVAILABLE</span>
          )}
          {c.availability_status === 'REGISTERED' && (
            <span className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">REGISTERED</span>
          )}
          {(!c.availability_status || c.availability_status === 'UNKNOWN') && (
            <span className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/40">CHECKING…</span>
          )}
        </div>
      </div>

      {/* ROI Score */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">ROI Score</span>
            <span className="font-mono font-semibold text-white">{c.roi_score?.toFixed(0)}/100</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-white/10">
            <div className={`h-full rounded-full ${
              c.roi_score >= 75 ? 'bg-rose-500' : c.roi_score >= 55 ? 'bg-amber-500' : 'bg-cyan-500'
            }`} style={{ width: `${c.roi_score || 0}%` }} />
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Metric label="Search Volume" value={`${c.monthly_search_volume?.toLocaleString() || '—'}/mo`} />
        <Metric label="Lead Value" value={`$${c.lead_value || 0}`} />
        <Metric label="Est. Leads/mo" value={c.estimated_monthly_leads?.toFixed(0) || '—'} />
        <Metric label="Est. Revenue/mo" value={`$${c.estimated_monthly_revenue?.toLocaleString() || '—'}`} color="text-lime-400" />
        <Metric label="SERP Weakness" value={`${c.serp_weakness_score?.toFixed(0) || '—'}/100`} color="text-cyan-400" />
        <Metric label="Rankability" value={`${c.rankability_score?.toFixed(0) || '—'}/100`} color="text-amber-400" />
      </div>

      {/* Analysis */}
      {c.competition_analysis && (
        <div className="mt-3 rounded-lg border border-white/5 bg-black/50 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">AI Analysis</div>
          <p className="text-xs text-white/60 leading-relaxed">{c.competition_analysis}</p>
        </div>
      )}

      {/* Content gap */}
      {c.content_gap && (
        <div className="mt-2 rounded-lg border border-lime-400/10 bg-lime-400/5 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-lime-400/60 mb-1">Content Gap</div>
          <p className="text-xs text-lime-300/70 leading-relaxed">{c.content_gap}</p>
        </div>
      )}

      {/* Top competitors */}
      {c.top_competitors && c.top_competitors.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {c.top_competitors.slice(0, 3).map((comp, i) => (
            <span key={i} className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40">{comp}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <LoadingButton
          onClick={() => onAdd(c)}
          loading={adding}
          variant={c.selected ? "ghost" : "primary"}
          className="flex-1 px-2.5 py-1.5 text-xs"
          disabled={c.selected}
        >
          {c.selected ? <><CheckCircle className="h-3 w-3" /> In Portfolio</> : <><Plus className="h-3 w-3" /> Add to Portfolio</>}
        </LoadingButton>
        {c.availability_status === 'REGISTERED' ? (
          <span className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-2.5 py-1.5 text-xs text-rose-400/60 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" /> Registered
          </span>
        ) : c.availability_status === 'AVAILABLE' ? (
          <a
            href={c.buy_url}
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-lime-400/40 bg-lime-400/10 px-2.5 py-1.5 text-xs text-lime-300 hover:bg-lime-400/20 flex items-center gap-1.5"
          >
            <ExternalLink className="h-3 w-3" /> Buy
          </a>
        ) : (
          <span className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/40 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" /> Checking…
          </span>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, color = "text-white" }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/30 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={`mt-0.5 font-mono text-sm font-medium ${color}`}>{value}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = "text-white" }) {
  return (
    <div className="rounded-xl border border-white/15 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 text-white/40"><Icon className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">{label}</span></div>
      <div className={`mt-2 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}