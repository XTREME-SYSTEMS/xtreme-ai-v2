import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Info, Package, Search, Sparkles, CheckCircle2 } from "lucide-react";
import { getLineItemDetail } from "@/lib/lineItemDetails";
import { getLineItemDetailAsync } from "@/lib/serviceCatalogApi";

// Expandable line-item list for the My Package page. Each top-level line item
// is a clickable row that expands to reveal a full description, what-you-get
// list, how-it-works, SEO value, and AEO value — plus any sub-items.
export default function ExpandableLineItems({ features, productId }) {
  const [expanded, setExpanded] = useState({});
  const [detailMap, setDetailMap] = useState({});

  // Parse the flat features array into groups: each top-level item collects
  // its indented sub-items (lines prefixed with "  ·").
  const groups = [];
  let current = null;
  features.forEach((f) => {
    if (f.startsWith("  ·")) {
      if (current) current.subs.push(f.replace(/^  ·\s*/, ""));
    } else {
      current = { text: f, subs: [] };
      groups.push(current);
    }
  });

  // Fetch enriched details from the backend catalog (async, falls back to local)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map = {};
      await Promise.all(
        groups.map(async (g) => {
          const detail = await getLineItemDetailAsync(g.text, productId);
          if (detail) map[g.text] = detail;
        })
      );
      if (!cancelled) setDetailMap(map);
    })();
    return () => { cancelled = true; };
  }, [productId, features.join("|")]);

  const toggle = (idx) =>
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
        <span className="h-1 w-4 rounded-full bg-lime-400" /> Line items included
        <span className="font-normal normal-case tracking-normal text-white/40">— click any item for full details</span>
      </h4>
      <div className="mt-3 space-y-1">
        {groups.map((g, idx) => {
          const isOpen = !!expanded[idx];
          const detail = (detailMap[g.text]?.description ? detailMap[g.text] : null) || getLineItemDetail(g.text);
          return (
            <div key={idx} className="overflow-hidden rounded-lg border border-white/5 transition-colors hover:border-lime-400/30">
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="flex w-full items-start gap-2.5 p-2.5 text-left transition-colors hover:bg-white/5"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10 text-[10px] font-bold text-lime-400">
                  {idx + 1}
                </span>
                <span className="flex-1 pt-0.5 text-sm text-white/80">{g.text}</span>
                {isOpen ? (
                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
                ) : (
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                )}
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-white/5 bg-black/30 px-2.5 py-3 pl-10">
                  {/* Full description */}
                  {detail?.description && (
                    <div className="flex items-start gap-2 rounded-lg border border-lime-400/20 bg-lime-400/5 p-2.5">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" />
                      <p className="text-xs leading-relaxed text-white/70">{detail.description}</p>
                    </div>
                  )}

                  {/* What you get */}
                  {detail?.whatYouGet && detail.whatYouGet.length > 0 && (
                    <div>
                      <h5 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-lime-400">
                        <Package className="h-3 w-3" /> What You Get
                      </h5>
                      <ul className="space-y-1">
                        {detail.whatYouGet.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-lime-400/60" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* How it works */}
                  {detail?.howItWorks && (
                    <div>
                      <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-lime-400">How It Works</h5>
                      <p className="text-xs leading-relaxed text-white/50">{detail.howItWorks}</p>
                    </div>
                  )}

                  {/* SEO & AEO value */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {detail?.seoValue && (
                      <div className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                        <h5 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                          <Search className="h-3 w-3" /> SEO Value
                        </h5>
                        <p className="text-xs leading-relaxed text-white/50">{detail.seoValue}</p>
                      </div>
                    )}
                    {detail?.aeoValue && (
                      <div className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                        <h5 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fuchsia-400">
                          <Sparkles className="h-3 w-3" /> AEO Value
                        </h5>
                        <p className="text-xs leading-relaxed text-white/50">{detail.aeoValue}</p>
                      </div>
                    )}
                  </div>

                  {/* Sub-items (if any) */}
                  {g.subs.length > 0 && (
                    <div>
                      <h5 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">Includes</h5>
                      <ul className="space-y-1.5">
                        {g.subs.map((sub, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lime-400/50" />
                            <span>{sub}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}