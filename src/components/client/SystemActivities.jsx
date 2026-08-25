import {
  Building2, Globe, Palette, Megaphone, Video, Search,
  Radar, Database, Rocket, FileText, Users, BarChart3, Box,
  Cpu, ShieldCheck, TrendingUp, Layers,
  Eye, ClipboardList, Target, Compass, DollarSign,
  AlertTriangle, Zap, Handshake,
} from "lucide-react";

// All possible activities the Xtreme AI Business Generator can perform,
// grouped by functional category. Shown on the Welcome step to orient
// the user on the full scope of the system.
//
// Vision and Strategy are the mandatory foundation — they come BEFORE
// Build. You cannot build without first defining what you're building
// and why (Vision), and how you plan to get there (Strategy).

const CATEGORIES = [
  {
    label: "Vision",
    icon: Eye,
    activities: [
      { icon: Target, title: "Define Your Mission", desc: "One powerful sentence — what your epoxy or concrete business exists to do and why it matters." },
      { icon: AlertTriangle, title: "Identify the Problem", desc: "The specific problem you solve — cracked floors, dull concrete, unprotected surfaces, outdated spaces." },
      { icon: Users, title: "Know Your Audience", desc: "Who exactly this is for — homeowners, commercial property managers, industrial facilities, or contractors." },
      { icon: Eye, title: "Long-Term Vision", desc: "A vivid 3-5 year picture of what your epoxy/concrete business becomes. The big ambition." },
      { icon: TrendingUp, title: "Success Metrics", desc: "Measurable indicators — jobs booked, revenue per square foot, service area coverage, review count." },
      { icon: ShieldCheck, title: "Core Values & Value Prop", desc: "Guiding principles and the single most compelling reason someone chooses your epoxy/concrete services." },
    ],
  },
  {
    label: "Strategy",
    icon: ClipboardList,
    activities: [
      { icon: Compass, title: "Competitive Positioning", desc: "How you position against other epoxy/concrete contractors. What's your wedge — metallic epoxy? fast install? commercial focus?" },
      { icon: Rocket, title: "Go-to-Market Plan", desc: "The concrete plan to get your first 100 epoxy/concrete jobs — channels, tactics, sequence." },
      { icon: DollarSign, title: "Revenue & Pricing", desc: "How money is made — per-SF pricing, project minimums, commercial contracts, and recurring maintenance." },
      { icon: Zap, title: "Acquisition Channels", desc: "5-8 specific channels — Google Local, GBP, Angi, Houzz, builder partnerships, property manager outreach." },
      { icon: ClipboardList, title: "Execution Roadmap", desc: "3 phases — Foundation, Growth, Scale — with goals and key initiatives for your epoxy/concrete business." },
      { icon: AlertTriangle, title: "Risks & Mitigations", desc: "Key risks — seasonality, material costs, crew scaling, weather delays — with specific mitigation strategies." },
      { icon: Handshake, title: "Differentiation & Partnerships", desc: "Your durable moat and key partnerships — general contractors, builders, property managers, epoxy suppliers." },
    ],
  },
  {
    label: "Build",
    icon: Layers,
    activities: [
      { icon: Building2, title: "Build a Business", desc: "Generate an epoxy/concrete business name, domain, and full brand identity from scratch." },
      { icon: Globe, title: "Build a Website", desc: "AI-generated epoxy/concrete layouts, copy, project galleries, and SEO-ready pages — deployed live." },
      { icon: Palette, title: "Build a Brand", desc: "Logos, color palettes, typography, brand packs, and design direction for your epoxy/concrete business." },
    ],
  },
  {
    label: "Generate",
    icon: Megaphone,
    activities: [
      { icon: Megaphone, title: "Generate Content", desc: "Hero copy, about pages, service pages (epoxy, polished concrete, decorative), FAQs, and blog posts optimized for SEO & AEO." },
      { icon: Megaphone, title: "Generate Social Media", desc: "Post templates, 30-day content calendars, and platform-specific creative showcasing your epoxy/concrete work." },
      { icon: Video, title: "Generate Video", desc: "Video concepts, scripts, and video packs tailored to your epoxy/concrete brand and project portfolio." },
    ],
  },
  {
    label: "Market & SEO",
    icon: TrendingUp,
    activities: [
      { icon: Search, title: "SEO Optimization", desc: "Technical SEO, schema markup, AEO answer blocks, and citation building for epoxy/concrete keywords." },
      { icon: Radar, title: "Lead Generation", desc: "Discover epoxy/concrete businesses with bad websites, score opportunities, and automate outreach." },
      { icon: TrendingUp, title: "Market Research", desc: "Competitor analysis, epoxy/concrete industry DNA, SERP blueprints, and search opportunity gaps." },
      { icon: Globe, title: "Domain Acquisition", desc: "Find available epoxy/concrete domains, purchase via Vercel, and manage a domain portfolio." },
    ],
  },
  {
    label: "Deploy & Operate",
    icon: Rocket,
    activities: [
      { icon: Rocket, title: "Deploy & Launch", desc: "Deploy epoxy/concrete sites to Vercel, configure DNS, and manage live URLs." },
      { icon: FileText, title: "E-Sign Documents", desc: "Contracts, agreements, and legally binding e-signature workflows for epoxy/concrete projects." },
      { icon: Users, title: "CRM Pipeline", desc: "Contacts, accounts, deals, quotes, invoices, and sales pipeline tracking for your epoxy/concrete business." },
      { icon: BarChart3, title: "Analytics & Tracking", desc: "Rank monitoring, GSC traffic, AI citation tracking, and experiment metrics for epoxy/concrete keywords." },
    ],
  },
  {
    label: "Advanced Tools",
    icon: Cpu,
    activities: [
      { icon: Box, title: "3D Walkthroughs", desc: "Generate 3D walkthroughs of epoxy floors and polished concrete spaces for client presentations." },
      { icon: ShieldCheck, title: "QA & Validation", desc: "Autonomous audit, fix, heal, harden, and optimize validation pipeline for your epoxy/concrete sites." },
      { icon: Database, title: "Clone & Rebrand", desc: "Clone competitor epoxy/concrete sites, rebrand existing businesses, and launch fast." },
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
        The Xtreme AI Business Generator is a complete growth factory for epoxy flooring, epoxy coatings, epoxy contractors, polished concrete, and decorative concrete businesses. Here's everything you can vision, strategize, build, generate, and automate:
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