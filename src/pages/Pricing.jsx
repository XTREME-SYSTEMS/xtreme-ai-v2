import MarketingNav from "@/components/marketing/MarketingNav";
import PricingSection from "@/components/marketing/PricingSection";
import Contact from "@/components/marketing/Contact";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { motion } from "framer-motion";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { startCheckout } from "@/lib/checkout";

const ADDONS = [
  { name: "AI Tools", desc: "Buy individual AI chatbots, calculators, estimators, and lead tools.", price: "From $99", productId: "ai-tool" },
  { name: "Web Packs", desc: "Complete website packages — design, build, SEO, and launch.", price: "From $2,500", productId: "web-pack" },
  { name: "App Packs", desc: "Custom web apps, client portals, and internal tools.", price: "From $5,000", productId: "app-pack" },
];

export default function Pricing() {
  const [loading, setLoading] = useState(null);

  const handleCheckout = async (productId, name) => {
    setLoading(name);
    try { await startCheckout(productId); } catch (e) { alert(e.message || "Checkout failed."); }
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="pt-16">
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-black tracking-tight text-black sm:text-6xl">Simple, Transparent Pricing.</h1>
              <p className="mt-4 text-lg text-black/60">Choose a plan or buy individual tools, web packs, and app packs. Done-for-you services start with a deposit.</p>
            </motion.div>
          </div>
        </section>

        <PricingSection showHeader={false} />

        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-600">Buy What You Need</div>
              <h2 className="text-3xl font-black tracking-tight text-black sm:text-5xl">À La Carte Add-Ons.</h2>
              <p className="mt-4 text-lg text-black/60">Not ready for a full plan? Buy individual AI tools, web packs, or app packs — pay online, get instant access.</p>
            </motion.div>
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {ADDONS.map((a, i) => (
                <motion.div key={a.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="rounded-2xl border border-black/10 bg-white p-7 transition-all hover:border-black hover:shadow-xl">
                  <h3 className="text-xl font-bold text-black">{a.name}</h3>
                  <p className="mt-2 text-sm text-black/60">{a.desc}</p>
                  <div className="mt-4 text-2xl font-black text-black">{a.price}</div>
                  <ul className="mt-4 space-y-2 text-sm text-black/70">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-lime-600" /> Pay online (Stripe / Wix)</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-lime-600" /> Instant dashboard access</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-lime-600" /> Approval-gated delivery</li>
                  </ul>
                  <button onClick={() => handleCheckout(a.productId, a.name)} disabled={loading === a.name}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition-all hover:bg-lime-400 hover:text-black disabled:opacity-50">
                    {loading === a.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Buy Now <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Contact />
      </main>
      <MarketingFooter />
    </div>
  );
}