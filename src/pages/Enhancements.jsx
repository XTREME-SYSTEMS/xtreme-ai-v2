import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, Check, Loader2, ArrowRight, Plus, Minus, CreditCard, Eye, AlertCircle,
} from "lucide-react";
import BackButton from "@/components/client/BackButton";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { logReceipt } from "@/lib/pipelineUtils";
import {
  getEnhancementsForIndustry, getRecommendedEnhancementIds, ENHANCEMENT_TIERS,
} from "@/lib/dynamicEnhancements";
import EnhancementDemoModal from "@/components/client/EnhancementDemoModal";

// Step: Enhancements — upsell page shown BEFORE Your Designs so the customer
// can see every AI tool and add-on available, try a branded demo of each, and
// fold the total into their contract before signing. Catalog spans free,
// low, mid, and premium tiers with industry-aware recommendations first.
export default function Enhancements() {
  const navigate = useNavigate();
  const { user } = useClientUser();
  const { update } = useClientUpdate();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(null);
  const [paying, setPaying] = useState(false);

  // Demo paywall — demo users can't access enhancements or post-finalization
  // steps. Redirect them to pricing so they can choose a plan to finalize.
  useEffect(() => {
    if (user?.plan === "demo") navigate("/pricing", { replace: true });
  }, [user?.plan, navigate]);

  const industry = user?.epoxyProfile?.industry || "";
  const ENHANCEMENTS = getEnhancementsForIndustry(industry);
  const recommendedIds = getRecommendedEnhancementIds(industry);

  useEffect(() => { document.title = "Enhancements · Lead Gen Near You"; }, []);

  useEffect(() => {
    if (!user) return;
    if (user?.enhancements) setSelected(user.enhancements);
    else if (recommendedIds.length > 0) setSelected(recommendedIds); // pre-select recommended
    if (user?.enhancementsChosen) setSaved(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSaved(false);
  };

  const total = selected.reduce((sum, id) => {
    const e = ENHANCEMENTS.find((x) => x.id === id);
    return sum + (e?.price || 0);
  }, 0);

  // Approve — fold the selected enhancements + total into the client's
  // contract (autoGenerateClientContract reads enhancements + enhancementsTotal
  // from the user record when building the service agreement).
  const approve = async () => {
    setSaving(true);
    setError("");
    try {
      await update({
        enhancements: selected,
        enhancementsTotal: total,
        enhancementsChosen: true,
      });
      try {
        await logReceipt({
          action: "Enhancements approved",
          entityType: "User",
          entityId: "self",
          status: "success",
          notes: `${selected.length} enhancement(s), total $${total}`,
        });
      } catch {}
      await notifyStepComplete("enhancements", {
        businessName: user?.epoxyProfile?.businessName || "",
        clientEmail: user?.email || "",
      });
      setSaved(true);
      try { localStorage.setItem("coach:done:/enhancements", "1"); } catch {}
      setTimeout(() => navigate("/your-designs"), 700);
    } catch (e) {
      setError("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Charge the card on file for the enhancement balance via Base44 Payments.
  const chargeCard = async () => {
    if (total < 0.5) return;
    setPaying(true);
    setError("");
    try {
      const res = await base44.functions.invoke("create-checkout", { productId: "enhancements" });
      if (res?.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        setError("Couldn't start checkout. Please try again.");
      }
    } catch (e) {
      setError("Couldn't start checkout. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  // Group enhancements by tier for display
  const byTier = (tierId) => ENHANCEMENTS.filter((e) => e.tier === tierId);

  return (
    <div className="mx-auto max-w-4xl">
      <BackButton to="/video-generator" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Sparkles className="h-4 w-4" /> Enhancements
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Supercharge your package</h1>
        <p className="mt-1 text-sm text-white/60">
          We've <span className="text-lime-400 font-semibold">pre-selected the recommended enhancements</span> for your industry.
          Try a demo of any, uncheck the ones you don't want, then click Continue to add them to your contract.
        </p>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="h-4 w-4" /> Approved — added to your contract. Taking you to your designs…
          </div>
        )}

        {recommendedIds.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/30 bg-lime-400/5 px-3 py-2 text-xs text-lime-300">
            <Sparkles className="h-3.5 w-3.5" /> Recommended for your industry — pre-selected for you.
          </div>
        )}

        {/* Catalog grouped by tier */}
        <div className="mt-5 space-y-6">
          {ENHANCEMENT_TIERS.map((tier) => {
            const items = byTier(tier.id);
            if (items.length === 0) return null;
            return (
              <section key={tier.id}>
                <div className="mb-2.5 flex items-baseline gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-lime-400">{tier.label}</h2>
                  <span className="text-[11px] text-white/40">{tier.blurb}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {items.map((e) => {
                    const on = selected.includes(e.id);
                    const isRecommended = recommendedIds.includes(e.id);
                    const Icon = e.icon;
                    return (
                      <div
                        key={e.id}
                        className={`flex flex-col rounded-xl border-2 p-4 transition-all ${
                          on ? "border-lime-400 bg-lime-400/5" : "border-white/10 bg-zinc-950 hover:border-white/25"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggle(e.id)}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                              on ? "border-lime-400 bg-lime-400 text-black" : "border-white/25 text-white/40"
                            }`}
                          >
                            {on ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </button>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                            <Icon className={`h-5 w-5 ${on ? "text-lime-400" : "text-white/50"}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-white">{e.name}</h3>
                              {isRecommended && <span className="rounded-full bg-lime-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-lime-300">Rec</span>}
                            </div>
                            <p className="mt-0.5 text-xs text-white/50">{e.description}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-sm font-bold text-lime-400">{e.price === 0 ? "Free" : `+$${e.price}`}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDemo(e)}
                          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-[11px] font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300"
                        >
                          <Eye className="h-3.5 w-3.5" /> Try Demo
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-lime-400/40 bg-zinc-950 p-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
              {selected.length === 0 ? "No enhancements selected" : `${selected.length} enhancement${selected.length > 1 ? "s" : ""} selected`}
            </div>
            <div className="mt-0.5 text-xs text-white/40">Added to your contract total</div>
          </div>
          <div className="text-3xl font-bold text-lime-400">
            {total > 0 ? `+$${total}` : <span className="text-white/30">$0</span>}
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Approve → adds total to contract, then continue to Your Designs */}
        <button
          type="button"
          onClick={approve}
          disabled={saving}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : (
            <>Continue to Your Designs <ArrowRight className="h-4 w-4" /></>
          )}
        </button>

        {/* Charge card on file for the enhancement balance (after approval) */}
        {total > 0 && saved && (
          <button
            type="button"
            onClick={chargeCard}
            disabled={paying}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-lime-400/40 bg-lime-400/10 px-4 py-3 text-sm font-semibold text-lime-300 transition-colors hover:bg-lime-400/20 disabled:opacity-50"
          >
            {paying ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Starting checkout…</>
            ) : (
              <><CreditCard className="h-4 w-4" /> Charge Card on File — ${total}</>
            )}
          </button>
        )}
      </div>

      {demo && (
        <EnhancementDemoModal
          enhancement={demo}
          user={user}
          selected={selected.includes(demo.id)}
          onToggle={() => toggle(demo.id)}
          onClose={() => setDemo(null)}
        />
      )}
    </div>
  );
}