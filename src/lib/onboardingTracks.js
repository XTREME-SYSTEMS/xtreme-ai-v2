import {
  LayoutDashboard, Wand2, Rocket, Factory, Crosshair, FileText,
  CheckCircle, Sparkles, Bot,
} from "lucide-react";

// Maps a purchased productId (from create-checkout catalog) to an onboarding track.
export const PRODUCT_TO_TRACK = {
  "pro-monthly": "pro",
  "pro-annual": "pro",
  "elite-monthly": "elite",
  "elite-annual": "elite",
  deposit: "deposit",
  "web-pack": "web-pack",
  "app-pack": "app-pack",
  "ai-tool": "ai-tool",
};

// Highest-priority track wins when a user owns multiple products.
export const PRIORITY = ["elite", "pro", "deposit", "web-pack", "app-pack", "ai-tool"];

export const TRACKS = {
  elite: {
    key: "elite",
    title: "Elite Plan",
    subtitle: "Your full-service growth engine is unlocked.",
    greeting: "Welcome to your Elite plan! You've got the full growth factory at your fingertips.",
    start: [
      { to: "/client-portal", icon: LayoutDashboard, label: "Command Center", desc: "Your mission control for every tool and metric." },
      { to: "/brand-factory", icon: Wand2, label: "Brand Factory", desc: "Build a complete brand kit with AI." },
      { to: "/clone-pipeline", icon: Rocket, label: "Clone Pipeline", desc: "Clone, rebrand & deploy sites end-to-end." },
    ],
    steps: [
      "Start in the Command Center — your hub for the whole platform.",
      "Use Brand Factory to generate your brand, or Clone Pipeline to deploy a site.",
      "Track rankings and traffic in GSC Traffic as your sites climb.",
      "Approve anything production-bound in the Approvals queue.",
    ],
    cta: { to: "/brand-factory", label: "Start Brand Factory" },
  },
  pro: {
    key: "pro",
    title: "Pro Plan",
    subtitle: "Your growth toolkit is ready.",
    greeting: "Welcome to your Pro plan! Let's get your brand and sites ranking.",
    start: [
      { to: "/client-portal", icon: LayoutDashboard, label: "Command Center", desc: "See your portfolio and quick actions." },
      { to: "/brand-factory", icon: Wand2, label: "Brand Factory", desc: "Build your brand kit with AI." },
      { to: "/race-to-rank", icon: Crosshair, label: "Race to Rank", desc: "Push your pages toward page one." },
    ],
    steps: [
      "Start in the Command Center for an overview.",
      "Build your brand in Brand Factory.",
      "Launch pages and race them to rank.",
      "Approve production work in the Approvals queue.",
    ],
    cta: { to: "/brand-factory", label: "Start Brand Factory" },
  },
  deposit: {
    key: "deposit",
    title: "Done-For-You Service",
    subtitle: "Your team is on it — just guide and approve.",
    greeting: "Welcome! You've reserved a Done-For-You service. Let's capture your details so your team can get to work.",
    start: [
      { to: "/client-portal", icon: Sparkles, label: "Finish Onboarding", desc: "Answer a few questions about your business." },
      { to: "/proposals", icon: FileText, label: "My Proposals", desc: "Review the plan your team prepares for you." },
      { to: "/approvals", icon: CheckCircle, label: "Approvals", desc: "Sign off on work before it goes live." },
    ],
    steps: [
      "First, finish AI Onboarding at the top of your dashboard.",
      "Your team reviews your info and prepares a proposal.",
      "You approve each deliverable before it ships.",
      "Track progress in your Activity feed.",
    ],
    cta: { to: "/client-portal", label: "Go to Dashboard" },
  },
  "web-pack": {
    key: "web-pack",
    title: "Web Pack",
    subtitle: "Let's build your website.",
    greeting: "Welcome! Your Web Pack is ready — let's build your brand and website.",
    start: [
      { to: "/brand-factory", icon: Wand2, label: "Brand Factory", desc: "Generate your brand kit first." },
      { to: "/website-factory", icon: Factory, label: "Website Factory", desc: "Then build your website end-to-end." },
    ],
    steps: [
      "Build your brand in Brand Factory (logo, card, brochure, social).",
      "Then open Website Factory to generate your site.",
      "Approve the final site before it goes live.",
    ],
    cta: { to: "/brand-factory", label: "Start Brand Factory" },
  },
  "app-pack": {
    key: "app-pack",
    title: "App Pack",
    subtitle: "Brand, web, and app — all in one.",
    greeting: "Welcome! Your App Pack unlocks brand, web, and app builds.",
    start: [
      { to: "/brand-factory", icon: Wand2, label: "Brand Factory", desc: "Generate your brand kit." },
      { to: "/website-factory", icon: Factory, label: "Website Factory", desc: "Build your website." },
    ],
    steps: [
      "Build your brand in Brand Factory.",
      "Build your website in Website Factory.",
      "Approve each deliverable before launch.",
    ],
    cta: { to: "/brand-factory", label: "Start Brand Factory" },
  },
  "ai-tool": {
    key: "ai-tool",
    title: "AI Tool",
    subtitle: "Your AI tool is ready to use.",
    greeting: "Welcome! You've unlocked an AI tool. Start in Brand Factory or explore the AI agents.",
    start: [
      { to: "/brand-factory", icon: Wand2, label: "Brand Factory", desc: "Generate brand assets with AI." },
      { to: "/seo-agent", icon: Bot, label: "SEO AI Agent", desc: "Automate your SEO with AI." },
    ],
    steps: [
      "Try Brand Factory to generate brand assets.",
      "Or explore the SEO AI Agent for automated optimization.",
      "Approve any production work in the Approvals queue.",
    ],
    cta: { to: "/brand-factory", label: "Start Brand Factory" },
  },
  default: {
    key: "default",
    title: "Welcome",
    subtitle: "Let's get you started.",
    greeting: "Welcome aboard! Let's get to know your business, then build your brand.",
    start: [
      { to: "/client-portal", icon: Sparkles, label: "AI Onboarding", desc: "Answer a few questions about your business." },
      { to: "/brand-factory", icon: Wand2, label: "Brand Factory", desc: "Build your full brand kit with AI." },
    ],
    steps: [
      "First, finish AI Onboarding at the top of your dashboard.",
      "Then open Brand Factory and let the AI interview you.",
      "Step through Logo → Business Card → Brochure → Social → Video.",
      "Approve any work your team sends in Pending Approvals.",
    ],
    cta: { to: "/brand-factory", label: "Start Brand Factory" },
  },
};

export function getTrack(purchases) {
  const keys = (purchases || []).map((p) => PRODUCT_TO_TRACK[p.productId]).filter(Boolean);
  const top = PRIORITY.find((k) => keys.includes(k));
  return TRACKS[top] || TRACKS.default;
}