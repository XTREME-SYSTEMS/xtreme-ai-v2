import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import CopyBlock from "@/components/CopyBlock";
import { Rocket, Sparkles, Loader2 } from "lucide-react";

export default function SeoLaunchPad() {
  const { toast } = useToast();
  const [markets, setMarkets] = useState([]);
  const [selected, setSelected] = useState("");
  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gen, setGen] = useState(false);

  useEffect(() => { base44.entities.Market.list("-created_date", 200).then(setMarkets).finally(() => setLoading(false)); }, []);

  const loadKit = async (mid) => {
    setSelected(mid);
    if (!mid) { setKit(null); return; }
    const list = await base44.entities.SeoLaunchKit.filter({ market_id: mid });
    setKit(list[0] || null);
  };

  const generate = async () => {
    if (!selected) return;
    setGen(true);
    try {
      await base44.functions.invoke("generateSeoLaunchKit", { market_id: selected });
      const list = await base44.entities.SeoLaunchKit.filter({ market_id: selected });
      setKit(list[0] || null);
      toast({ title: "SEO launch kit generated" });
    } catch (e) { toast({ title: "Failed", description: String(e.message || e), variant: "destructive" }); }
    setGen(false);
  };

  const toggleCheck = (i) => {
    if (!kit?.launch_checklist) return;
    const next = kit.launch_checklist.map((c, idx) => idx === i ? { ...c, done: !c.done } : c);
    setKit({ ...kit, launch_checklist: next });
    base44.entities.SeoLaunchKit.update(kit.id, { launch_checklist: next });
  };

  return (
    <div>
      <PageHeader title="SEO Launch Pad" subtitle="AI fills the entire Google ranking kit per market — GBP, Search Console, Analytics, sitemap, robots, citations. Copy-paste to launch.">
        <button onClick={generate} disabled={!selected || gen} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50">{gen ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate Kit</button>
      </PageHeader>

      <Panel title="Select Market">
        {loading ? <div className="flex items-center gap-2 py-4 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div> : (
          <select value={selected} onChange={(e) => loadKit(e.target.value)} className="w-full rounded-md border border-white/15 bg-black px-2.5 py-2 text-sm text-white">
            <option value="" className="bg-black">Select a market…</option>
            {markets.map((m) => <option key={m.id} value={m.id} className="bg-black">{m.public_business_name || m.brand_name} — {m.city}, {m.state}</option>)}
          </select>
        )}
      </Panel>

      {!selected ? <div className="mt-4"><EmptyState icon={Rocket} title="Select a market" subtitle="Pick a market to generate or view its Google ranking kit." /></div> : !kit ? <div className="mt-4"><EmptyState icon={Sparkles} title="No kit yet" subtitle="Click Generate Kit to let AI fill the entire Google ranking setup." /></div> : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Google Business Profile">
              <div className="space-y-3">
                <CopyBlock label="Business name" value={kit.gbp_name} />
                <CopyBlock label="Category" value={kit.gbp_category} />
                <CopyBlock label="Description" value={kit.gbp_description} />
                <CopyBlock label="Services" value={(kit.gbp_services || []).join(", ")} />
                <CopyBlock label="Hours" value={kit.gbp_hours} />
                <CopyBlock label="Service area" value={kit.gbp_service_area} />
              </div>
            </Panel>
            <Panel title="Google Search Console">
              <div className="space-y-3">
                <CopyBlock label="Property URL" value={kit.gsc_property_url} />
                <CopyBlock label="Verification meta tag" value={kit.gsc_verification_meta} type="code" />
                <CopyBlock label="Sitemap URL" value={kit.sitemap_url} />
              </div>
            </Panel>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Sitemap & Robots">
              <div className="space-y-3">
                <CopyBlock label="sitemap.xml" value={kit.sitemap_xml} type="code" />
                <CopyBlock label="robots.txt" value={kit.robots_txt} type="code" />
              </div>
            </Panel>
            <Panel title="Google Analytics (GA4)">
              <div className="space-y-3">
                <CopyBlock label="Measurement ID (replace placeholder)" value={kit.ga_measurement_id} />
                <CopyBlock label="gtag.js snippet" value={kit.ga_tag_snippet} type="code" />
              </div>
            </Panel>
          </div>
          <Panel title="Local Citations">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40"><th className="px-2 py-1.5">Directory</th><th className="px-2 py-1.5">URL</th><th className="px-2 py-1.5">Status</th></tr></thead>
                <tbody>{(kit.citation_list || []).map((c, i) => <tr key={i} className="border-b border-white/5"><td className="px-2 py-1.5 text-white">{c.directory}</td><td className="px-2 py-1.5 text-white/60"><a href={c.url} target="_blank" rel="noreferrer" className="underline">{c.url}</a></td><td className="px-2 py-1.5"><span className="text-xs text-amber-400">{c.status}</span></td></tr>)}</tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Launch Checklist">
            <div className="space-y-1.5">{(kit.launch_checklist || []).map((c, i) => (
              <button key={i} onClick={() => toggleCheck(i)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5">
                <span className={`flex h-4 w-4 items-center justify-center rounded border ${c.done ? "border-lime-400 bg-lime-400 text-black" : "border-white/30"}`}>{c.done ? "✓" : ""}</span>
                <span className={c.done ? "text-white/40 line-through" : "text-white/80"}>{c.task}</span>
              </button>
            ))}</div>
          </Panel>
        </div>
      )}
    </div>
  );
}