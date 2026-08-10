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
        <section className="relative overflow-hidden bg-black">
          <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover"
            poster="https://media.base44.com/images/public/6a79444e821211169a147eee/3ef1d67ff_generated_image.png">
            <source src="https://media.base44.com/videos/public/6a79444e821211169a147eee/c3c9895fd_Lead_Gen_Hero_v2.mp4?v=3" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/20" />
          <div className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-lime-400">No Surprises · No Retainers</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] sm:text-6xl lg:text-7xl">
              Simple, Transparent<br />
              <span className="relative inline-block">
                <span className="relative z-10">Pricing.</span>
                <motion.span className="absolute bottom-1 left-0 h-4 w-full bg-lime-400 sm:h-6"
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 0.5 }} style={{ originX: 0 }} />
              </span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
              className="mx-auto mt-6 max-w-xl text-lg font-medium text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] sm:text-xl">
              Choose a plan or buy individual tools, web packs, and app packs. Done-for-you services start with a deposit.
            </motion.p>
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