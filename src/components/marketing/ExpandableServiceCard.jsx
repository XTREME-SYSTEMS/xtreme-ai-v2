import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, ArrowRight, Loader2, BarChart3, FileText, Download } from "lucide-react";
import { startCheckout } from "@/lib/checkout";
import ContractPreview from "@/components/marketing/ContractPreview";

// An expandable service card. Collapsed: shows name, price, tagline, buy button.
// Expanded: shows full description, itemized features, statistics, and a
// "Review Contract" button that opens the ContractPreview modal before checkout.
export default function ExpandableServiceCard({ service, index }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const Icon = service.icon;

  const handleBuy = async () => {
    setContractOpen(true);
  };

  const handleAgree = async () => {
    setContractOpen(false);
    setLoading(true);
    try {
      await startCheckout(service.productId);
    } catch (e) {
      alert(e.message || "Checkout failed. Please try again.");
    }
    setLoading(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.06 }}
        className="overflow-hidden rounded-2xl border border-black/10 bg-white transition-all hover:border-black hover:shadow-xl"
      >
        {/* Collapsed header — always visible */}
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${service.accent}`}>
              <Icon className="h-5 w-5 text-black" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-black">{service.name}</h3>
              <p className="mt-0.5 text-sm text-black/50">{service.tagline}</p>
              {service.downloadable && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-lime-400/40 bg-lime-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-700">
                  <Download className="h-3 w-3" /> Downloadable
                </span>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xl font-black text-black">{service.priceLabel}</div>
            </div>
          </div>

          <p className="mt-3 text-sm text-black/60">{service.description}</p>

          {/* Statistics badges */}
          {service.statistics && service.statistics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {service.statistics.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-lg border border-lime-400/30 bg-lime-400/10 px-2.5 py-1">
                  <BarChart3 className="h-3 w-3 text-lime-700" />
                  <span className="text-xs font-semibold text-lime-700">{s.value}</span>
                  <span className="text-xs text-black/50">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={handleBuy}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-lime-400 hover:text-black disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Buy Now <ArrowRight className="h-4 w-4" /></>}
            </button>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold text-black transition-all hover:bg-black/5"
            >
              {expanded ? "Less" : "Details"}
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-black/10 bg-zinc-50 p-6">
                {/* Full feature list */}
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lime-700">
                  <FileText className="h-3.5 w-3.5" /> What's Included
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {service.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-black/70">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Delivery + contract button */}
                <div className="mt-5 flex items-center justify-between rounded-xl border border-black/10 bg-white p-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-black/40">Estimated Delivery</div>
                    <div className="text-sm font-bold text-black">{service.deliveryTime}</div>
                  </div>
                  <button
                    onClick={() => setContractOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border-2 border-lime-400 bg-lime-400/10 px-4 py-2 text-sm font-bold text-lime-700 transition-all hover:bg-lime-400 hover:text-black"
                  >
                    <FileText className="h-4 w-4" /> Review Contract
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ContractPreview service={service} open={contractOpen} onClose={() => setContractOpen(false)} onAgree={handleAgree} />
    </>
  );
}