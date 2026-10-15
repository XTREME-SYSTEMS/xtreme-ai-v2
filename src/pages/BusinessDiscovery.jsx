import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton } from "@/components/ui";
import { discoverBusinesses, logReceipt } from "@/lib/lgny";
import { Search, MapPin, Radar } from "lucide-react";

export default function BusinessDiscovery() {
  const navigate = useNavigate();
  const [industry, setIndustry] = useState("Epoxy Flooring");
  const [market, setMarket] = useState("Pompano Beach, Florida");
  const [radius, setRadius] = useState("25");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setLoading(true);
    try {
      const prospects = await discoverBusinesses(industry, market, radius);
      const created = await base44.entities.BusinessProspect.bulkCreate(
        prospects.map((p) => ({ ...p, status: "discovered", source_ids: ["business_scout_ai"] }))
      );
      await logReceipt({ agent_or_workflow: "Business Scout", action: "discover", entity_type: "BusinessProspect", status: "success", inputs: { industry, market, radius }, outputs: { count: created.length } });
      setResult({ count: created.length, names: created.map((c) => c.name) });
    } catch (e) {
      await logReceipt({ agent_or_workflow: "Business Scout", action: "discover", status: "failed", inputs: { industry, market, radius }, warnings: String(e) });
    }
    setLoading(false);
  };

  return (
    <div>
      <PageHeader title="Business Discovery" subtitle="Find candidate businesses by industry and geography. Public-knowledge estimates only — no live scraping of protected sources." />
      <Panel title="Discovery Parameters">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400"><Search className="h-3.5 w-3.5" /> Industry</span>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
          </label>
          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400"><MapPin className="h-3.5 w-3.5" /> Market</span>
            <input value={market} onChange={(e) => setMarket(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
          </label>
          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400"><Radar className="h-3.5 w-3.5" /> Radius (miles)</span>
            <input value={radius} onChange={(e) => setRadius(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <LoadingButton loading={loading} onClick={run}>
            <Radar className="h-4 w-4" /> Discover Businesses
          </LoadingButton>
          {result && (
            <span className="text-sm text-slate-400">
              Discovered <span className="font-semibold text-cyan-400">{result.count}</span> prospects —{" "}
              <button onClick={() => navigate("/prospects")} className="text-cyan-400 hover:underline">view in Prospect Database →</button>
            </span>
          )}
        </div>
      </Panel>

      {result?.names?.length > 0 && (
        <Panel title="Discovered" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {result.names.map((n, i) => (
              <span key={i} className="rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">{n}</span>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}