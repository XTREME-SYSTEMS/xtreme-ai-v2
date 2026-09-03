import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Boxes, Loader2, RefreshCw, AlertCircle, Check, Package, Wrench, Image, Video, Palette, Eye, Palette as ColorIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "product", label: "Products", icon: Package },
  { key: "equipment", label: "Equipment", icon: Wrench },
  { key: "color_chart", label: "Color Charts", icon: ColorIcon },
  { key: "marketing_image", label: "Marketing Images", icon: Image },
  { key: "marketing_video", label: "Videos", icon: Video },
  { key: "social_post", label: "Social Posts", icon: Eye },
  { key: "training_video", label: "Training", icon: Palette },
  { key: "logo", label: "Logos", icon: Palette },
];

const PAGE_SIZE = 60;

export default function XpsCatalog() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("product");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => { document.title = "XPS Asset Catalog · Xtreme AI"; }, []);
  useEffect(() => { loadAssets(); }, []);

  const loadAssets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.entities.XpsAsset.list("-created_date", 500);
      setAssets(res || []);
    } catch (e) {
      setError("Couldn't load assets. Run ingestion first.");
    } finally {
      setLoading(false);
    }
  };

  const ingest = async () => {
    setIngesting(true);
    setError("");
    setIngestResult(null);
    try {
      const res = await base44.functions.invoke("ingestXpsCatalog", { refresh: true });
      setIngestResult(res?.data);
      await loadAssets();
    } catch (e) {
      setError("Ingestion failed. Check the function logs.");
    } finally {
      setIngesting(false);
    }
  };

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeCategory]);

  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c.key] = assets.filter(a => a.category === c.key).length;
    return acc;
  }, {});

  const filtered = activeCategory === "all" ? assets : assets.filter(a => a.category === activeCategory);
  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Boxes className="h-4 w-4" /> XPS Asset Catalog
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Real XPS Products, Equipment, Color Charts & Marketing</h1>
        <p className="mt-1 text-sm text-white/60">
          Scraped directly from xtremepolishingsystems.com (Shopify API), polishedconcreteuniversity.com, and XPS
          social media. The auto builder injects these real assets into every flooring-industry build.
        </p>

        {/* Ingestion controls */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={ingest}
            disabled={ingesting}
            className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
          >
            {ingesting ? <><Loader2 className="h-4 w-4 animate-spin" /> Ingesting from XPS…</> : <><RefreshCw className="h-4 w-4" /> Ingest Full Catalog</>}
          </button>
          <button
            onClick={loadAssets}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
          </button>
          <span className="text-xs text-white/40">{assets.length} total assets</span>
        </div>

        {ingestResult && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <span className="font-semibold">Ingestion complete!</span> {ingestResult.totalIngested} assets stored.
              <div className="mt-1 text-xs text-lime-300/70">
                {ingestResult.breakdown?.products || 0} products · {ingestResult.breakdown?.equipment || 0} equipment · {ingestResult.breakdown?.colorCharts || 0} color charts · {ingestResult.breakdown?.socialPosts || 0} social posts · {ingestResult.breakdown?.marketingVideos || 0} videos · {ingestResult.breakdown?.trainingVideos || 0} training
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Category counts */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = activeCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                  active ? "border-lime-400 bg-lime-400/10" : "border-white/10 hover:border-white/25"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-lime-400" : "text-white/50")} />
                <span className={cn("text-xs font-semibold", active ? "text-lime-300" : "text-white/70")}>{c.label}</span>
                <span className="text-lg font-bold text-white">{counts[c.key] || 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Asset grid */}
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950 py-16 text-center">
            <Boxes className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-3 text-sm text-white/50">No {activeCategory.replace("_", " ")} assets yet. Run ingestion to populate.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visible.map((asset) => (
                <div key={asset.id} className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
                  {asset.image_url ? (
                    <div className="aspect-square w-full overflow-hidden" style={{ backgroundColor: asset.specifications?.hex || "#1a1a1a" }}>
                      <img
                        src={asset.image_url}
                        alt={asset.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ) : asset.video_url ? (
                    <a href={asset.video_url} target="_blank" rel="noopener noreferrer" className="flex aspect-square items-center justify-center bg-zinc-900 hover:bg-zinc-800 transition-colors">
                      <Video className="h-8 w-8 text-lime-400/50" />
                    </a>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-zinc-900">
                      <Package className="h-8 w-8 text-white/20" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <div className="truncate text-xs font-semibold text-white">{asset.name}</div>
                    {asset.sku && <div className="text-[10px] text-white/40">SKU: {asset.sku}</div>}
                    {asset.price && <div className="text-[10px] font-bold text-lime-400">{asset.price}</div>}
                    {asset.brand && <div className="mt-0.5 text-[10px] text-white/50">{asset.brand}</div>}
                    {asset.specifications?.hex && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded border border-white/20" style={{ backgroundColor: asset.specifications.hex }} />
                        <span className="text-[10px] text-white/40">{asset.specifications.hex}</span>
                      </div>
                    )}
                    {asset.video_url && (
                      <a href={asset.video_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] text-lime-400 hover:underline">
                        <Video className="h-3 w-3" /> Watch
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {visibleCount < filtered.length && (
              <button
                onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
                className="mt-4 w-full rounded-lg border border-white/10 py-2.5 text-xs font-medium text-white/60 transition-colors hover:border-lime-400 hover:text-lime-400"
              >
                Show more ({filtered.length - visibleCount} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}