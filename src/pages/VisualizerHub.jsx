import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { Boxes, Loader2, Eye } from "lucide-react";

const INDUSTRY_ADAPTERS = [
  { industry: "Flooring / Epoxy", adapter: "Flooring Visualizer", status: "scaffolded", conversion_event: "Quote Request", description: "Surface area + condition → before/after render + instant estimate" },
  { industry: "Painting", adapter: "Paint Color Visualizer", status: "planned", conversion_event: "Quote Request", description: "Room photo + color palette → rendered preview + painter estimate" },
  { industry: "Landscaping", adapter: "Landscape Visualizer", status: "planned", conversion_event: "Consultation Booking", description: "Yayd photo + design style → rendered landscape + project estimate" },
  { industry: "Roofing", adapter: "Roof Visualizer", status: "planned", conversion_event: "Inspection Booking", description: "Aerial/satellite + material → roof render + replacement estimate" },
  { industry: "Cabinetry", adapter: "Cabinet Configurator", status: "planned", conversion_event: "Design Consultation", description: "Room dimensions + door style/finish → 3D render + quote" },
  { industry: "Countertops", adapter: "Countertop Visualizer", status: "planned", conversion_event: "Quote Request", description: "Layout + material/slab → render + fabrication estimate" },
  { industry: "Remodeling", adapter: "Remodel Visualizer", status: "planned", conversion_event: "Consultation Booking", description: "Before photo + scope → after render + project estimate" },
  { industry: "Pools", adapter: "Pool Visualizer", status: "planned", conversion_event: "Site Visit Booking", description: "Yard photo + pool style → rendered pool + build estimate" },
  { industry: "Signage", adapter: "Signage Mockup", status: "planned", conversion_event: "Quote Request", description: "Storefront photo + sign type → rendered mockup + quote" },
];

export default function VisualizerHub() {
  const [generators, setGenerators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.GeneratorRegistry.filter({ category: "Interactive" }, "-quality_score", 50)
      .then(setGenerators)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Visualizer Hub" subtitle="Route visual transformation needs to the canonical visualizer or industry adapter — every output connects to a conversion event" />

      <div className="mb-6 rounded-xl border border-lime-400/20 bg-lime-400/5 p-4">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Eye className="h-4 w-4 text-lime-400" />
          <span>A visualizer output must connect to a useful conversion event (quote, booking, consultation). No standalone eye-candy.</span>
        </div>
      </div>

      <Panel title="Industry Visualizer Adapters" className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRY_ADAPTERS.map((a) => (
            <div key={a.adapter} className="rounded-lg border border-white/10 bg-zinc-950 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{a.industry}</span>
                <StatusBadge status={a.status === "scaffolded" ? "active" : "draft"} />
              </div>
              <div className="mt-1 text-xs font-mono text-lime-400">{a.adapter}</div>
              <p className="mt-2 text-xs text-white/50">{a.description}</p>
              <div className="mt-2 text-xs text-white/40">→ <span className="text-lime-400">{a.conversion_event}</span></div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Interactive Generators (from Registry)">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : generators.length === 0 ? (
          <EmptyState icon={Boxes} title="No interactive generators" subtitle="Generator Registry interactive category is empty." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-950 text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-3 py-2 font-medium">Generator</th>
                  <th className="px-3 py-2 font-medium">Quality</th>
                  <th className="px-3 py-2 font-medium">Origin</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {generators.map((g) => (
                  <tr key={g.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2 text-white">{g.name}</td>
                    <td className="px-3 py-2 font-mono text-lime-400">{Math.round(g.quality_score || 0)}</td>
                    <td className="px-3 py-2 text-white/60">{g.origin}</td>
                    <td className="px-3 py-2"><StatusBadge status={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}