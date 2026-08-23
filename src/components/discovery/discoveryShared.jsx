import { Radar, Lightbulb, Building2, Activity, Search, Zap, Star, TrendingUp,
  Globe, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, Loader2,
  Rocket, Filter, Clock, Target, ExternalLink } from "lucide-react";

export const SEARCH_TYPES = [
  { value: "problems", label: "Problems & Pain Points", icon: AlertTriangle },
  { value: "trends", label: "Trending Topics", icon: TrendingUp },
  { value: "social", label: "Social Media Requests", icon: Globe },
  { value: "gaps", label: "Market Gaps", icon: Target },
];

export const INDUSTRIES = [
  "general", "productivity", "fintech", "healthcare", "education", "ecommerce",
  "home services", "professional services", "real estate", "food & restaurant",
  "fitness", "travel", "saas", "ai/ml", "gaming", "marketing",
];

export const SCORE_DIMENSIONS = [
  { key: "profitability", label: "Profit", color: "text-lime-400", bg: "bg-lime-400" },
  { key: "scalability", label: "Scale", color: "text-blue-400", bg: "bg-blue-400" },
  { key: "niche_strength", label: "Niche", color: "text-purple-400", bg: "bg-purple-400" },
  { key: "usability", label: "Usable", color: "text-cyan-400", bg: "bg-cyan-400" },
  { key: "competition", label: "Low Comp", color: "text-amber-400", bg: "bg-amber-400" },
  { key: "trend_momentum", label: "Trend", color: "text-pink-400", bg: "bg-pink-400" },
  { key: "technical_feasibility", label: "Feasible", color: "text-emerald-400", bg: "bg-emerald-400" },
];

export function ScoreBars({ scores }) {
  if (!scores || !scores.overall) return null;
  return (
    <div className="mb-3 grid grid-cols-7 gap-1">
      {SCORE_DIMENSIONS.map((dim) => {
        const val = scores[dim.key] || 0;
        return (
          <div key={dim.key} className="text-center">
            <div className="relative h-8 w-full overflow-hidden rounded bg-white/5">
              <div
                className={`absolute bottom-0 left-0 right-0 ${dim.bg}`}
                style={{ height: `${val}%`, opacity: 0.6 }}
              />
            </div>
            <div className="mt-0.5 text-[8px] text-white/30">{dim.label}</div>
          </div>
        );
      })}
    </div>
  );
}