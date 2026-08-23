import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, ArrowRight, Sparkles } from "lucide-react";
import { getFreeProducts } from "@/lib/serviceCatalog";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// Public Free Tools hub — surfaces all $0 products. Each card links to the
// existing portal tool that powers it (or the closest relevant page).
export default function FreeTools() {
  const navigate = useNavigate();
  const freeProducts = getFreeProducts();

  const ROUTES = {
    "free-seo-audit": "/free-audit",
    "free-business-names": "/business-name-studio",
    "free-domain-check": "/domain-acquisition",
    "free-logo-concept": "/logo-generator",
    "free-competitor-scan": "/audits",
    "free-gbp-check": "/business-profile",
    "free-keyword-research": "/opportunities",
    "free-speed-test": "/audits",
  };

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="pt-16">
        {/* Hero */}
        <section className="bg-black py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-1.5"
            >
              <Gift className="h-4 w-4 text-lime-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-lime-400">No Credit Card Required</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl font-black tracking-tight text-white sm:text-6xl"
            >
              Free Marketing Tools
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mx-auto mt-6 max-w-xl text-lg font-medium text-white/70 sm:text-xl"
            >
              Try our AI tools free — SEO audits, business names, domain checks, logo concepts, and more. Upgrade to a full pack when you're ready.
            </motion.p>
          </div>
        </section>

        {/* Free tools grid */}
        <section className="bg-zinc-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {freeProducts.map((product, i) => {
                const Icon = product.icon;
                const route = ROUTES[product.id];
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="group flex flex-col rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:border-lime-400/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${product.accent}`}>
                        <Icon className="h-5 w-5 text-lime-600" />
                      </div>
                      <span className="rounded-full bg-lime-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-lime-700">
                        Free
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-semibold text-black">{product.name}</h3>
                    <p className="mt-1 text-xs text-black/50">{product.tagline}</p>

                    <ul className="mt-3 space-y-1.5">
                      {product.features.slice(0, 4).map((f, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-black/60">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-lime-500/60" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-4">
                      <button
                        type="button"
                        onClick={() => navigate(route)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
                      >
                        Try It Free <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Upgrade CTA */}
        <section className="bg-black py-16">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <Sparkles className="mx-auto h-8 w-8 text-lime-400" />
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Ready for the full pack?</h2>
            <p className="mt-2 text-base text-white/60">
              Upgrade from a free sample to the complete 10-concept pack, full website build, or ongoing monthly service.
            </p>
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-6 py-3 text-sm font-semibold text-black hover:bg-lime-300"
            >
              View All Products <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}