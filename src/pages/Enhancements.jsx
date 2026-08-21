import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, Check, Loader2, ArrowRight, Zap, FileText, MapPin, Star, Phone, Calendar, Plus, Minus,
} from "lucide-react";
import BackButton from "@/components/client/BackButton";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { logReceipt } from "@/lib/pipelineUtils";
import { getEnhancementsForIndustry, getRecommendedEnhancementIds } from "@/lib/dynamicEnhancements";

// Step: Enhancements — upsell page shown after Your Designs and before Sign
// Agreement. The enhancement catalog is now DYNAMIC — it adapts to the
// client's industry with industry-specific recommendations surfaced first.

export default function Enhancements() {
  const navigate = useNavigate();
  const { user } = useClientUser();
  const { update } = useClientUpdate();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // D8 — Dynamic industry-aware enhancements
  const industry = user?.epoxyProfile?.industry || "";
  const ENHANCEMENTS = getEnhancementsForIndustry(industry);
  const recommendedIds = getRecommendedEnhancementIds(industry);

  useEffect(() => {
    document.title = "Enhancements · Lead Gen Near You";
  }, []);

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

  const save = async () => {
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
          action: "Enhancements selected",
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
      setTimeout(() => navigate("/signatures"), 800);
    } catch (e) {
      setError("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <BackButton to="/your-designs" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Sparkles className="h-4 w-4" /> Enhancements
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Supercharge your package</h1>
        <p className="mt-1 text-sm text-white/60">
          These optional add-ons can accelerate your launch and boost your lead flow. Pick any that
          interest you — we'll add them to your invoice. Skip if you're happy with your current package.
        </p>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="h-4 w-4" /> Saved — taking you to sign your agreement…
          </div>
        )}

        {recommendedIds.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/30 bg-lime-400/5 px-3 py-2 text-xs text-lime-300">
            <Sparkles className="h-3.5 w-3.5" /> Recommended for your industry — pre-selected for you.
          </div>
        )}

        <div className="mt-5 space-y-3">
          {ENHANCEMENTS.map((e) => {
            const on = selected.includes(e.id);
            const isRecommended = recommendedIds.includes(e.id);
            const Icon = e.icon;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => toggle(e.id)}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  on ? "border-lime-400 bg-lime-400/5" : "border-white/10 bg-zinc-950 hover:border-white/25"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${on ? "bg-lime-400/15" : "bg-white/5"}`}>
                  <Icon className={`h-5 w-5 ${on ? "text-lime-400" : "text-white/50"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{e.name}</h3>
                    {isRecommended && <span className="rounded-full bg-lime-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-lime-300">Recommended</span>}
                    {on && <Check className="h-4 w-4 text-lime-400" />}
                  </div>
                  <p className="mt-0.5 text-xs text-white/50">{e.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold text-lime-400">+${e.price}</div>
                  <div className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ml-auto ${on ? "border-lime-400 bg-lime-400 text-black" : "border-white/20 text-white/40"}`}>
                    {on ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
              {selected.length === 0 ? "No enhancements selected" : `${selected.length} enhancement${selected.length > 1 ? "s" : ""} selected`}
            </div>
            <div className="mt-0.5 text-xs text-white/40">Added to your package invoice</div>
          </div>
          <div className="text-2xl font-bold text-lime-400">
            {total > 0 ? `+$${total}` : <span className="text-white/30">$0</span>}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check className="h-4 w-4" /> Saved</>
          ) : (
            <>Continue to Sign Agreement <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}