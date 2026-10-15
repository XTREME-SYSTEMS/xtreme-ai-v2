import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel } from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles } from "lucide-react";

function slugify(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default function CreateMarket() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    city: "", state: "FL", brand_name: "", public_business_name: "", phone: "", email: "",
    service_area_description: "", domain: "", primary: "#0EA5E9", accent: "#22D3EE",
    salesperson_name: "", salesperson_title: "", salesperson_phone: "",
  });

  const set = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.city || !form.state) return;
    setSaving(true);
    try {
      const slug = slugify(`${form.state}-${form.city}`);
      const market = await base44.entities.Market.create({
        slug, city: form.city, state: form.state,
        brand_name: form.brand_name, public_business_name: form.public_business_name || form.brand_name,
        phone: form.phone, email: form.email, service_area_description: form.service_area_description,
        domain: form.domain, status: "draft",
        brand_colors: { primary: form.primary, accent: form.accent },
        salesperson: { name: form.salesperson_name, title: form.salesperson_title, phone: form.salesperson_phone },
      });
      toast({ title: "Market created", description: "Generating SEO + content kit…" });
      try { await base44.functions.invoke("generateMarketAssets", { market_id: market.id, job_type: "seo" }); }
      catch (genErr) { toast({ title: "Generation queued", description: "Regenerate from the market detail page.", variant: "destructive" }); }
      navigate(`/markets/${market.id}`);
    } catch (err) { toast({ title: "Error", description: String(err.message || err), variant: "destructive" }); }
    setSaving(false);
  };

  const inputCls = "w-full rounded-md border border-white/15 bg-black px-2.5 py-2 text-sm text-white";
  const labelCls = "text-xs text-white/50";

  return (
    <div>
      <PageHeader title="Create Market" subtitle="Enter a market + brand — AI generates the full SEO + content kit on create." />
      <form onSubmit={submit}>
        <Panel title="Market & Brand">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={labelCls}>City *</label><input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Pompano Beach" required /></div>
            <div><label className={labelCls}>State *</label><select className={inputCls} value={form.state} onChange={(e) => set("state", e.target.value)}>{US_STATES.map((s) => <option key={s} value={s} className="bg-black">{s}</option>)}</select></div>
            <div><label className={labelCls}>Brand name</label><input className={inputCls} value={form.brand_name} onChange={(e) => set("brand_name", e.target.value)} placeholder="Epoxy Garage Floor Estimate" /></div>
            <div><label className={labelCls}>Public business name</label><input className={inputCls} value={form.public_business_name} onChange={(e) => set("public_business_name", e.target.value)} placeholder="Epoxy Garage Floor Estimate — Pompano Beach" /></div>
            <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(772) 209-0266" /></div>
            <div><label className={labelCls}>Email</label><input className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="leads@…" /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Service area description</label><input className={inputCls} value={form.service_area_description} onChange={(e) => set("service_area_description", e.target.value)} placeholder="Pompano Beach, FL and surrounding South Florida" /></div>
            <div><label className={labelCls}>Domain (optional)</label><input className={inputCls} value={form.domain} onChange={(e) => set("domain", e.target.value)} placeholder="epoxygaragefloorestimate.com" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Brand primary</label><input type="color" className="h-9 w-full rounded-md border border-white/15 bg-black" value={form.primary} onChange={(e) => set("primary", e.target.value)} /></div>
              <div><label className={labelCls}>Brand accent</label><input type="color" className="h-9 w-full rounded-md border border-white/15 bg-black" value={form.accent} onChange={(e) => set("accent", e.target.value)} /></div>
            </div>
          </div>
        </Panel>
        <div className="mt-4"><Panel title="Salesperson (optional)">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><label className={labelCls}>Name</label><input className={inputCls} value={form.salesperson_name} onChange={(e) => set("salesperson_name", e.target.value)} /></div>
            <div><label className={labelCls}>Title</label><input className={inputCls} value={form.salesperson_title} onChange={(e) => set("salesperson_title", e.target.value)} /></div>
            <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.salesperson_phone} onChange={(e) => set("salesperson_phone", e.target.value)} /></div>
          </div>
        </Panel></div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Create & Generate</button>
          <button type="button" onClick={() => navigate("/markets")} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">Cancel</button>
        </div>
      </form>
    </div>
  );
}