import {
  Package, FileSignature, CheckCircle, ScrollText, Bot, Settings, LayoutDashboard,
} from "lucide-react";

// The ordered journey a client should follow, with the directions shown in
// the pop-up coach on each page. `step` is the 1-based number shown in the nav
// (null = utility link, not a numbered step).
export const CLIENT_STEPS = [
  {
    to: "/my-package",
    label: "My Package",
    icon: Package,
    step: 1,
    gate: "auto",
    activityLabel: "Review your package",
    title: "Step 1 · Review Your Package",
    body: "Here's everything you purchased and your active services. Take a look at what's included, then start the activity to move on to Signatures.",
    nextLabel: "Go to Signatures",
    nextTo: "/signatures",
  },
  {
    to: "/signatures",
    label: "Signatures",
    icon: FileSignature,
    step: 2,
    gate: "signatures",
    activityLabel: "Sign your agreement",
    title: "Step 2 · Sign Your Agreement",
    body: "Review and sign your service agreement below. You must sign all pending documents before you can continue — your team starts work once it's signed.",
    nextLabel: "Go to Approvals",
    nextTo: "/approvals",
  },
  {
    to: "/approvals",
    label: "Approvals",
    icon: CheckCircle,
    step: 3,
    gate: "approvals",
    activityLabel: "Approve your deliverables",
    title: "Step 3 · Approve Your Deliverables",
    body: "Sign off on each pending deliverable below. You must clear all pending approvals before you can continue — nothing goes live until you approve it.",
    nextLabel: "Go to Activity",
    nextTo: "/receipts",
  },
  {
    to: "/receipts",
    label: "Activity",
    icon: ScrollText,
    step: 4,
    gate: "auto",
    activityLabel: "Review your activity",
    title: "Step 4 · Track Your Activity",
    body: "Every action your team takes on your account — approvals, signatures, and updates — is logged here for full transparency. Review it, then finish.",
    nextLabel: null,
    nextTo: null,
  },
];

// Utility links (not numbered steps).
export const CLIENT_UTILITIES = [
  { to: "/client-portal", label: "Client Portal", icon: LayoutDashboard, end: true },
  { to: "/assistant", label: "AI Assistant", icon: Bot, end: true },
  { to: "/settings", label: "Settings", icon: Settings, end: true },
];

// Full nav list in display order: numbered steps first, then utilities.
export const CLIENT_NAV = [...CLIENT_STEPS, ...CLIENT_UTILITIES];

// Look up the step entry for a given pathname.
export function getStepByPath(path) {
  return CLIENT_STEPS.find((s) => s.to === path) || null;
}