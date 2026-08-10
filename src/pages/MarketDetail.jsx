import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Sparkles, Loader2, Save, ArrowLeft, CheckCircle, Rocket, ExternalLink } from "lucide-react";

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [market, setMarket] = useState(null);
  const [seo, setSeo] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gen, setGen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provRec, setProvRec] = useState(null);
  const [form, setForm] = useState({});

  const loadAll = async () => {
    const [m, seoList, jobList, provList] = await Promise.all([
      base44.entities.Market.get(id),
      base44.entities.MarketSeo.filter({ market_id: id }),
      base44.entities.GenerationJob.filter({ market_id: id }),
      base44.entities.ProvisioningRecord.filter({ market_id: id }),
    ]);
    setMarket(m); setSeo(seoList[0] || null); setJobs(jobList); setProvRec(provList[0] || null); setForm(m || {});
  };

  useEffect(() => { loadAll().finally(() => setLoading(false)); }, [id]);

  const generate = async () => {
    setGen(true);
    try { await base44.functions.invoke("generateMarketAssets", { market_id: id, job_type: "seo" }); await loadAll(); toast({ title: "Generated", description: "SEO + content kit updated." }); }
    catch (e) { toast({ title: "Generation failed", description: String(e.message || e), variant: "destructive" }); }
    setGen(false);
  };

  const save = async () => {
    setSaving(true);
    try { await base44.entities.Market.update(id, form); await loadAll(); toast({ title: "Saved" }); }
    catch (e) { toast({ title: "Error", description: String(e.message || e), variant: "destructive" }); }
    setSaving(false);
  };

  const provision = async () => {
    setProvisioning(true);
    try { await base44.functions.invoke("provisionMarket", { market_id: id }); await loadAll(); toast({ title: "Site provisioned", description: "Repo, Drive, Supabase & Vercel created." }); }
    catch (e) { toast({ title: "Provisioning failed", description: String(e.message || e), variant: "destructive" }); }
    setProvisioning(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-lime-400" /></div>;
  if (!market) return <EmptyState icon={MapPin} title="Market not found" />;

  const inputCls = "w-full rounded-md border border-white/15 bg-black px-2.5 py-2 text-sm text-white";

  return (
    <div>
      <PageHeader title={market.public_business_name || market.brand_name || "Market"} subtitle={`${market.city}, ${market.state} · ${market.status} · /${market.slug}`}>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={provision} disabled={provisioning} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50">{provisioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Provision Site</button>
          <button onClick={() => navigate("/markets")} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70 hover:bg-white/5"><ArrowLeft className="h-4 w-4" /> Markets</button>
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Edit Market" action={<button onClick={save} disabled={saving} className="inline-flex items-center gap-1 rounded-md bg-lime-400 px-2.5 py-1 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50">{saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save</button>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="text-xs text-white/50">Brand name</label><input className={inputCls} value={form.brand_name || ""} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} /></div>
            <div><label className="text-xs text-white/50">Public business name</label><input className={inputCls} value={form.public_business_name || ""} onChange={(e) => setForm({ ...form, public_business_name: e.target.value })} /></div>
            <div><label className="text-xs text-white/50">Phone</label><input className={inputCls} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="text-xs text-white/50">Domain</label><input className={inputCls} value={form.domain || ""} onChange={(e) => setForm({ ...form, domain: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="text-xs text-white/50">Service area description</label><input className={inputCls} value={form.service_area_description || ""} onChange={(e) => setForm({ ...form, service_area_description: e.target.value })} /></div>
            <div><label className="text-xs text-white/50">Google rating</label><input type="number" step="0.1" className={inputCls} value={form.google_rating ?? ""} onChange={(e) => setForm({ ...form, google_rating: Number(e.target.value) })} /></div>
            <div><label className="text-xs text-white/50">Google review count</label><input type="number" className={inputCls} value={form.google_review_count ?? ""} onChange={(e) => setForm({ ...form, google_review_count: Number(e.target.value) })} /></div>
            <div><label className="text-xs text-white/50">Hero image URL</label><input className={inputCls} value={form.hero_image_url || ""} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} /></div>
            <div><label className="text-xs text-white/50">Status</label>
              <select className={inputCls} value={form.status || "draft"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft" className="bg-black">draft</option><option value="ready" className="bg-black">ready</option><option value="published" className="bg-black">published</option>
              </select>
            </div>
          </div>
        </Panel>

        <Panel title="AI Generation" action={<button onClick={generate} disabled={gen} className="inline-flex items-center gap-1 rounded-md bg-lime-400 px-2.5 py-1 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50">{gen ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate SEO</button>}>
          {jobs.length === 0 ? <EmptyState icon={Sparkles} title="No jobs yet" subtitle="Click Generate to create the SEO + content kit." /> : (
            <div className="space-y-2">
              {jobs.map((j) => (
                <div key={j.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black px-3 py-2">
                  <span className={`h-2 w-2 rounded-full ${j.status === "done" ? "bg-lime-400" : j.status === "failed" ? "bg-rose-500" : "bg-amber-400"}`} />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm text-white">{j.job_type} · {j.result_summary || j.error || j.status}</div><div className="text-xs text-white/40">{new Date(j.created_date).toLocaleString()}</div></div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Generated SEO & Content">
          {!seo || seo.status !== "ready" ? <EmptyState icon={CheckCircle} title={seo?.status === "generating" ? "Generating…" : "No SEO generated yet"} subtitle="Run generation to populate meta, FAQ, JSON-LD, and page content." /> : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><div className="text-xs text-white/40">Meta title</div><div className="text-sm text-white">{seo.meta_title}</div></div>
                <div><div className="text-xs text-white/40">Meta description</div><div className="text-sm text-white">{seo.meta_description}</div></div>
                <div><div className="text-xs text-white/40">Canonical</div><div className="text-sm text-white">{seo.canonical_url}</div></div>
              </div>
              {seo.faq && seo.faq.length > 0 && (
                <div><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">FAQ ({seo.faq.length})</div>
                  <div className="space-y-2">{seo.faq.map((f, i) => (
                    <div key={i} className="rounded-lg border border-white/10 bg-black p-3"><div className="text-sm font-medium text-white">{f.question}</div><div className="mt-1 text-sm text-white/60">{f.answer}</div></div>
                  ))}</div>
                </div>
              )}
              {seo.cost_page_content && <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">Cost page content</div><div className="whitespace-pre-wrap text-sm text-white/70">{seo.cost_page_content}</div></div>}
              {seo.location_page_content && <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">Location page content</div><div className="whitespace-pre-wrap text-sm text-white/70">{seo.location_page_content}</div></div>}
              {seo.how_it_works_content && <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">How it works</div><div className="whitespace-pre-wrap text-sm text-white/70">{seo.how_it_works_content}</div></div>}
              <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">JSON-LD</div><pre className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-black p-3 text-xs text-lime-300">{JSON.stringify(seo.json_ld, null, 2)}</pre></div>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Auto-Provisioning" action={provRec?.status === "provisioned" ? <span className="inline-flex items-center gap-1 text-xs text-lime-400"><CheckCircle className="h-3.5 w-3.5" /> Provisioned</span> : <span className="text-xs text-white/40">{provRec?.status || "not started"}</span>}>
          {!provRec ? <EmptyState icon={Rocket} title="Not provisioned yet" subtitle="Click Provision Site to auto-create the GitHub repo, Drive folder, Supabase project, and Vercel deployment." /> : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <ProvisionLink label="GitHub repo" url={provRec.github_repo_url} value={provRec.github_repo} />
                <ProvisionLink label="Drive folder" url={provRec.drive_folder_url} value={provRec.drive_folder_id} />
                <ProvisionLink label="Supabase project" url={provRec.supabase_project_url} value={provRec.supabase_project_id} />
                <ProvisionLink label="Vercel deployment" url={provRec.vercel_url} value={provRec.vercel_url} />
              </div>
              {provRec.error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{provRec.error}</div>}
              {provRec.logs && provRec.logs.length > 0 && (
                <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">Logs</div>
                  <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black p-3 text-xs text-white/50">{provRec.logs.join("\n")}</pre>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function ProvisionLink({ label, url, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black p-3">
      <div className="text-xs text-white/40">{label}</div>
      {url ? <a href={url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-sm text-lime-300 hover:underline">{value || url} <ExternalLink className="h-3 w-3" /></a> : <div className="mt-0.5 text-sm text-white/30">{value || "—"}</div>}
    </div>
  );
}