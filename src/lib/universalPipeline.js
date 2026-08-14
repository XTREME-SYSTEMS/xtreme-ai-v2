import {
  Sparkles, FileText, Palette, Monitor, Crosshair, Rocket,
  BarChart3, Megaphone,
} from "lucide-react";

// A single canonical, approval-gated pipeline that every system
// implementation follows — regardless of which product was purchased.
// `gate: true` marks a step that requires explicit client approval
// before the team moves on.
export const UNIVERSAL_PIPELINE = [
  {
    key: "onboarding",
    label: "Onboarding",
    desc: "Tell us about your business so your team can get to work.",
    gate: false,
    icon: Sparkles,
  },
  {
    key: "strategy",
    label: "Strategy & Proposal",
    desc: "We prepare your tailored plan, positioning and roadmap.",
    gate: true,
    icon: FileText,
  },
  {
    key: "brand-kit",
    label: "Brand Kit",
    desc: "Logo, colors, business card, brochure and social posts.",
    gate: true,
    icon: Palette,
  },
  {
    key: "website",
    label: "Website Build",
    desc: "Design, copy and build of your site, end to end.",
    gate: true,
    icon: Monitor,
  },
  {
    key: "seo-aeo",
    label: "SEO & AEO",
    desc: "On-page, schema and AI-search optimization.",
    gate: true,
    icon: Crosshair,
  },
  {
    key: "launch",
    label: "Launch",
    desc: "Deploy to your live domain once approved.",
    gate: true,
    icon: Rocket,
  },
  {
    key: "index-rank",
    label: "Index & Rank",
    desc: "GSC submission, citations and backlink outreach.",
    gate: false,
    icon: BarChart3,
  },
  {
    key: "optimize",
    label: "Report & Optimize",
    desc: "Ongoing tracking, content refresh and authority building.",
    gate: false,
    icon: Megaphone,
  },
];