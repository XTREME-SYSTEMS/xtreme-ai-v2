import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { PenTool, Loader2, Check, RefreshCw, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { logReceipt } from "@/lib/pipelineUtils";
import { LOGO_STYLES, ACCENT_COLORS } from "@/lib/designPrompts";
import BackButton from "@/components/client/BackButton";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { notifyStepComplete } from "@/lib/pipelineNotify";

// Second-pass prompt that strips the background off a generated logo so it
// renders cleanly on both light and dark website themes (no visible box).
// Uses the image-edit mode of GenerateImage (existing_image_urls) to isolate
// the logo onto a true transparent / alpha-channel PNG.
const REMOVE_BG_PROMPT =
  "This image is a logo on a solid background. Remove the ENTIRE background completely so only the logo artwork itself remains. " +
  "Output the logo on a fully transparent background as a PNG with a true alpha channel. " +
  "Preserve the logo's exact colors, shapes, lines, and any text exactly as they are. " +
  "Do NOT add any border, card, shadow, backdrop, frame, or white/colored box. " +
  "The result must be an isolated logo with transparency everywhere except the logo itself.";

// Two-step logo generation: (1) generate the logo concept, (2) run a
// background-removal edit pass so the final PNG has a transparent background.
// Returns the transparent logo URL, falling back to the original if the
// remove-background step fails.
async function generateTransparentLogo(prompt) {
  const r1 = await base44.integrations.Core.GenerateImage({ prompt });
  let url = r1?.url;
  if (!url) throw new Error("generation failed");
  try {
    const r2 = await base44.integrations.Core.GenerateImage({
      prompt: REMOVE_BG_PROMPT,
      existing_image_urls: [url],
    });
    if (r2?.url) url = r2.url;
  } catch {
    // Keep the original if the background-removal edit pass fails.
  }
  return url;
}

// Step: Logo Generator. Generates 10 distinct logos for the client's epoxy
// business (from their Business Profile name), lets them pick one, and saves
// the choice to their user record. Generated logos are cached on the user so
// they don't regenerate (and burn credits) on every visit.
export default function LogoGenerator() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [packs, setPacks] = useState([]); // [{url, label, id}]
  const [chosen, setChosen] = useState(""); // url
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [regeneratingId, setRegeneratingId] = useState(null);
  const { user } = useClientUser();
  const { update } = useClientUpdate();

  useEffect(() => {
    document.title = "Logo Generator · Lead Gen Near You";
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfile(user?.epoxyProfile || null);
    if (user?.logoPacks?.length) setPacks(user.logoPacks);
    if (user?.chosenLogoUrl) setChosen(user.chosenLogoUrl);
    if (user?.logoPacksChosen) setSaved(true);
  }, [user]);

  const businessName = profile?.businessName?.trim() || "";
  const industry = profile?.industry || "";

  const generate = async () => {
    if (!businessName) {
      setError("Add your business name in the Business Profile step first.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const results = await Promise.allSettled(
        LOGO_STYLES.map(async (s) => {
          const url = await generateTransparentLogo(s.prompt(businessName, undefined, industry));
          return { id: s.id, label: s.label, url };
        })
      );
      const ok = results.map((r) => r.value).filter(Boolean);
      if (ok.length === 0) throw new Error("generation failed");
      setPacks(ok);
      await update({ logoPacks: ok });
    } catch (e) {
      setError("Logo generation hit a snag. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate a single logo with a new accent color.
  const regenerateWithColor = async (pack, accent) => {
    if (regeneratingId) return;
    setRegeneratingId(pack.id);
    setError("");
    try {
      const style = LOGO_STYLES.find((s) => s.id === pack.id);
      const url = await generateTransparentLogo(style.prompt(businessName, accent, industry));
      const next = packs.map((p) =>
        p.id === pack.id ? { ...p, url, accentColor: accent } : p
      );
      setPacks(next);
      try { await update({ logoPacks: next }); } catch {}
    } catch (e) {
      setError("Couldn't regenerate that logo. Try again.");
    } finally {
      setRegeneratingId(null);
    }
  };

  // Auto-generate on first visit if the client has no packs yet.
  useEffect(() => {
    if (businessName && packs.length === 0 && !generating && !error) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName]);

  // Auto-pick: pre-select and persist the first logo so the step is done.
  const autoPicked = useRef(false);
  useEffect(() => {
    if (packs.length > 0 && !chosen && !saved && !autoPicked.current) {
      autoPicked.current = true;
      const first = packs[0];
      setChosen(first.url);
      (async () => {
        try {
          await update({ chosenLogoUrl: first.url, logoPacksChosen: true });
          await notifyStepComplete("logo", { businessName: profile?.businessName || "" });
          try { localStorage.setItem("coach:done:/logo-generator", "1"); } catch {}
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packs, chosen, saved]);

  const save = async () => {
    if (!chosen) {
      setError("Pick one logo to continue.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await update({ chosenLogoUrl: chosen, logoPacksChosen: true });
      try {
        await logReceipt({ action: "Logo chosen", entityType: "User", entityId: "self", status: "success", notes: `Logo selected` });
      } catch {}
      await notifyStepComplete("logo", { businessName: profile?.businessName || "" });
      setSaved(true);
      try { localStorage.setItem("coach:done:/logo-generator", "1"); } catch {}
      setTimeout(() => navigate("/brand-generator"), 800);
    } catch (e) {
      setError("Couldn't save your choice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/content-generator" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <PenTool className="h-4 w-4" /> Logo Generator
          </div>
          <span className="ml-auto rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/60">
            {businessName || "Add a business name"}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Pick your logo</h1>
        <p className="mt-1 text-sm text-white/60">
          We generated 10 logo concepts for <span className="font-semibold text-white">{businessName || "your business"}</span> and
          <span className="text-lime-400 font-semibold"> auto-selected the first one</span>. Just click Continue, or tap a different logo if you prefer.
        </p>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="h-4 w-4" /> Logo saved — building your brand mockups…
          </div>
        )}

        {generating && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-950 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="mt-3 text-sm text-white/60">Generating 10 logo concepts…</p>
            <p className="text-xs text-white/40">This takes about 30 seconds.</p>
          </div>
        )}

        {!generating && packs.length > 0 && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {packs.map((p) => {
                const on = chosen === p.url;
                const regen = regeneratingId === p.id;
                return (
                  <div
                    key={p.url}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border-2 bg-zinc-950 text-left transition-all",
                      on ? "border-lime-400 ring-2 ring-lime-400/40" : "border-white/10 hover:border-white/25"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setChosen(p.url)}
                      className="block w-full text-left"
                    >
                      <div
                        className="relative aspect-square w-full overflow-hidden"
                        style={{
                          backgroundColor: "#f3f4f6",
                          backgroundImage:
                            "linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)",
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                        }}
                      >
                        <Image src={p.url} alt={p.label} fittingType="fit" className="h-full w-full" />
                        {on && (
                          <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-lime-400 text-black">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        {regen && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                            <Loader2 className="h-6 w-6 animate-spin text-lime-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 text-xs font-semibold text-white">{p.label}</div>
                    </button>
                    {/* Color swatches — click to regenerate with a new accent color */}
                    <div className="flex flex-wrap gap-1 border-t border-white/10 px-2 pb-2 pt-1.5">
                      {ACCENT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => regenerateWithColor(p, c.value)}
                          disabled={!!regeneratingId}
                          title={c.name}
                          className={cn(
                            "h-4 w-4 rounded-full border-2 transition-transform hover:scale-125 disabled:opacity-50",
                            p.accentColor === c.value ? "border-white" : "border-white/20"
                          )}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
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
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate concepts
            </button>
          </>
        )}

        {!generating && packs.length === 0 && !error && (
          <div className="mt-6 rounded-xl border border-white/10 bg-zinc-950 p-10 text-center">
            <PenTool className="mx-auto mb-3 h-10 w-10 text-white/30" />
            <p className="text-sm text-white/60">Logos will appear here automatically.</p>
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
            disabled={saving || !chosen}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Continue to Brand <ArrowRight className="h-4 w-4" /></>}
          </button>
        )}
      </div>
    </div>
  );
}