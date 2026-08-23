import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Radar, Lightbulb, Building2, Activity, Search, Zap, RefreshCw, Loader2,
  Rocket, Filter, Clock, CheckCircle, AlertTriangle,
} from "lucide-react";
import { SEARCH_TYPES, INDUSTRIES } from "@/components/discovery/discoveryShared.jsx";
import { IdeaCard, IdeaDetailModal } from "@/components/discovery/IdeaCard.jsx";
import { LeadCard, LeadDetailModal } from "@/components/discovery/LeadCard.jsx";

export default function IdeaDiscovery() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("ideas");
  const [ideas, setIdeas] = useState([]);
  const [leads, setLeads] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [promoting, setPromoting] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [running, setRunning] = useState(false);

  const [trigger, setTrigger] = useState({ search_type: "problems", industry: "", sub_industry: "", max_results: 10 });
  const [leadTrigger, setLeadTrigger] = useState({ industry: "home services", sub_industry: "", location: "", max_results: 10 });
  const [filter, setFilter] = useState({ industry: "", min_score: 0, status: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ideaList, leadList, runList] = await Promise.all([
        base44.entities.IdeaCandidate.list("-created_date", 50),
        base44.entities.BusinessLead.list("-created_date", 50),
        base44.entities.DiscoveryRun.list("-created_date", 20),
      ]);
      setIdeas(ideaList || []);
      setLeads(leadList || []);
      setRuns(runList || []);
    } catch (err) {
      console.error("Failed to load discovery data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runDiscovery = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("runDiscoveryScrape", {
        search_type: trigger.search_type,
        industry: trigger.industry || undefined,
        sub_industry: trigger.sub_industry || undefined,
        max_results: trigger.max_results,
        auto_score: true,
        min_score: 30,
        triggered_by: "manual",
      });
      await loadData();
    } catch (err) {
      console.error("Discovery run failed:", err);
    } finally {
      setRunning(false);
    }
  };

  const runLeadDiscovery = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("discoverBusinessLeads", {
        industry: leadTrigger.industry,
        sub_industry: leadTrigger.sub_industry || undefined,
        location: leadTrigger.location || undefined,
        max_results: leadTrigger.max_results,
        check_websites: true,
        triggered_by: "manual",
      });
      await loadData();
    } catch (err) {
      console.error("Lead discovery failed:", err);
    } finally {
      setRunning(false);
    }
  };

  const promoteIdea = async (id) => {
    setPromoting(id);
    try {
      const res = await base44.functions.invoke("promoteIdeaToAutoBuild", { idea_id: id, auto_advance: false });
      if (res.data?.autobuild_id) navigate("/auto-builder");
      await loadData();
    } catch (err) {
      console.error("Promotion failed:", err);
    } finally {
      setPromoting(null);
    }
  };

  const reScoreIdea = async (id) => {
    setScoring(id);
    try {
      await base44.functions.invoke("scoreIdeaCandidate", { idea_id: id });
      await loadData();
    } catch (err) {
      console.error("Scoring failed:", err);
    } finally {
      setScoring(null);
    }
  };

  const filteredIdeas = ideas.filter((i) => {
    if (filter.industry && i.industry !== filter.industry) return false;
    if (filter.min_score && (i.scores?.overall || 0) < filter.min_score) return false;
    if (filter.status && i.status !== filter.status) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <Radar className="h-5 w-5 text-lime-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">Autonomous Discovery Engine</h1>
            <p className="text-sm text-white/50">Browserbase scraping · Daily crons · Idea scoring → AutoBuilder pipeline</p>
          </div>
          <button onClick={loadData} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-zinc-950 p-1">
        {[
          { key: "ideas", label: "App Ideas", icon: Lightbulb, count: ideas.length },
          { key: "leads", label: "Business Leads", icon: Building2, count: leads.length },
          { key: "runs", label: "Discovery Runs", icon: Activity, count: runs.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-lime-400 text-black" : "text-white/60 hover:text-white"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === t.key ? "bg-black/20" : "bg-white/10"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-lime-400" />
        </div>
      ) : tab === "ideas" ? (
        <IdeasTab
          ideas={filteredIdeas}
          trigger={trigger}
          setTrigger={setTrigger}
          runDiscovery={runDiscovery}
          running={running}
          filter={filter}
          setFilter={setFilter}
          selectedIdea={selectedIdea}
          setSelectedIdea={setSelectedIdea}
          promoteIdea={promoteIdea}
          promoting={promoting}
          reScoreIdea={reScoreIdea}
          scoring={scoring}
        />
      ) : tab === "leads" ? (
        <LeadsTab
          leads={leads}
          trigger={leadTrigger}
          setTrigger={setLeadTrigger}
          runDiscovery={runLeadDiscovery}
          running={running}
          selectedLead={selectedLead}
          setSelectedLead={setSelectedLead}
          promoteIdea={promoteIdea}
          promoting={promoting}
        />
      ) : (
        <RunsTab runs={runs} />
      )}
    </div>
  );
}

function IdeasTab({ ideas, trigger, setTrigger, runDiscovery, running, filter, setFilter, selectedIdea, setSelectedIdea, promoteIdea, promoting, reScoreIdea, scoring }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-lime-400" />
          <h3 className="text-sm font-semibold text-white">Manual Discovery Trigger</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Search Type</label>
            <select value={trigger.search_type} onChange={(e) => setTrigger({ ...trigger, search_type: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
              {SEARCH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Industry</label>
            <select value={trigger.industry} onChange={(e) => setTrigger({ ...trigger, industry: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
              <option value="">Any</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Sub-Industry</label>
            <input value={trigger.sub_industry} onChange={(e) => setTrigger({ ...trigger, sub_industry: e.target.value })} placeholder="e.g. roofing, hvac" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Max Results</label>
            <input type="number" value={trigger.max_results} onChange={(e) => setTrigger({ ...trigger, max_results: parseInt(e.target.value) || 10 })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
          </div>
        </div>
        <button onClick={runDiscovery} disabled={running} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {running ? "Searching..." : "Run Discovery"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-white/40" />
        <select value={filter.industry} onChange={(e) => setFilter({ ...filter, industry: e.target.value })} className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-xs text-white">
          <option value="">All Industries</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-xs text-white">
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="scored">Scored</option>
          <option value="promoted">Promoted</option>
          <option value="archived">Archived</option>
        </select>
        <select value={filter.min_score} onChange={(e) => setFilter({ ...filter, min_score: parseInt(e.target.value) || 0 })} className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-xs text-white">
          <option value="0">Any Score</option>
          <option value="50">50+</option>
          <option value="60">60+</option>
          <option value="70">70+</option>
          <option value="80">80+</option>
        </select>
      </div>

      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Lightbulb className="h-10 w-10 text-white/20" />
          <p className="text-sm text-white/40">No ideas yet. Run a discovery search to find app/website ideas.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onClick={() => setSelectedIdea(idea)}
              onPromote={() => promoteIdea(idea.id)}
              promoting={promoting === idea.id}
              onReScore={() => reScoreIdea(idea.id)}
              scoring={scoring === idea.id}
            />
          ))}
        </div>
      )}

      {selectedIdea && (
        <IdeaDetailModal idea={selectedIdea} onClose={() => setSelectedIdea(null)} onPromote={() => promoteIdea(selectedIdea.id)} promoting={promoting === selectedIdea.id} />
      )}
    </div>
  );
}

function LeadsTab({ leads, trigger, setTrigger, runDiscovery, running, selectedLead, setSelectedLead, promoteIdea, promoting }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-lime-400" />
          <h3 className="text-sm font-semibold text-white">Find Businesses with Bad Websites</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Industry</label>
            <input value={trigger.industry} onChange={(e) => setTrigger({ ...trigger, industry: e.target.value })} placeholder="e.g. home services" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Sub-Industry</label>
            <input value={trigger.sub_industry} onChange={(e) => setTrigger({ ...trigger, sub_industry: e.target.value })} placeholder="e.g. roofing" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Location</label>
            <input value={trigger.location} onChange={(e) => setTrigger({ ...trigger, location: e.target.value })} placeholder="e.g. Dallas, TX" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Max Results</label>
            <input type="number" value={trigger.max_results} onChange={(e) => setTrigger({ ...trigger, max_results: parseInt(e.target.value) || 10 })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
          </div>
        </div>
        <button onClick={runDiscovery} disabled={running} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {running ? "Scanning..." : "Find Bad Websites"}
        </button>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Building2 className="h-10 w-10 text-white/20" />
          <p className="text-sm text-white/40">No business leads yet. Run a scan to find businesses with bad websites.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} onPromote={() => promoteIdea(lead.id)} promoting={promoting === lead.id} />
          ))}
        </div>
      )}

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onPromote={() => promoteIdea(selectedLead.id)} promoting={promoting === selectedLead.id} />
      )}
    </div>
  );
}

function RunsTab({ runs }) {
  const statusIcon = (status) => {
    if (status === "complete") return <CheckCircle className="h-4 w-4 text-lime-400" />;
    if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    if (status === "failed") return <AlertTriangle className="h-4 w-4 text-red-400" />;
    return <Clock className="h-4 w-4 text-white/40" />;
  };
  const statusBg = (status) => {
    if (status === "complete") return "bg-lime-400/15";
    if (status === "running") return "bg-blue-400/15";
    if (status === "failed") return "bg-red-400/15";
    return "bg-white/5";
  };

  return (
    <div className="space-y-3">
      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Activity className="h-10 w-10 text-white/20" />
          <p className="text-sm text-white/40">No discovery runs yet. Runs are triggered manually or by daily cron workflows.</p>
        </div>
      ) : (
        runs.map((run) => (
          <div key={run.id} className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${statusBg(run.status)}`}>
                  {statusIcon(run.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {run.run_type === "idea_discovery" ? "Idea Discovery" : "Business Lead Discovery"}
                  </p>
                  <p className="text-xs text-white/40">
                    {run.source} · {run.industry}{run.sub_industry ? `/${run.sub_industry}` : ""}
                    {run.search_criteria?.location ? ` · ${run.search_criteria.location}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{run.items_found || 0} items</p>
                <p className="text-xs text-white/40">{run.started_at ? new Date(run.started_at).toLocaleString() : ""}</p>
              </div>
            </div>
            {run.error && <p className="mt-2 rounded bg-red-400/10 p-2 text-xs text-red-300">{run.error}</p>}
          </div>
        ))
      )}
    </div>
  );
}