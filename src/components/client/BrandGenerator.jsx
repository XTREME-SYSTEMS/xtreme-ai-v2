import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Shirt, Loader2, Check, RefreshCw, ArrowRight, AlertCircle, Eye, MessageSquare, Send, X } from "lucide-react";
import { logReceipt } from "@/lib/pipelineUtils";
import { BRAND_TYPES } from "@/lib/designPrompts";
import BrandPackPreview from "@/components/client/BrandPackPreview";
import BackButton from "@/components/client/BackButton";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { useClientProject } from "@/hooks/useClientProject";
import { deriveFoundation } from "@/lib/pipelineFoundation";
import { notifyStepComplete } from "@/lib/pipelineNotify";

// Step: Brand Generator. Uses the client's chosen logo to generate 10 brand
// mockups (business card, brochure, t-shirt, hat, app, vehicle wrap, …).
// All 10 are auto-included in the package — the client just presses Approve.
// Each item has its own Regenerate button so they can remake just the ones
// they don't like without regenerating the whole set.
export default function BrandGenerator() {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [packs, setPacks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [revising, setRevising] = useState(false);
  const [reviseComment, setReviseComment] = useState("");
  const [sendingRevise, setSendingRevise] = useState(false);
  const [reviseSent, setReviseSent] = useState(false);
  const [reviseError, setReviseError] = useState("");
  const [industry, setIndustry] = useState("");
  const { user } = useClientUser();
  const { update } = useClientUpdate();
  const { project } = useClientProject(user);

  useEffect(() => {
    document.title = "Brand Generator · Lead Gen Near You";
  }, []);

  useEffect(() => {
    if (!user) return;
    setLogoUrl(user?.chosenLogoUrl || "");
    setBusinessName(user?.epoxyProfile?.businessName || "");
    setUserEmail(user?.email || "");
    setIndustry(user?.epoxyProfile?.industry || "");
    if (user?.brandPacks?.length) setPacks(user.brandPacks);
    if (user?.brandPacksChosen) setSaved(true);
  }, [user]);

  const generate = async () => {
    if (!logoUrl) {
      setError("Pick a logo in the Logo step first.");
      return;
    }
    setGenerating(true);
    setError("");
    const foundation = deriveFoundation(project, user);
    try {
      const results = await Promise.allSettled(
        BRAND_TYPES.map(async (b) => {
          const res = await base44.integrations.Core.GenerateImage({
            prompt: b.prompt(businessName || "your business", industry) + foundation.brandEssence,
            existing_image_urls: [logoUrl],
          });
          return { id: b.id, label: b.label, url: res.url };
        })
      );
      const ok = results.map((r) => r.value).filter(Boolean);
      if (ok.length === 0) throw new Error("generation failed");
      setPacks(ok);
      await update({ brandPacks: ok });
    } catch (e) {
      setError("Brand generation hit a snag. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (logoUrl && packs.length === 0 && !generating && !error) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl]);

  // Auto-pick: all mockups are included — pre-approve so the step is done.
  const autoPicked = useRef(false);
  useEffect(() => {
    if (packs.length > 0 && !saved && !autoPicked.current) {
      autoPicked.current = true;
      (async () => {
        try {
          await update({ chosenBrandImages: packs.map((p) => p.url), brandPacksChosen: true });
          await notifyStepComplete("brand", { businessName: businessName || "" });
          try { localStorage.setItem("coach:done:/brand-generator", "1"); } catch {}
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packs, saved]);

  // Remake a single mockup without touching the rest.
  const regenerateOne = async (pack) => {
    const b = BRAND_TYPES.find((x) => x.id === pack.id);
    if (!b || regeneratingId) return;
    setRegeneratingId(pack.id);
    setError("");
    try {
      const foundation = deriveFoundation(project, user);
      const res = await base44.integrations.Core.GenerateImage({
        prompt: b.prompt(businessName || "your business", industry) + foundation.brandEssence,
        existing_image_urls: [logoUrl],
      });
      const next = packs.map((p) => (p.id === pack.id ? { ...p, url: res.url } : p));
      setPacks(next);
      try { await update({ brandPacks: next }); } catch {}
    } catch (e) {
      setError("Couldn't regenerate that item. Try again.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const save = async () => {
    if (packs.length === 0) {
      setError("Wait for your brand mockups to finish generating.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await update({
        chosenBrandImages: packs.map((p) => p.url),
        brandPacksChosen: true,
      });
      try {
        await logReceipt({ action: "Brand mockups approved", entityType: "User", entityId: "self", status: "success", notes: `${packs.length} mockups approved` });
      } catch {}
      await notifyStepComplete("brand", { businessName: businessName || "" });
      setSaved(true);
      try { localStorage.setItem("coach:done:/brand-generator", "1"); } catch {}
      setTimeout(() => navigate("/design-direction"), 800);
    } catch (e) {
      setError("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Sends the client's brand revision note to the team: creates a pending
  // Approval (admin-visible) and emails every admin immediately.
  const requestRevision = async () => {
    if (!reviseComment.trim()) { setReviseError("Add a note for our team."); return; }
    setSendingRevise(true);
    setReviseError("");
    try {
      await base44.functions.invoke("submitRevisionRequest", {
        comment: reviseComment.trim(),
        pipelineStep: "brand",
        clientEmail: userEmail || "",
      });
      setReviseSent(true);
      setReviseComment("");
      setRevising(false);
    } catch (e) {
      setReviseError("Couldn't send. Please try again.");
    } finally {
      setSendingRevise(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/logo-generator" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <Shirt className="h-4 w-4" /> Brand Generator
          </div>
          <span className="ml-auto rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/60">
            {packs.length} items included
          </span>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Your brand, designed with your logo</h1>
        <p className="mt-1 text-sm text-white/60">
          We designed all {BRAND_TYPES.length} brand mockups with your logo — they're all included and
          <span className="text-lime-400 font-semibold"> auto-approved</span>. Just click Continue. Don't like one?
          Tap <RefreshCw className="inline h-3 w-3" /> Regenerate under any item to remake only that one.
        </p>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="h-4 w-4" /> Brand approved — taking you to your website design…
          </div>
        )}

        {generating && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-950 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="mt-3 text-sm text-white/60">Applying your logo to {BRAND_TYPES.length} mockups…</p>
            <p className="text-xs text-white/40">This takes about 30 seconds.</p>
          </div>
        )}

        {!generating && packs.length > 0 && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {packs.map((p) => {
                const regen = regeneratingId === p.id;
                return (
                  <div
                    key={p.id}
                    className="group relative overflow-hidden rounded-xl border-2 border-lime-400/40 bg-zinc-950 transition-all"
                  >
                    <button type="button" onClick={() => setPreview(p)} className="block w-full text-left">
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                        <Image src={p.url} alt={p.label} fittingType="fit" className="h-full w-full" />
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-lime-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
                          Included
                        </span>
                        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/80">
                          <Eye className="h-3.5 w-3.5" />
                        </span>
                        {regen && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                            <Loader2 className="h-6 w-6 animate-spin text-lime-400" />
                          </div>
                        )}
                      </div>
                    </button>
                    <div className="p-2.5">
                      <div className="truncate text-xs font-semibold text-white">{p.label}</div>
                      <button
                        type="button"
                        onClick={() => regenerateOne(p)}
                        disabled={!!regeneratingId}
                        className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-white/15 px-2 py-1.5 text-[10px] font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300 disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3 w-3 ${regen ? "animate-spin" : ""}`} /> Regenerate this item
                      </button>
                      <p className="mt-1 text-center text-[9px] text-white/40">Don't like it? Remake only this one.</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate all mockups
            </button>
          </>
        )}

        {!generating && packs.length === 0 && !error && (
          <div className="mt-6 rounded-xl border border-white/10 bg-zinc-950 p-10 text-center">
            <Shirt className="mx-auto mb-3 h-10 w-10 text-white/30" />
            <p className="text-sm text-white/60">Mockups will appear here automatically.</p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {packs.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
            {reviseSent ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
                <Check className="h-4 w-4" /> Your revision request was sent to our team — we'll be in touch shortly.
              </div>
            ) : revising ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-lime-400">What needs to change?</label>
                <textarea
                  value={reviseComment}
                  onChange={(e) => setReviseComment(e.target.value)}
                  rows={3}
                  placeholder="Tell our team what you'd like revised about your brand mockups…"
                  className="w-full resize-none rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
                />
                {reviseError && <p className="text-xs text-red-400">{reviseError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={requestRevision}
                    disabled={sendingRevise}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
                  >
                    {sendingRevise ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send to admin</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRevising(false); setReviseError(""); setReviseComment(""); }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/30"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <button
                    type="button"
                    onClick={() => setRevising(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Request Revision
                  </button>
                </div>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || packs.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Continue to Website Design <ArrowRight className="h-4 w-4" /></>}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {preview && (
        <BrandPackPreview
          pack={preview}
          selected={true}
          onSelect={() => {}}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}