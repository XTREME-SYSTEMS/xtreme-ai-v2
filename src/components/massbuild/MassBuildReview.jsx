import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, RefreshCw, ExternalLink, Eye, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MassBuildReview({ project, onRefresh }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actioning, setActioning] = useState({});

  const loadSites = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.MassBuildSite.filter({ mass_build_id: project.id }, "-created_date", 200);
      setSites(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadSites(); }, [project.id]);

  const actOnSite = async (siteId, action) => {
    setActioning((prev) => ({ ...prev, [siteId]: true }));
    try {
      if (action === "approve") {
        await base44.entities.MassBuildSite.update(siteId, { status: "approved" });
      } else if (action === "reject") {
        await base44.entities.MassBuildSite.update(siteId, { status: "rejected" });
      } else if (action === "regenerate") {
        await base44.entities.MassBuildSite.update(siteId, { status: "pending", step: "logo", logo_url: null, generated_html_url: null });
      }
      await loadSites();
      onRefresh?.();
    } catch (e) { console.error(e); }
    setActioning((prev) => ({ ...prev, [siteId]: false }));
  };

  const bulkAction = async (action) => {
    const targets = sites.filter((s) => s.status === "generated");
    for (const s of targets) {
      setActioning((prev) => ({ ...prev, [s.id]: true }));
      await actOnSite(s.id, action);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div>;

  const generated = sites.filter((s) => s.status === "generated");
  const approved = sites.filter((s) => s.status === "approved");
  const deployed = sites.filter((s) => s.status === "deployed");
  const failed = sites.filter((s) => s.status === "failed");

  return (
    <div className="space-y-4">
      {/* Summary + bulk actions */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-zinc-900 p-4">
        <div className="flex gap-4 text-sm">
          <span className="text-white/60">Generated: <b className="text-white">{generated.length}</b></span>
          <span className="text-green-400">Approved: <b>{approved.length}</b></span>
          <span className="text-blue-400">Deployed: <b>{deployed.length}</b></span>
          {failed.length > 0 && <span className="text-red-400">Failed: <b>{failed.length}</b></span>}
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => bulkAction("approve")} disabled={!generated.length} className="flex items-center gap-1.5 rounded-lg bg-green-500/20 border border-green-500/40 px-3 py-1.5 text-xs text-green-400 font-bold hover:bg-green-500/30 disabled:opacity-30">
            <Check className="h-3.5 w-3.5" /> Approve All
          </button>
          <button onClick={() => bulkAction("reject")} disabled={!generated.length} className="flex items-center gap-1.5 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs text-red-400 font-bold hover:bg-red-500/30 disabled:opacity-30">
            <X className="h-3.5 w-3.5" /> Reject All
          </button>
          <button onClick={() => bulkAction("regenerate")} disabled={!generated.length} className="flex items-center gap-1.5 rounded-lg bg-amber-400/20 border border-amber-400/40 px-3 py-1.5 text-xs text-amber-400 font-bold hover:bg-amber-400/30 disabled:opacity-30">
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate All
          </button>
        </div>
      </div>

      {/* Site cards */}
      <div className="space-y-2">
        {sites.map((site) => {
          const isExpanded = expandedId === site.id;
          const isLoading = actioning[site.id];
          return (
            <div key={site.id} className={cn("rounded-xl border bg-zinc-900 overflow-hidden transition-all", site.status === "approved" ? "border-green-500/40" : site.status === "rejected" ? "border-red-500/30" : site.status === "deployed" ? "border-blue-500/40" : site.status === "failed" ? "border-red-500/40" : "border-white/10")}>
              <div className="flex items-center gap-3 p-3">
                {site.logo_url ? (
                  <img src={site.logo_url} alt={site.website_name} className="h-10 w-10 rounded object-contain bg-black" />
                ) : (
                  <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center text-white/30 text-xs">{site.website_name.slice(0, 2)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm truncate">{site.website_name}</div>
                  <div className="text-xs text-white/40 flex items-center gap-2">
                    <span>{site.city}</span>
                    <span className="text-white/20">·</span>
                    <span className="capitalize">{site.tone}</span>
                    <span className="text-white/20">·</span>
                    <span className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded" style={{ background: site.background_color }} />
                      <div className="h-3 w-3 rounded" style={{ background: site.accent_color }} />
                    </span>
                  </div>
                </div>
                <StatusBadge status={site.status} />
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-amber-400" />}
                {site.status === "generated" && (
                  <div className="flex gap-1">
                    <button onClick={() => actOnSite(site.id, "approve")} className="rounded-lg bg-green-500/20 p-1.5 text-green-400 hover:bg-green-500/30" title="Approve"><Check className="h-4 w-4" /></button>
                    <button onClick={() => actOnSite(site.id, "reject")} className="rounded-lg bg-red-500/20 p-1.5 text-red-400 hover:bg-red-500/30" title="Reject"><X className="h-4 w-4" /></button>
                    <button onClick={() => actOnSite(site.id, "regenerate")} className="rounded-lg bg-amber-400/20 p-1.5 text-amber-400 hover:bg-amber-400/30" title="Regenerate"><RefreshCw className="h-4 w-4" /></button>
                  </div>
                )}
                {site.vercel_url && (
                  <a href={site.vercel_url} target="_blank" rel="noopener" className="rounded-lg bg-blue-500/20 p-1.5 text-blue-400 hover:bg-blue-500/30" title="View live site"><ExternalLink className="h-4 w-4" /></a>
                )}
                {site.generated_html_url && (
                  <button onClick={() => setExpandedId(isExpanded ? null : site.id)} className="rounded-lg bg-white/5 p-1.5 text-white/60 hover:bg-white/10" title="Preview">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {isExpanded && site.generated_html_url && (
                <div className="border-t border-white/10">
                  <iframe src={site.generated_html_url} className="w-full h-[400px] bg-white" title="Preview" />
                </div>
              )}
              {site.error && <div className="px-3 pb-2 text-xs text-red-400">Error: {site.error}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: "Pending", cls: "text-white/40 bg-white/5" },
    generating: { label: "Generating", cls: "text-amber-400 bg-amber-400/10" },
    generated: { label: "Ready", cls: "text-yellow-400 bg-yellow-400/10" },
    approved: { label: "Approved", cls: "text-green-400 bg-green-400/10" },
    rejected: { label: "Rejected", cls: "text-red-400 bg-red-400/10" },
    deploying: { label: "Deploying", cls: "text-blue-400 bg-blue-400/10" },
    deployed: { label: "Deployed", cls: "text-blue-400 bg-blue-400/10" },
    failed: { label: "Failed", cls: "text-red-400 bg-red-400/10" },
  };
  const s = map[status] || map.pending;
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", s.cls)}>{s.label}</span>;
}