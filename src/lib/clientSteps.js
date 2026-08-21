import {
  Package, Building2, PenTool, Shirt, Palette, FileSignature, ShieldCheck, Rocket, LayoutTemplate, Settings, LayoutDashboard,
} from "lucide-react";

// The ordered journey a client follows to get their epoxy contractor website
// built by Xtreme Polishing Systems & Polished Concrete University. Each step
// gates the next so the client only ever sees the one thing they need to do.
// `step` is the 1-based number shown in the timeline (null = utility link).
export const CLIENT_STEPS = [
  {
    to: "/my-package",
    label: "Welcome",
    icon: Package,
    step: 1,
    gate: "auto",
    activityLabel: "Review your package",
    title: "Step 1 · Welcome to Your Website Build",
    body: "Here's everything included in your epoxy contractor website package from Xtreme Polishing Systems & Polished Concrete University. Review what's included, then continue to tell us about your business.",
    nextLabel: "Go to Business Profile",
    nextTo: "/business-profile",
  },
  {
    to: "/business-profile",
    label: "Business Profile",
    icon: Building2,
    step: 2,
    gate: "profile",
    activityLabel: "Complete your business profile",
    title: "Step 2 · Tell Us About Your Epoxy Business",
    body: "Fill out your business details below — name, services, service area, logo and photos. Our team uses this to build your website, so the more complete it is, the better your site will be. You must complete this before we can start designing.",
    nextLabel: "Go to Logo Generator",
    nextTo: "/logo-generator",
  },
  {
    to: "/logo-generator",
    label: "Logo Generator",
    icon: PenTool,
    step: 3,
    gate: "logo",
    activityLabel: "Pick your logo",
    title: "Step 3 · Pick Your Logo",
    body: "We generated 10 logo concepts for your epoxy business from the name you provided. Tap the one that feels right — your team will use it across your entire brand.",
    nextLabel: "Go to Brand Generator",
    nextTo: "/brand-generator",
  },
  {
    to: "/brand-generator",
    label: "Brand Generator",
    icon: Shirt,
    step: 4,
    gate: "brand",
    activityLabel: "Pick your brand mockups",
    title: "Step 4 · See Your Brand Come to Life",
    body: "We applied your logo to 10 real-world mockups — business cards, brochures, apparel, an app, a van wrap and more. Pick up to 3 you love. Use Preview to zoom in and toggle colors.",
    nextLabel: "Go to Website Design",
    nextTo: "/design-direction",
  },
  {
    to: "/design-direction",
    label: "Website Design",
    icon: Palette,
    step: 5,
    gate: "design",
    activityLabel: "Pick your website design",
    title: "Step 5 · Pick Your Website Design",
    body: "Below are 10 logo & web design packs in different colors and styles. Pick up to 3 that feel right for your epoxy business. Use Preview to see your finished site with your business info filled in.",
    nextLabel: "Go to Your Designs",
    nextTo: "/your-designs",
  },
  {
    to: "/your-designs",
    label: "Your Designs",
    icon: LayoutTemplate,
    step: 6,
    gate: "auto",
    activityLabel: "Review your finished brand package",
    title: "Step 6 · Your Finished Brand Package",
    body: "Everything you picked — your logo, brand mockups, and website design — is compiled here so you can see your finished product. Review it, then continue to sign your service agreement.",
    nextLabel: "Go to Sign Agreement",
    nextTo: "/signatures",
  },
  {
    to: "/signatures",
    label: "Sign Agreement",
    icon: FileSignature,
    step: 7,
    gate: "signatures",
    activityLabel: "Sign your service agreement",
    title: "Step 7 · Sign Your Service Agreement",
    body: "Review and sign your service agreement below. You must sign all pending documents before we can begin building — your team starts work the moment it's signed.",
    nextLabel: "Go to Design Approval",
    nextTo: "/approvals",
  },
  {
    to: "/approvals",
    label: "Design Approval",
    icon: ShieldCheck,
    step: 8,
    gate: "approvals",
    activityLabel: "Approve your website design",
    title: "Step 8 · Approve Your Website Design",
    body: "Review and approve your website design below. You must clear all pending approvals before we can launch your site — nothing goes live until you approve it.",
    nextLabel: "Go to Launch",
    nextTo: "/receipts",
  },
  {
    to: "/receipts",
    label: "Launch",
    icon: Rocket,
    step: 9,
    gate: "auto",
    activityLabel: "Track your launch",
    title: "Step 9 · Your Website Is Launching",
    body: "Every action your team takes to build and launch your epoxy contractor website is logged here for full transparency. Sit back — your site is going live.",
    nextLabel: null,
    nextTo: null,
  },
];

// Utility links (not numbered steps).
export const CLIENT_UTILITIES = [
  { to: "/client-portal", label: "Client Portal", icon: LayoutDashboard, end: true },
  { to: "/settings", label: "Settings", icon: Settings, end: true },
];

export const CLIENT_NAV = [...CLIENT_STEPS, ...CLIENT_UTILITIES];

// Look up the step entry for a given pathname.
export function getStepByPath(path) {
  return CLIENT_STEPS.find((s) => s.to === path) || null;
}