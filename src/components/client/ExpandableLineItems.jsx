import { useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { getLineItemDetail } from "@/lib/lineItemDetails";

// Expandable line-item list for the My Package page. Each top-level line item
// is a clickable row that expands to reveal its sub-items (if any) plus a
// detailed description of what that item is and what the client gets.
export default function ExpandableLineItems({ features }) {
  const [expanded, setExpanded] = useState({});

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

  const toggle = (idx) =>
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
        <span className="h-1 w-4 rounded-full bg-lime-400" /> Line items included
        <span className="font-normal normal-case tracking-normal text-white/40">— click any item for details</span>
      </h4>
      <div className="mt-3 space-y-1">
        {groups.map((g, idx) => {
          const isOpen = !!expanded[idx];
          const detail = getLineItemDetail(g.text);
          return (
            <div key={idx} className="overflow-hidden rounded-lg border border-white/5">
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
                  {detail && (
                    <div className="flex items-start gap-2 rounded-lg border border-lime-400/20 bg-lime-400/5 p-2.5">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" />
                      <p className="text-xs leading-relaxed text-white/70">{detail}</p>
                    </div>
                  )}
                  {g.subs.length > 0 && (
                    <ul className="space-y-1.5">
                      {g.subs.map((sub, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lime-400/50" />
                          <span>{sub}</span>
                        </li>
                      ))}
                    </ul>
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