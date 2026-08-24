import { useNavigate } from "react-router-dom";
import {
  Zap, ArrowRight, Package, Compass, Building2, MessageSquareText,
  PenTool, Shirt, Palette, Share2, Video, Sparkles, LayoutTemplate,
  FileSignature, ShieldCheck, Rocket,
} from "lucide-react";
import { useXtreme } from "@/lib/XtremeContext";

const QUICK_START = [
  { to: "/my-package", label: "Start the Build Journey", desc: "Review your package and walk through every step.", icon: Package, accent: true },
  { to: "/business-name-studio", label: "Find a Business Name", desc: "AI scrapes Google + registries for viral names with available .com domains.", icon: Compass },
  { to: "/content-generator", label: "Generate Content", desc: "10 market-researched messaging tones for your website.", icon: MessageSquareText },
  { to: "/logo-generator", label: "Pick a Logo", desc: "10 transparent-background logo concepts.", icon: PenTool },
  { to: "/design-direction", label: "Website Design", desc: "10 layouts with your brand — desktop + mobile preview.", icon: Palette },
  { to: "/enhancements", label: "Browse AI Tools", desc: "Live demos of every add-on for the concrete industry.", icon: Sparkles },
];

export default function XtremeLanding() {
  const navigate = useNavigate();
  const { xp } = useXtreme();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Hero */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/10 to-transparent p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-400/15">
            <Zap className="h-6 w-6 text-lime-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Xtreme AI</h1>
            <p className="text-sm text-white/50">Client Portal — the autonomous branding & build platform for the concrete industry.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/60">
          This is the secluded staging portal — branded, refined, and hardened here before shipping as a standalone product. Walk through the full client journey, test every generator, and validate the experience end to end.
        </p>
        <button
          onClick={() => navigate(xp("/my-package"))}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
        >
          Start Build Journey <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Quick start grid */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">Quick Start</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_START.map((card) => (
            <button
              key={card.to}
              onClick={() => navigate(xp(card.to))}
              className={`rounded-xl border p-4 text-left transition-colors ${
                card.accent
                  ? "border-lime-400/40 bg-lime-400/5 hover:bg-lime-400/10"
                  : "border-white/10 bg-zinc-950 hover:border-lime-400/30"
              }`}
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400/10">
                <card.icon className="h-5 w-5 text-lime-400" />
              </div>
              <div className="text-sm font-semibold text-white">{card.label}</div>
              <div className="mt-1 text-xs text-white/50">{card.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Full journey map */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">Full Journey</h2>
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Package, label: "Welcome" },
              { icon: Compass, label: "Name" },
              { icon: Building2, label: "Profile" },
              { icon: MessageSquareText, label: "Content" },
              { icon: PenTool, label: "Logo" },
              { icon: Shirt, label: "Brand" },
              { icon: Palette, label: "Website" },
              { icon: Share2, label: "Social" },
              { icon: Video, label: "Video" },
              { icon: Sparkles, label: "Enhancements" },
              { icon: LayoutTemplate, label: "Designs" },
              { icon: FileSignature, label: "Sign" },
              { icon: ShieldCheck, label: "Approve" },
              { icon: Rocket, label: "Launch" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60">
                <step.icon className="h-3.5 w-3.5 text-lime-400/70" />
                {step.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}