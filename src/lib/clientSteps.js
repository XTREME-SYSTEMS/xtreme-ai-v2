import {
  Package, Building2, FileSignature, ShieldCheck, Rocket, Settings, LayoutDashboard,
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
    nextLabel: "Go to Sign Agreement",
    nextTo: "/signatures",
  },
  {
    to: "/signatures",
    label: "Sign Agreement",
    icon: FileSignature,
    step: 3,
    gate: "signatures",
    activityLabel: "Sign your service agreement",
    title: "Step 3 · Sign Your Service Agreement",
    body: "Review and sign your service agreement below. You must sign all pending documents before we can begin building — your team starts work the moment it's signed.",
    nextLabel: "Go to Design Approval",
    nextTo: "/approvals",
  },
  {
    to: "/approvals",
    label: "Design Approval",
    icon: ShieldCheck,
    step: 4,
    gate: "approvals",
    activityLabel: "Approve your website design",
    title: "Step 4 · Approve Your Website Design",
    body: "Review and approve your website design below. You must clear all pending approvals before we can launch your site — nothing goes live until you approve it.",
    nextLabel: "Go to Launch",
    nextTo: "/receipts",
  },
  {
    to: "/receipts",
    label: "Launch",
    icon: Rocket,
    step: 5,
    gate: "auto",
    activityLabel: "Track your launch",
    title: "Step 5 · Your Website Is Launching",
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