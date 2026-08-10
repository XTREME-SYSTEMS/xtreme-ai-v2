import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import { MapPin, Plus, Sparkles, Loader2, ArrowRight } from "lucide-react";

const STATUS_STYLE = { draft: "text-amber-400", ready: "text-lime-400", published: "text-emerald-400" };

export default function Markets() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () => base44.entities.Market.list("-created_date", 200).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const generate = async (id) => {
    setBusy(id);
    try { await base44.functions.invoke("generateMarketAssets", { market_id: id, job_type: "seo" }); await load(); } catch (e) {}
    setBusy(null);
  };

  return (
    <div>
      <PageHeader title="Markets" subtitle="AI Site Factory — every market is a record. Generate the full SEO + content kit per market.">
        <Link to="/markets/new" className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2 text-sm font-semibold text-black hover:bg-lime-300"><Plus className="h-4 w-4" /> New Market</Link>
      </PageHeader>

      <Panel title={`${items.length} markets`}>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState icon={MapPin} title="No markets yet" subtitle="Create your first market to start generating sites.">
            <Link to="/markets/new" className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2 text-sm font-semibold text-black hover:bg-lime-300"><Plus className="h-4 w-4" /> New Market</Link>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-3 py-2">Brand / Market</th><th className="px-3 py-2">Domain</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Created</th><th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2"><div className="font-medium text-white">{m.public_business_name || m.brand_name || "Untitled"}</div><div className="text-xs text-white/40">{m.city}, {m.state} · /{m.slug}</div></td>
                    <td className="px-3 py-2 text-white/60">{m.domain || "—"}</td>
                    <td className="px-3 py-2"><span className={`text-xs font-semibold uppercase tracking-wider ${STATUS_STYLE[m.status] || "text-white/50"}`}>{m.status}</span></td>
                    <td className="px-3 py-2 text-white/40">{new Date(m.created_date).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => generate(m.id)} disabled={busy === m.id} className="inline-flex items-center gap-1 rounded-md border border-lime-400/40 px-2 py-1 text-xs font-semibold text-lime-300 hover:bg-lime-400/10 disabled:opacity-50">{busy === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate</button>
                        <Link to={`/markets/${m.id}`} className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs font-semibold text-white hover:bg-white/5">View <ArrowRight className="h-3 w-3" /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}