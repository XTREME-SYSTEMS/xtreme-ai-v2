import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Check, ShieldCheck, Clock, RefreshCw } from "lucide-react";

// A modal that shows the client exactly what they're buying before they pay:
// itemized deliverables, delivery timeline, iteration policy, refund terms,
// and an explicit "I understand & agree" checkbox that unlocks the Buy button.
export default function ContractPreview({ service, open, onClose, onAgree }) {
  const [agreed, setAgreed] = useState(false);

  if (!service) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-lime-600" />
                <h2 className="text-lg font-bold text-black">Service Agreement Preview</h2>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-black/40 hover:bg-black/5">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* What you're buying */}
              <div className="rounded-xl border border-black/10 bg-zinc-50 p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-lime-700">{service.name}</h3>
                <p className="mt-1 text-sm text-black/70">{service.description}</p>
                <div className="mt-3 text-2xl font-black text-black">{service.priceLabel}</div>
              </div>

              {/* Itemized deliverables */}
              <div className="mt-5">
                <h4 className="text-sm font-bold text-black">What's Included</h4>
                <ul className="mt-2 space-y-1.5">
                  {service.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-black/70">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Terms */}
              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-white p-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-lime-600" />
                  <div>
                    <div className="text-sm font-semibold text-black">Delivery Timeline</div>
                    <p className="text-xs text-black/60">Estimated delivery: <span className="font-semibold">{service.deliveryTime}</span>. In actuality, the moment you finish the onboarding process, you get instant access to all files and deliverables in your client portal.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-white p-3">
                  <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-lime-600" />
                  <div>
                    <div className="text-sm font-semibold text-black">Revisions & Iterations</div>
                    <p className="text-xs text-black/60">You get up to <span className="font-semibold">2 iterations free of charge</span> on all deliverables. Each step has a "Request Revision" button so you can ask for changes at any point in the process.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-white p-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lime-600" />
                  <div>
                    <div className="text-sm font-semibold text-black">Refund Policy</div>
                    <p className="text-xs text-black/60">Deposits are non-refundable once work begins. Subscription plans can be canceled anytime — you keep access through the end of your billing period. À-la-carte purchases are refundable if no work has started.</p>
                  </div>
                </div>
              </div>

              {/* Agreement checkbox */}
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-black/10 p-4 transition-colors hover:border-lime-400">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-lime-500"
                />
                <span className="text-sm text-black/70">
                  I have reviewed the service agreement, understand what's included, the delivery timeline, the revision policy, and the refund terms. I agree to proceed with this purchase.
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-black/10 px-6 py-4">
              <button onClick={onClose} className="rounded-xl border border-black/15 px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-black/5">
                Cancel
              </button>
              <button
                onClick={() => { if (agreed) onAgree(); }}
                disabled={!agreed}
                className="flex-1 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30"
              >
                {agreed ? "I Agree — Proceed to Checkout" : "Check the box to agree"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}