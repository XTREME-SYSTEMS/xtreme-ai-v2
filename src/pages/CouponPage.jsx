import { useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Check, ArrowRight } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { base44 } from "@/api/base44Client";

const COUPON_CODE = "LGNY10";

export default function CouponPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return;
    setSubmitting(true);
    try {
      await base44.entities.CouponLead.create({
        name: form.name, email: form.email, phone: form.phone,
        coupon_code: COUPON_CODE, status: "new", source: "announcement_bar",
      });
      try { await base44.functions.invoke("send-coupon-email", { ...form, coupon_code: COUPON_CODE }); } catch {}
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-zinc-300 px-4 py-3 text-black outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/30";

  return (
    <div className="min-h-screen bg-white text-black">
      <MarketingNav />
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-32">
        {!done ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl sm:p-12">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400"><Gift className="h-7 w-7 text-black" /></div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Get 10% Off AI-Optimized Websites</h1>
              <p className="mt-2 text-zinc-600">Enter your contact info and we'll send your coupon instantly.</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Full Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Jane Smith" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Email *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="you@business.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Phone *</label>
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="(555) 123-4567" />
              </div>
              <button type="submit" disabled={submitting} className="w-full rounded-lg bg-lime-400 px-6 py-4 text-base font-bold text-black transition-all hover:bg-lime-300 disabled:opacity-60">
                {submitting ? "Sending..." : "Claim My 10% Coupon"}
              </button>
              <p className="text-center text-xs text-zinc-400">We'll email your coupon and follow up about your project. No spam.</p>
            </form>
          </div>
        ) : (
          <div className="rounded-3xl border border-lime-400 bg-gradient-to-br from-lime-50 to-white p-8 text-center shadow-xl sm:p-12">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-lime-400"><Check className="h-8 w-8 text-black" /></div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Your Coupon Is Ready!</h1>
            <p className="mt-2 text-zinc-600">Use this code at checkout to save 10% on any AI-optimized website package.</p>
            <div className="mx-auto mt-6 max-w-sm rounded-2xl border-2 border-dashed border-lime-500 bg-black p-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-lime-400">Your Coupon Code</div>
              <div className="mt-1 text-4xl font-black tracking-wider text-white">{COUPON_CODE}</div>
              <div className="mt-1 text-sm text-white/60">10% off — AI-Optimized Websites</div>
            </div>
            <p className="mt-5 text-sm text-zinc-500">A branded email with your coupon is on its way{form.email ? ` to ${form.email}` : ""}.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-6 py-3 text-sm font-bold text-black hover:bg-lime-300">Use it now <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/#contact" className="inline-flex items-center gap-2 rounded-lg border-2 border-black px-6 py-3 text-sm font-bold hover:bg-black hover:text-white">Book a call</Link>
            </div>
          </div>
        )}
      </div>
      <MarketingFooter />
    </div>
  );
}