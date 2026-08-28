import {
  Building2, Globe, Palette, Megaphone, Video, Share2,
  Rocket, Eye, ClipboardList, Target, Compass,
  MessageSquareText, PenTool, Shirt, Monitor, LayoutTemplate, ShieldCheck,
} from "lucide-react";

// The new Xtreme AI Business Generator pipeline — the guided journey every
// client walks. Shown on the Welcome step to orient the user on what each
// phase produces, in the order they'll actually experience it. Vision +
// Strategy are the mandatory foundation; everything else builds on top.
//
// Foundation → Identity → Content → Brand → Website → Media → Launch

const PHASES = [
  {
    label: "Foundation",
    icon: Eye,
    activities: [
      { icon: Target, title: "AI Vision Discovery", desc: "Describe your business in one sentence — AI runs full web discovery and builds your mission, audience, and long-term vision." },
      { icon: ClipboardList, title: "Strategy Blueprint", desc: "10 ranked strategies with competitive positioning, go-to-market plan, revenue model, and roadmap — pick your path." },
    ],
  },
  {
    label: "Identity",
    icon: Compass,
    activities: [
      { icon: Globe, title: "Business Name & Domain", desc: "AI-generated names with domain availability, registry checks, and brand-strength scoring — or use your existing business." },
      { icon: Building2, title: "Business Profile", desc: "Answer a few questions so every downstream asset is tailored to your business, location, and services." },
    ],
  },
  {
    label: "Content",
    icon: MessageSquareText,
    activities: [
      { icon: Megaphone, title: "Content Tone & Messaging", desc: "10 marketing tone templates generated from market research — pick the voice that fits your brand." },
    ],
  },
  {
    label: "Brand",
    icon: Palette,
    activities: [
      { icon: PenTool, title: "Logo Generator", desc: "AI logo concepts with transparent backgrounds, tailored to your industry and brand direction." },
      { icon: Shirt, title: "Brand Identity", desc: "Brand mockups, color palettes, typography, and design direction — a complete visual identity." },
    ],
  },
  {
    label: "Website",
    icon: Monitor,
    activities: [
      { icon: LayoutTemplate, title: "Website Design Studio", desc: "AI-generated layouts, copy, project galleries, and imagery — preview and customize before launch." },
      { icon: Rocket, title: "Deployment", desc: "Your site deploys live with SEO-ready pages, schema markup, and AEO answer blocks." },
    ],
  },
  {
    label: "Media",
    icon: Share2,
    activities: [
      { icon: Share2, title: "Social Media", desc: "Post templates and a 30-day content calendar tailored to your brand and industry." },
      { icon: Video, title: "Video Concepts", desc: "10 video concepts with scripts and on-demand video generation at 8s, 15s, 30s, or 45s." },
    ],
  },
  {
    label: "Launch",
    icon: Rocket,
    activities: [
      { icon: LayoutTemplate, title: "Review Your Designs", desc: "See every generated asset in one place, request revisions, and approve your favorites." },
      { icon: ShieldCheck, title: "Enhancements & Approvals", desc: "Add enhancements, sign documents, and approve everything before it goes live." },
    ],
  },
];

export default function SystemActivities() {
  return (
    <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
        <Eye className="h-4 w-4" /> Your Build Pipeline
      </div>
      <p className="mt-1 text-sm text-white/50">
        The Xtreme AI Business Generator builds your entire brand in a guided pipeline — foundation, identity,
        content, brand, website, media, and launch. Here's what each phase produces, in the order you'll experience it:
      </p>
      <div className="mt-4 space-y-4">
        {PHASES.map((phase, pi) => {
          const PhaseIcon = phase.icon;
          return (
            <div key={phase.label}>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-lime-400/40 bg-lime-400/10 text-[10px] font-bold text-lime-400">
                  {pi + 1}
                </span>
                <PhaseIcon className="h-3.5 w-3.5 text-lime-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-lime-400">{phase.label}</span>
                <div className="h-px flex-1 bg-lime-400/20" />
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {phase.activities.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-black/30 p-3 transition-colors hover:border-lime-400/40"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-400/10">
                        <Icon className="h-4 w-4 text-lime-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-white">{a.title}</span>
                        <p className="mt-0.5 text-xs leading-tight text-white/50">{a.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}