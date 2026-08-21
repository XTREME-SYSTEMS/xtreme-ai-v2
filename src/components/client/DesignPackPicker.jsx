import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Check, Loader2, Sparkles, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { logReceipt } from "@/lib/pipelineUtils";
import DesignPackPreview from "@/components/client/DesignPackPreview";

// 10 curated epoxy-contractor logo & web design packs, each a distinct color
// palette + style. Generated with the platform's best image model. The client
// picks up to 3; the selection is saved as a "design DNA" profile that tells
// the build team exactly what the client's eye gravitates toward.
export const DESIGN_PACKS = [
  { id: "industrial", name: "Bold Industrial", colors: ["#1a1a1a", "#ff6b1a", "#9a9a9a"], styles: ["bold", "industrial", "geometric"], img: "https://media.base44.com/images/public/6a79444e821211169a147eee/5d8787bc7_generated_image.png" },
  { id: "minimal", name: "Clean Minimal", colors: ["#ffffff", "#e5e5e5", "#c4f042"], styles: ["minimal", "clean", "airy"], img: "https://media.base44.com/images/public/6a79444e821211169a147eee/5fb2f3215_generated_image.png" },
  { id: "premium", name: "Premium Dark", colors: ["#0d0d0d", "#c9a227", "#1a1a1a"], styles: ["premium", "elegant", "luxury"], img: "https://media.base44.com/images/public/6a79444e821211169a147eee/01a033fa1_generated_image.png" },
  { id: "neon", name: "Energetic Neon", colors: ["#0a0a0a", "#d4ff4d", "#22d3ee"], styles: ["energetic", "modern", "techy"], img: "https://media.base44.com/images/public/6a79444e821211169a147eee/21045085b_generated_image.png" },
  { id: "earthy", name: "Earthy Natural", colors: ["#b8a89a", "#c2674a", "#f3ece3"], styles: ["earthy", "warm", "natural"], img: "https://media.base44.com/images/public/6a79444e821211169a147eee/17aa989f9_generated_image.png" },
  { id: "corporate", name: "Corporate Blue", colors: ["#1e3a5f", "#4a7ba6", "#ffffff"], styles: ["corporate", "trustworthy", "professional"], img: "https://media.base44.com/images/public/6a79444e821211169a147eee/943a843cb_generated_image.png" },
  { id: "rustic", name: "Rustic Workshop", colors: ["#6b4f3a", "#b87333", "#f5efe6"], styles: ["rustic", "vintage", "handcrafted"], img: "https://media.base44.com/images/public/6a79444e821211169a147eee/79d224b93_generated_image.png" },
  { id: "mono", name: "Modern Monochrome", colors: ["#000000", "#ffffff", "#9a9a9a"], styles: ["monochrome", "architectural", "minimal"], img: "https://media.base44.com/images/public/6a79444e821211169a147eee/61a57174c_generated_image.png" },
  { id: "gradient", name: "Vibrant Gradient", colors: ["#7c3aed", "#2563eb", "#ffffff"], styles: ["vibrant", "contemporary", "fluid"], img: "https://media.base44.com/images/public/6a79444e821211169a147eee/12633533e_generated_image.png" },
  { id: "heritage", name: "Heritage Craft", colors: ["#1f4d3a", "#b08d57", "#f5f1e8"], styles: ["heritage", "classic", "artisanal"], img: "https://media.base44.com/images/public/6a79444e821211169a147eee/dcbb6f260_generated_image.png" },
];

const MAX = 3;

export default function DesignPackPicker() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    base44
      .auth.me()
      .then((u) => {
        if (u?.designPacks) setSelected(u.designPacks);
        if (u?.designPacksChosen) setSaved(true);
        setProfile(u?.epoxyProfile || null);
      })
      .catch(() => {});
  }, []);

  const toggle = (id) => {
    setError("");
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX) return prev;
      return [...prev, id];
    });
  };

  const save = async () => {
    if (selected.length === 0) {
      setError("Pick at least one design pack.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const chosen = DESIGN_PACKS.filter((p) => selected.includes(p.id));
      const palettes = Array.from(new Set(chosen.flatMap((p) => p.colors)));
      const styles = Array.from(new Set(chosen.flatMap((p) => p.styles)));
      const designDNA = {
        selectedIds: selected,
        selectedNames: chosen.map((p) => p.name),
        palettes,
        styles,
        summary: `Client gravitates toward ${styles.slice(0, 4).join(", ")} design with ${palettes.slice(0, 6).join(", ")} tones. Preferred packs: ${chosen.map((p) => p.name).join(", ")}.`,
        chosenAt: new Date().toISOString(),
      };
      await base44.auth.updateMe({ designPacks: selected, designDNA, designPacksChosen: true });
      try {
        await logReceipt({
          action: "Design direction chosen",
          entityType: "User",
          entityId: "self",
          status: "success",
          notes: designDNA.summary,
        });
      } catch {
        /* best effort */
      }
      setSaved(true);
      try { localStorage.setItem("coach:done:/design-direction", "1"); } catch {}
      setTimeout(() => navigate("/your-designs"), 1000);
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
            <Sparkles className="h-4 w-4" /> Design Direction
          </div>
          <span className="ml-auto rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/60">
            {selected.length} of {MAX} selected
          </span>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Pick the looks you love</h1>
        <p className="mt-1 text-sm text-white/60">
          These are 10 logo &amp; web design packs in different colors and styles. Tap up to {MAX} that feel
          right for your epoxy business — your choices tell our team exactly what you like.
        </p>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="h-4 w-4" /> Design direction saved — taking you to the next step…
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {DESIGN_PACKS.map((p) => {
            const on = selected.includes(p.id);
            const disabled = !on && selected.length >= MAX;
            return (
              <div
                key={p.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border-2 bg-zinc-950 text-left transition-all",
                  on ? "border-lime-400 ring-2 ring-lime-400/40" : "border-white/10 hover:border-white/25",
                  disabled && "opacity-40"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image src={p.img} alt={p.name} fittingType="fill" className="h-full w-full" />
                    {on && (
                      <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-lime-400 text-black">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-2 p-2.5">
                  <button type="button" onClick={() => toggle(p.id)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-xs font-semibold text-white">{p.name}</div>
                    <div className="mt-1.5 flex items-center gap-1">
                      {p.colors.map((c) => (
                        <span
                          key={c}
                          className="h-3 w-3 rounded-full border border-white/20"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
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

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving || selected.length === 0}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" /> Update selection
            </>
          ) : (
            "Save my design direction"
          )}
        </button>
      </div>

      {preview && (
        <DesignPackPreview
          pack={preview}
          profile={profile}
          selected={selected.includes(preview.id)}
          onSelect={() => toggle(preview.id)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}