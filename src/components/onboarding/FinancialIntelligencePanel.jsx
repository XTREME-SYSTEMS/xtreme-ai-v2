import { DollarSign, TrendingUp, Target, Lightbulb, Shield, BarChart3, Loader2, Sparkles } from "lucide-react";

// Displays the financial intelligence report returned by the
// getFinancialIntelligence backend function. Shows competitor pricing,
// retail pricing tiers, pricing models, market insights, recommended
// pricing strategy, revenue opportunities, and competitive advantages.

export default function FinancialIntelligencePanel({ data, loading, onResearch, hasLocation }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 p-10">
        <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
        <div className="text-sm font-medium text-white">Researching your market…</div>
        <div className="text-xs text-white/40">Scanning competitor pricing, retail rates, and market data for your area.</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/10">
          <DollarSign className="h-6 w-6 text-lime-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Financial Intelligence</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs text-white/50">
          We'll research your local competitors, standard retail pricing, and market opportunities — then use that data to power smarter recommendations across your entire pipeline.
        </p>
        <button
          type="button"
          onClick={onResearch}
          disabled={!hasLocation}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" /> Research My Market
        </button>
        {!hasLocation && (
          <p className="mt-2 text-xs text-amber-400/80">Enter your address and ZIP in the previous step to enable this.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Competitor pricing */}
      {data.competitorPricing?.length > 0 && (
        <Card icon={BarChart3} title="Competitor Pricing in Your Area">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/40">
                  <th className="pb-2 pr-3 font-medium">Service</th>
                  <th className="pb-2 pr-3 font-medium">Low</th>
                  <th className="pb-2 pr-3 font-medium">Average</th>
                  <th className="pb-2 pr-3 font-medium">High</th>
                  <th className="pb-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.competitorPricing.map((c, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-3 font-medium text-white">{c.service}</td>
                    <td className="py-2 pr-3 text-white/60">{c.lowPrice}</td>
                    <td className="py-2 pr-3 text-lime-300">{c.averagePrice}</td>
                    <td className="py-2 pr-3 text-white/60">{c.highPrice}</td>
                    <td className="py-2 text-white/40">{c.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Retail pricing tiers */}
      {data.retailPricing?.length > 0 && (
        <Card icon={DollarSign} title="Retail Pricing Tiers">
          <div className="grid gap-2 sm:grid-cols-3">
            {data.retailPricing.map((r, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="text-xs font-medium text-white">{r.service}</div>
                <div className="mt-2 space-y-1">
                  <PriceRow label="Economy" value={r.economyPrice} />
                  <PriceRow label="Typical" value={r.typicalPrice} highlight />
                  <PriceRow label="Premium" value={r.premiumPrice} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pricing models */}
      {data.pricingModels?.length > 0 && (
        <Card icon={TrendingUp} title="Common Pricing Models">
          <div className="flex flex-wrap gap-2">
            {data.pricingModels.map((m, i) => (
              <span key={i} className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2.5 py-1 text-xs font-medium text-lime-300">{m}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Recommended pricing strategy */}
      {data.recommendedPricing && (
        <Card icon={Target} title="Recommended Pricing Strategy">
          <p className="text-sm leading-relaxed text-white/70">{data.recommendedPricing}</p>
        </Card>
      )}

      {/* Market insights */}
      {data.marketInsights?.length > 0 && (
        <Card icon={Lightbulb} title="Market Insights">
          <ul className="space-y-1.5">
            {data.marketInsights.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lime-400" /> {m}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Revenue opportunities */}
      {data.revenueOpportunities?.length > 0 && (
        <Card icon={TrendingUp} title="Revenue Opportunities">
          <ul className="space-y-1.5">
            {data.revenueOpportunities.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lime-400" /> {r}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Competitive advantages */}
      {data.competitiveAdvantages?.length > 0 && (
        <Card icon={Shield} title="Competitive Advantages to Highlight">
          <ul className="space-y-1.5">
            {data.competitiveAdvantages.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lime-400" /> {c}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Re-run button */}
      <button
        type="button"
        onClick={onResearch}
        className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300"
      >
        <Sparkles className="h-3.5 w-3.5" /> Re-run Research
      </button>
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-lime-400" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-lime-400">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function PriceRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40">{label}</span>
      <span className={highlight ? "font-semibold text-lime-300" : "text-white/60"}>{value}</span>
    </div>
  );
}