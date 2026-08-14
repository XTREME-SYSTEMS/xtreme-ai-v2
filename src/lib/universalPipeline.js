import {
  Sparkles, FileText, Palette, Monitor, Crosshair, Rocket,
  BarChart3, Megaphone,
} from "lucide-react";

// A single canonical, approval-gated pipeline that every system
// implementation follows — regardless of which product was purchased.
// `gate: true` marks a step that requires explicit client approval
// before the team moves on. `to` deep-links the step to its work surface
// (null = handled inline within the Approvals page).
export const UNIVERSAL_PIPELINE = [
  {
    key: "onboarding",
    label: "Onboarding",
    desc: "Tell us about your business so your team can get to work.",
    gate: false,
    to: null,
    icon: Sparkles,
  },
  {
    key: "strategy",
    label: "Strategy & Proposal",
    desc: "We prepare your tailored plan, positioning and roadmap.",
    gate: true,
    to: null,
    icon: FileText,
  },
  {
    key: "brand-kit",
    label: "Brand Kit",
    desc: "Logo, colors, business card, brochure and social posts.",
    gate: true,
    to: "/brand-factory",
    icon: Palette,
  },
  {
    key: "website",
    label: "Website Build",
    desc: "Design, copy and build of your site, end to end.",
    gate: true,
    to: "/website-factory",
    icon: Monitor,
  },
  {
    key: "seo-aeo",
    label: "SEO & AEO",
    desc: "On-page, schema and AI-search optimization.",
    gate: true,
    to: "/seo-accelerator",
    icon: Crosshair,
  },
  {
    key: "launch",
    label: "Launch",
    desc: "Deploy to your live domain once approved.",
    gate: true,
    to: null,
    icon: Rocket,
  },
  {
    key: "index-rank",
    label: "Index & Rank",
    desc: "GSC submission, citations and backlink outreach.",
    gate: false,
    to: "/gsc-traffic",
    icon: BarChart3,
  },
  {
    key: "optimize",
    label: "Report & Optimize",
    desc: "Ongoing tracking, content refresh and authority building.",
    gate: false,
    to: "/ranking-monitor",
    icon: Megaphone,
  },
];