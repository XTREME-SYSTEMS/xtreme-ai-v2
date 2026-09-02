import { useState } from "react";
import { motion } from "framer-motion";
import MarketingNav from "@/components/marketing/MarketingNav";
import HeroInteractive from "@/components/marketing/HeroInteractive";
import PricingSection from "@/components/marketing/PricingSection";
import PromoCodeInput from "@/components/marketing/PromoCodeInput";
import ConsultBooking from "@/components/marketing/ConsultBooking";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import ExpandableServiceCard from "@/components/marketing/ExpandableServiceCard";
import { CATEGORIES, getServicesByCategory } from "@/lib/serviceCatalog";

export default function Pricing() {
  const [activeCategory, setActiveCategory] = useState("web-pack");
  const services = getServicesByCategory(activeCategory);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        {/* Hero — same as home page */}
        <HeroInteractive />

        {/* Subscription plans */}
        <PricingSection showHeader={false} />

        {/* Promo code input */}
        <PromoCodeInput />

        {/* À la carte — all services with expandable cards */}
        <section className="bg-zinc-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-700">Buy What You Need</div>
              <h2 className="text-3xl font-black tracking-tight text-black sm:text-5xl">À La Carte Services.</h2>
              <p className="mt-4 text-lg text-black/60">Not ready for a full plan? Buy individual AI tools, web packs, app packs, or services — pay online, get instant access. Items marked <span className="inline-flex items-center gap-0.5 font-semibold text-lime-700">"Downloadable"</span> deliver files you can use without the portal. Click any card to see what's included and review the contract before you buy.</p>
            </motion.div>

            {/* Category tabs */}
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {CATEGORIES.filter((c) => c.id !== "plan").map((cat) => {
                const Icon = cat.icon;
                const count = getServicesByCategory(cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                      activeCategory === cat.id
                        ? "bg-black text-white"
                        : "border border-black/15 text-black/60 hover:border-black hover:text-black"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {cat.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeCategory === cat.id ? "bg-lime-400 text-black" : "bg-black/10 text-black/50"}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Service grid */}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <ExpandableServiceCard key={service.id} service={service} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* 15-min consult booking */}
        <ConsultBooking />
      </main>
      <MarketingFooter />
    </div>
  );
}