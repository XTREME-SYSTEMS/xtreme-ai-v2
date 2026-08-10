import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, AlertTriangle, Lightbulb, TrendingDown, ArrowRight, Loader2, Zap, Gauge } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { key: "seo", label: "SEO" },
  { key: "aeo", label: "AEO / AI Search" },
  { key: "conversion", label: "Conversion" },
  { key: "performance", label: "Performance" },
  { key: "mobile", label: "Mobile" },
  { key: "trust", label: "Trust" },
  { key: "brand", label: "Brand" },
  { key: "lead_capture", label: "Lead Capture" },
];

const SEV = {
  critical: { label: "Critical", cls: "bg-red-100 text-red-700 border-red-200" },
  high: { label: "High", cls: "bg-orange-100 text-orange-700 border-orange-200" },
  medium: { label: "Medium", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  low: { label: "Low", cls: "bg-zinc-100 text-zinc-600 border-zinc-200" },
};
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const scoreColor = (s) => (s == null ? "#a1a1aa" : s >= 75 ? "#65a30d" : s >= 50 ? "#d97706" : "#dc2626");

export default function FreeAuditPage() {
  const [form, setForm] = useState({ website: "", name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const run = async (e) => {
    e.preventDefault();
    if (!form.website || !form.email) return;
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await base44.functions.invoke("run-free-audit", form);
      setReport(res.data || res);
    } catch (err) {
      setError(err?.message || "Audit failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-zinc-300 px-4 py-3 text-black outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/30";

  const scores = report?.scores || {};
  const leaks = (report?.leaks || []).slice().sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9));

  return (
    <div className="min-h-screen bg-white text-black">
      <MarketingNav />
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        {!report && !loading && (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl sm:p-12">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400"><Search className="h-7 w-7 text-black" /></div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Free AI Optimization Audit</h1>
              <p className="mt-2 text-zinc-600">Enter your website and we'll run an AI audit to find where you're losing leads — SEO, AEO, conversion, performance, and more. Free, instant.</p>
            </div>
            <form onSubmit={run} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Website URL *</label>
                <input required value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputCls} placeholder="yourbusiness.com" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Your Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Email *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="you@business.com" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-lime-400 px-6 py-4 text-base font-bold text-black transition-all hover:bg-lime-300 disabled:opacity-60">
                Run My Free Audit
              </button>
              <p className="text-center text-xs text-zinc-400">No credit card. We'll email your report and follow up about fixing the leaks.</p>
            </form>
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-xl">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-lime-500" />
            <h2 className="mt-5 text-2xl font-black">Auditing {form.website}…</h2>
            <p className="mt-2 text-zinc-600">Analyzing SEO, AEO, conversion, performance, mobile, trust, and lead capture. This takes a few seconds.</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-3 font-semibold text-red-700">{error}</p>
            <button onClick={() => setError("")} className="mt-4 rounded-lg bg-black px-5 py-2.5 text-sm font-bold text-white">Try again</button>
          </div>
        )}

        {report && !loading && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
              <div className="flex flex-col items-center text-center">
                <div className="text-xs font-semibold uppercase tracking-widest text-lime-600">Your Optimization Score</div>
                <div className="my-2 flex h-32 w-32 items-center justify-center rounded-full border-8 border-zinc-100" style={{ borderColor: scoreColor(report.overall_score) }}>
                  <span className="text-4xl font-black" style={{ color: scoreColor(report.overall_score) }}>{Math.round(report.overall_score ?? 0)}</span>
                </div>
                <h1 className="text-2xl font-black sm:text-3xl">{(report.overall_score ?? 0) >= 75 ? "Solid — but room to grow" : (report.overall_score ?? 0) >= 50 ? "You're losing leads" : "Major lead leaks detected"}</h1>
                <p className="mt-2 max-w-xl text-zinc-600">{report.summary}</p>
                {report.estimated_leads_lost && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
                    <TrendingDown className="h-4 w-4" /> Est. leads lost: {report.estimated_leads_lost}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Gauge className="h-5 w-5 text-lime-500" /> Category Scores</h2>
              <div className="space-y-3">
                {CATEGORIES.map((c) => {
                  const val = scores[c.key];
                  return (
                    <div key={c.key}>
                      <div className="mb-1 flex justify-between text-sm font-semibold">
                        <span className="text-zinc-700">{c.label}</span>
                        <span style={{ color: scoreColor(val) }}>{val == null ? "—" : `${Math.round(val)}/100`}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full rounded-full" style={{ width: `${val ?? 0}%`, background: scoreColor(val) }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {leaks.length > 0 && (
              <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><AlertTriangle className="h-5 w-5 text-red-500" /> Lead Leaks Found ({leaks.length})</h2>
                <div className="space-y-4">
                  {leaks.map((l, i) => {
                    const sev = SEV[l.severity] || SEV.low;
                    return (
                      <div key={i} className="rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-bold text-black">{l.category}</div>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${sev.cls}`}>{sev.label}</span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-700"><span className="font-semibold">Finding:</span> {l.finding}</p>
                        <p className="mt-1 text-sm text-zinc-700"><span className="font-semibold">Fix:</span> {l.recommendation}</p>
                        {l.impact && <p className="mt-1 text-sm text-lime-700"><span className="font-semibold">Impact:</span> {l.impact}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {report.opportunities?.length > 0 && (
              <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Lightbulb className="h-5 w-5 text-lime-500" /> Top Opportunities</h2>
                <ul className="space-y-2">
                  {report.opportunities.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-700"><Zap className="mt-0.5 h-4 w-4 shrink-0 text-lime-500" /> {o}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-3xl border-2 border-lime-400 bg-gradient-to-br from-lime-50 to-white p-8 text-center shadow-xl">
              <h2 className="text-2xl font-black">Want us to fix these leaks for you?</h2>
              <p className="mx-auto mt-2 max-w-lg text-zinc-600">Our AI-powered team turns this audit into a done-for-you fix plan — websites, SEO, AEO, and lead capture built to rank and convert.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/#contact" className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-6 py-3 text-sm font-bold text-black hover:bg-lime-300">Book a free strategy call <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/pricing" className="inline-flex items-center gap-2 rounded-lg border-2 border-black px-6 py-3 text-sm font-bold hover:bg-black hover:text-white">See pricing</Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <MarketingFooter />
    </div>
  );
}