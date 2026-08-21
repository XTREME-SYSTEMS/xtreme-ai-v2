import { useState } from "react";
import { Tag, Loader2, CheckCircle2, XCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Reusable promo code input with validation. The user enters a code, clicks
// "Apply", and the component calls the validate-promo-code backend function.
// On success, it calls onValidated(code) so the parent can pass it to checkout.
// On failure, it shows an inline error. A "Remove" button clears the code.
export default function PromoCodeInput({ productId, onValidated, originalPrice }) {
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [discount, setDiscount] = useState(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("validate-promo-code", {
        code: code.trim(),
        productId,
      });
      const data = res?.data || res;
      if (data?.valid) {
        setAppliedCode(data.code);
        setDiscount({ type: data.discountType, value: data.discountValue });
        onValidated?.(data.code);
      } else {
        setError(data?.error || "Invalid promo code");
        onValidated?.(null);
      }
    } catch (e) {
      setError(e?.message || "Could not validate promo code");
      onValidated?.(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedCode(null);
    setCode("");
    setError(null);
    setDiscount(null);
    onValidated?.(null);
  };

  // Calculate display discount
  let discountText = "";
  if (appliedCode && discount && originalPrice) {
    const price = parseFloat(originalPrice);
    if (discount.type === "percentage") {
      const amount = price * (discount.value / 100);
      discountText = `-$${amount.toFixed(2)} (${discount.value}% off)`;
    } else {
      discountText = `-$${discount.value.toFixed(2)} off`;
    }
  }

  if (appliedCode) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-400" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-lime-300">
            {appliedCode} applied
          </div>
          {discountText && (
            <div className="text-[11px] text-lime-400/80">{discountText}</div>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="rounded-md p-1 text-white/40 hover:text-white"
          aria-label="Remove promo code"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApply())}
            placeholder="PROMO CODE"
            className="w-full rounded-lg border border-white/15 bg-black py-2 pl-8 pr-3 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/40 px-3 py-2 text-xs font-semibold text-lime-400 transition-colors hover:bg-lime-400/10 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <XCircle className="h-3 w-3 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}