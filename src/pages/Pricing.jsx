import { useState } from "react";
import { motion } from "framer-motion";
import MarketingNav from "@/components/marketing/MarketingNav";
import PricingSection from "@/components/marketing/PricingSection";
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
      <main className="pt-16">
        {/* Hero */}
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
              Choose a plan or buy individual tools, web packs, and services. Every purchase includes a contract preview so you know exactly what you're getting.
            </motion.p>
          </div>
        </section>

        {/* Subscription plans */}
        <PricingSection showHeader={false} />

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