import {
  Building2, Globe, Palette, Megaphone, Video, Search,
  Radar, Database, Rocket, FileText, Users, BarChart3, Box,
  Cpu, ShoppingCart, Network, ShieldCheck, TrendingUp, Layers,
} from "lucide-react";

// All possible activities the Xtreme AI Business Generator can perform,
// grouped by functional category. Shown on the Welcome step to orient
// the user on the full scope of the system.

const CATEGORIES = [
  {
    label: "Build",
    icon: Layers,
    activities: [
      { icon: Building2, title: "Build a Business", desc: "Generate a business name, domain, and full brand identity from scratch." },
      { icon: Globe, title: "Build a Website", desc: "AI-generated layouts, copy, images, and SEO-ready pages — deployed live." },
      { icon: Palette, title: "Build a Brand", desc: "Logos, color palettes, typography, brand packs, and design direction." },
      { icon: Cpu, title: "Build a System", desc: "Architecture, data models, UI systems, and full code manifests for web apps." },
      { icon: ShoppingCart, title: "Build an E-Commerce Store", desc: "Product catalogs, checkout, pricing, and online store generation." },
      { icon: Network, title: "Build a Platform", desc: "Multi-sided marketplaces with user flows, integrations, and scale." },
    ],
  },
  {
    label: "Generate",
    icon: Megaphone,
    activities: [
      { icon: Megaphone, title: "Generate Content", desc: "Hero copy, about pages, services, FAQs, and blog posts optimized for SEO & AEO." },
      { icon: Megaphone, title: "Generate Social Media", desc: "Post templates, 30-day content calendars, and platform-specific creative." },
      { icon: Video, title: "Generate Video", desc: "Video concepts, scripts, and video packs tailored to your brand." },
    ],
  },
  {
    label: "Market & SEO",
    icon: TrendingUp,
    activities: [
      { icon: Search, title: "SEO Optimization", desc: "Technical SEO, schema markup, AEO answer blocks, and citation building." },
      { icon: Radar, title: "Lead Generation", desc: "Discover businesses with bad websites, score opportunities, and automate outreach." },
      { icon: TrendingUp, title: "Market Research", desc: "Competitor analysis, industry DNA, SERP blueprints, and search opportunity gaps." },
      { icon: Globe, title: "Domain Acquisition", desc: "Find available domains, purchase via Vercel, and manage a domain portfolio." },
    ],
  },
  {
    label: "Deploy & Operate",
    icon: Rocket,
    activities: [
      { icon: Rocket, title: "Deploy & Launch", desc: "Deploy sites to Vercel, configure DNS, and manage live URLs." },
      { icon: FileText, title: "E-Sign Documents", desc: "Contracts, agreements, and legally binding e-signature workflows." },
      { icon: Users, title: "CRM Pipeline", desc: "Contacts, accounts, deals, quotes, invoices, and sales pipeline tracking." },
      { icon: BarChart3, title: "Analytics & Tracking", desc: "Rank monitoring, GSC traffic, AI citation tracking, and experiment metrics." },
    ],
  },
  {
    label: "Advanced Tools",
    icon: Cpu,
    activities: [
      { icon: Box, title: "3D Walkthroughs", desc: "Generate 3D property walkthroughs and interactive visual tours." },
      { icon: ShieldCheck, title: "QA & Validation", desc: "Autonomous audit, fix, heal, harden, and optimize validation pipeline." },
      { icon: Database, title: "Clone & Rebrand", desc: "Clone competitor sites, rebrand existing businesses, and launch fast." },
    ],
  },
];

export default function SystemActivities() {
  return (
    <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
        <Cpu className="h-4 w-4" /> What This System Can Do
      </div>
      <p className="mt-1 text-sm text-white/50">
        The Xtreme AI Business Generator is a complete growth factory. Here's everything you can build, generate, and automate:
      </p>
      <div className="mt-4 space-y-4">
        {CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          return (
            <div key={cat.label}>
              <div className="mb-2 flex items-center gap-2">
                <CatIcon className="h-3.5 w-3.5 text-lime-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-lime-400">{cat.label}</span>
                <div className="h-px flex-1 bg-lime-400/20" />
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {cat.activities.map((a, i) => {
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