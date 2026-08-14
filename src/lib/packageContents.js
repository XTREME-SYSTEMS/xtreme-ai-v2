import {
  Sparkles, Palette, Monitor, Rocket, Crosshair, BarChart3,
  FileText, CheckCircle, Bot, Smartphone, Megaphone,
} from "lucide-react";

// Maps a client's purchased track (from onboardingTracks) to the
// deliverable package broken into ordered, approval-gated steps.
export const PACKAGE_CONTENTS = {
  elite: {
    title: "Elite Plan",
    subtitle: "Full-service growth engine — brand, web, sites, ranking & reporting.",
    steps: [
      { key: "onboarding", label: "Onboarding", desc: "Tell us about your business so your team can get to work.", gate: false, icon: Sparkles },
      { key: "brand-strategy", label: "Brand Strategy", desc: "Positioning, promise, tagline, colors & typography.", gate: true, icon: Palette },
      { key: "brand-kit", label: "Brand Kit", desc: "Logo, business card, brochure, social posts & video.", gate: true, icon: Palette },
      { key: "website", label: "Website Build", desc: "Design, copy, SEO/AEO & launch-ready site.", gate: true, icon: Monitor },
      { key: "clone-deploy", label: "Clone & Deploy Sites", desc: "Clone, rebrand & deploy portfolio sites end-to-end.", gate: true, icon: Rocket },
      { key: "rank-engine", label: "Rank Engine", desc: "Pages, citations & backlink outreach to reach page one.", gate: true, icon: Crosshair },
      { key: "gsc-reporting", label: "GSC Tracking & Reporting", desc: "Indexing, traffic & ranking reports.", gate: false, icon: BarChart3 },
      { key: "optimization", label: "Ongoing Optimization", desc: "Continuous content refresh & authority building.", gate: false, icon: Megaphone },
    ],
  },
  pro: {
    title: "Pro Plan",
    subtitle: "Brand, website & ranking toolkit with approval gates.",
    steps: [
      { key: "onboarding", label: "Onboarding", desc: "Tell us about your business.", gate: false, icon: Sparkles },
      { key: "brand-kit", label: "Brand Kit", desc: "Logo, card, brochure, social & video.", gate: true, icon: Palette },
      { key: "website", label: "Website Build", desc: "Design, copy, SEO/AEO & launch.", gate: true, icon: Monitor },
      { key: "race-to-rank", label: "Race to Rank", desc: "Push your pages toward page one.", gate: true, icon: Crosshair },
      { key: "gsc-reporting", label: "GSC Tracking", desc: "Indexing & traffic reports.", gate: false, icon: BarChart3 },
    ],
  },
  deposit: {
    title: "Done-For-You Service",
    subtitle: "Your team handles the build — you guide and approve.",
    steps: [
      { key: "onboarding", label: "Onboarding", desc: "Answer a few questions about your business.", gate: false, icon: Sparkles },
      { key: "proposal", label: "Proposal & Plan", desc: "Your team prepares a tailored plan.", gate: true, icon: FileText },
      { key: "build", label: "Done-For-You Build", desc: "Brand, site & content built for you.", gate: true, icon: Rocket },
      { key: "review", label: "Review & Approve", desc: "Sign off on each deliverable.", gate: true, icon: CheckCircle },
      { key: "launch", label: "Launch", desc: "We ship once you approve.", gate: true, icon: Rocket },
    ],
  },
  "web-pack": {
    title: "Web Pack",
    subtitle: "Brand + website, built end-to-end.",
    steps: [
      { key: "onboarding", label: "Onboarding", desc: "Tell us about your business.", gate: false, icon: Sparkles },
      { key: "brand-kit", label: "Brand Kit", desc: "Logo, card, brochure & social.", gate: true, icon: Palette },
      { key: "website", label: "Website Build", desc: "Design, copy & build.", gate: true, icon: Monitor },
      { key: "seo-aeo", label: "SEO / AEO", desc: "On-page, schema & AI-search optimization.", gate: true, icon: Crosshair },
      { key: "launch", label: "Launch", desc: "Go live once approved.", gate: true, icon: Rocket },
    ],
  },
  "app-pack": {
    title: "App Pack",
    subtitle: "Brand, web & mobile app — all in one.",
    steps: [
      { key: "onboarding", label: "Onboarding", desc: "Tell us about your business.", gate: false, icon: Sparkles },
      { key: "brand-kit", label: "Brand Kit", desc: "Logo, card, brochure & social.", gate: true, icon: Palette },
      { key: "website", label: "Website Build", desc: "Design, copy & build.", gate: true, icon: Monitor },
      { key: "app", label: "Mobile App Build", desc: "iOS & Android app from your site.", gate: true, icon: Smartphone },
      { key: "launch", label: "Launch", desc: "Go live once approved.", gate: true, icon: Rocket },
    ],
  },
  "ai-tool": {
    title: "AI Tool",
    subtitle: "AI-powered brand & SEO tools.",
    steps: [
      { key: "onboarding", label: "Onboarding", desc: "Tell us about your business.", gate: false, icon: Sparkles },
      { key: "ai-setup", label: "AI Tool Setup", desc: "Configure your AI tool.", gate: true, icon: Bot },
      { key: "ai-use", label: "Use AI Agents", desc: "Brand & SEO agents at work.", gate: true, icon: Bot },
    ],
  },
  default: {
    title: "Your Brand Build",
    subtitle: "A guided, approval-gated brand & site build.",
    steps: [
      { key: "onboarding", label: "Onboarding", desc: "Tell us about your business.", gate: false, icon: Sparkles },
      { key: "brand-kit", label: "Brand Kit", desc: "Logo, card, brochure, social & video.", gate: true, icon: Palette },
      { key: "website", label: "Website Build", desc: "Design, copy & build.", gate: true, icon: Monitor },
      { key: "launch", label: "Launch", desc: "Go live once approved.", gate: true, icon: Rocket },
    ],
  },
};

export function getPackage(trackKey) {
  return PACKAGE_CONTENTS[trackKey] || PACKAGE_CONTENTS.default;
}