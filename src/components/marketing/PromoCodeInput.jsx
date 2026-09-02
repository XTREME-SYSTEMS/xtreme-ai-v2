import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Tag, Loader2, Check, X, Sparkles } from "lucide-react";

// Public promo-code input section for the Pricing page. Validates the code
// via the validate-promo-code backend function and shows the discount the
// user will receive. The applied code is stored in localStorage so the
// checkout flow can pick it up.
export default function PromoCodeInput() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleApply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("validate-promo-code", { code: code.trim() });
      const data = res?.data || res;
      if (data?.valid) {
        setResult(data);
        localStorage.setItem("appliedPromoCode", code.trim().toUpperCase());
      } else {
        setError(data?.error || "Invalid promo code");
        localStorage.removeItem("appliedPromoCode");
      }
    } catch (err) {
      setError("Could not validate promo code");
      localStorage.removeItem("appliedPromoCode");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setResult(null);
    setError("");
    localStorage.removeItem("appliedPromoCode");
  };

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="rounded-2xl border-2 border-dashed border-amber-400/40 bg-amber-400/5 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-bold text-black">Have a promo code?</h3>
          </div>
          <p className="mt-1 text-sm text-black/60">Enter your code below — your discount will be applied at checkout.</p>

          {result ? (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-400/40 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="text-sm font-bold text-emerald-700">
                    {result.discountType === "percentage" ? `${result.discountValue}% off` : `$${result.discountValue} off`} applied!
                  </div>
                  {result.description && <div className="text-xs text-emerald-600">{result.description}</div>}
                </div>
              </div>
              <button onClick={handleClear} className="text-emerald-600 hover:text-emerald-800" title="Remove code">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleApply} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="w-full rounded-lg border border-black/15 py-3 pl-10 pr-4 text-sm font-medium text-black uppercase placeholder:text-black/30 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-50 px-3 py-2 text-sm text-red-600">
              <X className="h-4 w-4" /> {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}