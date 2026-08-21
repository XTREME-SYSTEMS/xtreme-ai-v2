import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { startCheckout } from "@/lib/checkout";

const TIERS = [
  {
    name: "Free Starter", monthly: 0, tagline: "Full Elite access — try the entire workflow",
    features: ["Unlimited AI Tools", "Full Brand & Website Build", "SEO + AEO Optimization", "Social Media Pack", "Video Pack", "Approval-Gated Workflow", "Client Dashboard", "Up to 2 Free Iterations"],
    cta: "Start Free", highlight: false, free: true,
  },
  {
    name: "Pro", monthly: 499, yearly: 4990, tagline: "For growing businesses",
    features: ["5 AI Tools", "1 Custom Website", "SEO Basics", "Email Support", "Brand Pack (3 options)", "Client Dashboard"],
    cta: "Choose Pro", highlight: false, monthlyId: "pro-monthly", annualId: "pro-annual",
  },
  {
    name: "Elite", monthly: 1499, yearly: 14990, tagline: "Done-for-you growth",
    features: ["Unlimited AI Tools", "5 Custom Websites", "Full SEO + AEO", "Done-For-You Service", "Priority Support", "Brand Pack (10 options + 2 iterations)", "Approval-Gated Workflow", "SMS + Email Notifications"],
    cta: "Choose Elite", highlight: true, monthlyId: "elite-monthly", annualId: "elite-annual",
  },
  {
    name: "Enterprise", monthly: null, tagline: "Full operating system",
    features: ["Everything in Elite", "Dedicated Growth Team", "Custom AI Development", "SLA Guarantee", "Unlimited Websites", "White-Label Dashboard", "Quarterly Strategy Reviews"],
    cta: "Contact Sales", highlight: false, contact: true,
  },
];

export default function PricingSection({ showHeader = true }) {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(null);

  const handleCheckout = async (productId, tierName) => {
    setLoading(tierName);
    try {
      await startCheckout(productId);
    } catch (e) {
      alert(e.message || "Checkout failed. Please try again.");
    }
    setLoading(null);
  };

  return (
    <section id="pricing" className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {showHeader && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-700">Pricing</div>
            <h2 className="text-3xl font-bold tracking-tight text-black sm:text-5xl">Choose Your Plan</h2>
            <p className="mt-4 text-lg text-black/60">Start free with full Elite access, or pick a paid plan. No credit card required to get started.</p>

            <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-black/15 bg-white p-1">
              <button onClick={() => setAnnual(false)} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${!annual ? "bg-lime-400 text-black" : "text-black/60"}`}>Monthly</button>
              <button onClick={() => setAnnual(true)} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${annual ? "bg-lime-400 text-black" : "text-black/60"}`}>Annual <span className="text-xs opacity-70">Save 2 mo</span></button>
            </div>
          </motion.div>
        )}

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {TIERS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative flex flex-col rounded-2xl border p-6 ${t.highlight ? "border-lime-400 bg-lime-400/5 lg:scale-105 shadow-xl shadow-lime-400/20" : "border-black/10 bg-white"}`}>
              {t.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-lime-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black">Most Popular</div>}
              <h3 className="text-lg font-bold text-black">{t.name}</h3>
              <p className="mt-1 text-xs text-black/50">{t.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                {t.monthly === null ? <span className="text-3xl font-bold text-black">Custom</span>
                  : t.monthly === 0 ? <span className="text-4xl font-bold text-black">$0</span>
                  : <><span className="text-4xl font-bold text-black">${annual && t.yearly ? Math.round(t.yearly / 12) : t.monthly}</span><span className="text-sm text-black/50">/mo</span></>}
              </div>
              {annual && t.yearly ? <div className="mt-1 text-xs text-lime-700">Billed ${t.yearly.toLocaleString()}/yr</div> : <div className="mt-1 text-xs text-black/20">&nbsp;</div>}

              {t.free ? (
                <Link to="/register" className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-lime-400 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-lime-300">
                  {t.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : t.contact ? (
                <a href="/#contact" className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/20 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-black hover:text-white">
                  {t.cta} <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <button onClick={() => handleCheckout(annual ? t.annualId : t.monthlyId, t.name)} disabled={loading === t.name}
                  className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:opacity-50 ${t.highlight ? "bg-lime-400 text-black hover:bg-lime-300" : "border border-black/20 text-black hover:bg-black hover:text-white"}`}>
                  {loading === t.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t.cta} <ArrowRight className="h-4 w-4" /></>}
                </button>
              )}

              <ul className="mt-6 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-black/70">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${t.highlight ? "text-lime-600" : "text-black/40"}`} /> {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-black/40">
          <Sparkles className="mr-1 inline h-4 w-4 text-lime-600" /> Done-for-you services require a deposit. After payment, create your account and get instant dashboard access.
        </p>
      </div>
    </section>
  );
}