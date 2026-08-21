import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Shirt, Loader2, Check, RefreshCw, ArrowRight, AlertCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { logReceipt } from "@/lib/pipelineUtils";
import { BRAND_TYPES } from "@/lib/designPrompts";
import BrandPackPreview from "@/components/client/BrandPackPreview";

// Step: Brand Generator. Uses the client's chosen logo to generate 10 brand
// mockups (business card, brochure, t-shirt, hat, app, vehicle wrap, …). The
// client picks exactly 1 favorite. Each mockup can be expanded into a full
// preview with a light/dark color toggle.
const MAX = 1;

export default function BrandGenerator() {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [packs, setPacks] = useState([]);
  const [selected, setSelected] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    document.title = "Brand Generator · Lead Gen Near You";
    base44
      .auth.me()
      .then((u) => {
        setLogoUrl(u?.chosenLogoUrl || "");
        setBusinessName(u?.epoxyProfile?.businessName || "");
        if (u?.brandPacks?.length) setPacks(u.brandPacks);
        if (u?.chosenBrandImages) setSelected(u.chosenBrandImages);
        if (u?.brandPacksChosen) setSaved(true);
      })
      .catch(() => {});
  }, []);

  const generate = async () => {
    if (!logoUrl) {
      setError("Pick a logo in the Logo step first.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const results = await Promise.allSettled(
        BRAND_TYPES.map(async (b) => {
          const res = await base44.integrations.Core.GenerateImage({
            prompt: b.prompt(businessName || "your epoxy business"),
            existing_image_urls: [logoUrl],
          });
          return { id: b.id, label: b.label, url: res.url };
        })
      );
      const ok = results.map((r) => r.value).filter(Boolean);
      if (ok.length === 0) throw new Error("generation failed");
      setPacks(ok);
      await base44.auth.updateMe({ brandPacks: ok });
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

  const toggle = (url) => {
    setError("");
    setSelected((prev) => (prev.includes(url) ? [] : [url]));
  };

  const save = async () => {
    if (selected.length === 0) {
      setError("Pick one brand mockup.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await base44.auth.updateMe({ chosenBrandImages: selected, brandPacksChosen: true });
      try {
        await logReceipt({ action: "Brand mockups chosen", entityType: "User", entityId: "self", status: "success", notes: `${selected.length} mockup(s) selected` });
      } catch {}
      setSaved(true);
      try { localStorage.setItem("coach:done:/brand-generator", "1"); } catch {}
      setTimeout(() => navigate("/design-direction"), 800);
    } catch (e) {
      setError("Couldn't save your selection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <Shirt className="h-4 w-4" /> Brand Generator
          </div>
          <span className="ml-auto rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/60">
            {selected.length} of {MAX} selected
          </span>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">See your brand come to life</h1>
        <p className="mt-1 text-sm text-white/60">
          We applied your logo to 10 real-world mockups — business cards, brochures, apparel, an app, a van wrap and more.
          Tap the one you love. Use <Eye className="inline h-3 w-3" /> Preview to zoom in and toggle colors.
        </p>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="h-4 w-4" /> Brand saved — taking you to your website design…
          </div>
        )}

        {generating && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-950 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="mt-3 text-sm text-white/60">Applying your logo to 10 mockups…</p>
            <p className="text-xs text-white/40">This takes about 30 seconds.</p>
          </div>
        )}

        {!generating && packs.length > 0 && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {packs.map((p) => {
                const on = selected.includes(p.url);
                const disabled = !on && selected.length >= MAX;
                return (
                  <div
                    key={p.url}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border-2 bg-zinc-950 transition-all",
                      on ? "border-lime-400 ring-2 ring-lime-400/40" : "border-white/10 hover:border-white/25",
                      disabled && "opacity-40"
                    )}
                  >
                    <button type="button" onClick={() => toggle(p.url)} className="block w-full text-left">
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                        <Image src={p.url} alt={p.label} fittingType="fit" className="h-full w-full" />
                        {on && (
                          <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-lime-400 text-black">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 p-2.5">
                      <button type="button" onClick={() => toggle(p.url)} className="min-w-0 flex-1 text-left">
                        <div className="truncate text-xs font-semibold text-white">{p.label}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreview(p)}
                        className="flex shrink-0 items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[10px] font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300"
                      >
                        <Eye className="h-3 w-3" /> Preview
                      </button>
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
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate mockups
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
          <button
            type="button"
            onClick={save}
            disabled={saving || selected.length === 0}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : saved ? <><Check className="h-4 w-4" /> Update selection</> : <>Save my brand <ArrowRight className="h-4 w-4" /></>}
          </button>
        )}
      </div>

      {preview && (
        <BrandPackPreview
          pack={preview}
          selected={selected.includes(preview.url)}
          onSelect={() => toggle(preview.url)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}