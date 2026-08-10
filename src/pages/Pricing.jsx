import MarketingNav from "@/components/marketing/MarketingNav";
import PricingSection from "@/components/marketing/PricingSection";
import Contact from "@/components/marketing/Contact";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const ADDONS = [
  { name: "AI Tools", desc: "Buy individual AI chatbots, calculators, estimators, and lead tools.", price: "From $99" },
  { name: "Web Packs", desc: "Complete website packages — design, build, SEO, and launch.", price: "From $2,500" },
  { name: "App Packs", desc: "Custom web apps, client portals, and internal tools.", price: "From $5,000" },
];

export default function Pricing() {
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