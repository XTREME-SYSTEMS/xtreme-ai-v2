import { useEffect } from "react";
import { X, CheckCircle, Calendar, Hash, Mail, CreditCard } from "lucide-react";
import { getProductDetails } from "@/lib/productDetails";

// Modal showing full details for a single purchased item. The footer button
// advances (onContinue) when provided — used on the Welcome step so reviewing
// the package moves the client forward — otherwise it just closes.
export default function PurchaseDetailModal({ purchase, onClose, onContinue, continueLabel = "Continue" }) {
  const detail = purchase ? getProductDetails(purchase.productId) : null;

  useEffect(() => {
    if (!purchase) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [purchase, onClose]);

  if (!purchase) return null;
  const Icon = detail.icon;

  const fmtMoney = (p) => {
    if (!p?.amount) return "";
    const sym = p.currency === "USD" ? "$" : "";
    return `${sym}${p.amount}${p.currency ? ` ${p.currency}` : ""}`;
  };
  const fmtDate = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }); }
    catch { return "—"; }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl">
        {/* Header banner */}
        <div className={`relative bg-gradient-to-br ${detail.accent} p-5`}>
          <button onClick={onClose} className="absolute right-3 top-3 text-white/60 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/30">
              <Icon className="h-6 w-6 text-lime-400" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white">{purchase.productName || purchase.productId}</h2>
              <p className="text-xs text-white/60">{detail.tagline}</p>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          <p className="text-sm text-white/70">{detail.description}</p>

          {/* Purchase facts */}
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/30 p-3 text-xs">
            <Fact icon={CreditCard} label="Amount" value={purchase.amount ? fmtMoney(purchase) : "—"} />
            <Fact icon={CheckCircle} label="Status" value="Active" valueClass="text-lime-400" />
            <Fact icon={Calendar} label="Paid on" value={fmtDate(purchase.paidAt)} />
            <Fact icon={Hash} label="Order" value={purchase.orderId ? purchase.orderId.slice(0, 12) : "—"} />
            {purchase.quantity > 1 && <Fact icon={CheckCircle} label="Quantity" value={String(purchase.quantity)} />}
            {purchase.buyerEmail && <Fact icon={Mail} label="Buyer" value={purchase.buyerEmail} />}
          </div>

          {/* What's included */}
          {detail.features.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-lime-400">What's included</h3>
              <ul className="mt-2 space-y-1.5">
                {detail.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deliverables */}
          {detail.deliverables.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-lime-400">Deliverables</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {detail.deliverables.map((d, i) => (
                  <span key={i} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={onContinue || onClose}
            className="w-full rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
          >
            {onContinue ? continueLabel : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value, valueClass = "text-white" }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-white/40" />
      <div className="min-w-0">
        <div className="text-white/40">{label}</div>
        <div className={`truncate font-medium ${valueClass}`}>{value}</div>
      </div>
    </div>
  );
}