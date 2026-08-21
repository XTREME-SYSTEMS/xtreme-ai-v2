import {
  Package, Building2, MessageSquareText, PenTool, Shirt, Palette, Share2, Video, LayoutTemplate, FileSignature, ShieldCheck, Rocket, Settings, LayoutDashboard, Sparkles,
} from "lucide-react";

// The ordered journey a client follows to get their epoxy contractor website
// built. Each step gates the next so the client only ever sees the one thing
// they need to do. `step` is the 1-based number shown in the timeline.
export const CLIENT_STEPS = [
  {
    to: "/my-package", label: "Welcome", icon: Package, step: 1, gate: "auto",
    activityLabel: "Review your package",
    title: "Step 1 · Welcome to Your Website Build",
    body: "Here's everything included in your epoxy contractor website package. Review what's included, then continue to tell us about your business.",
    nextLabel: "Go to Business Profile", nextTo: "/business-profile",
  },
  {
    to: "/business-profile", label: "Business Profile", icon: Building2, step: 2, gate: "profile",
    activityLabel: "Complete your business profile",
    title: "Step 2 · Tell Us About Your Epoxy Business",
    body: "Fill out your business details — name, services, service area, logo and photos. Our team uses this to build everything else.",
    nextLabel: "Go to Content Generator", nextTo: "/content-generator",
  },
  {
    to: "/content-generator", label: "Content Generator", icon: MessageSquareText, step: 3, gate: "content",
    activityLabel: "Pick your content tone",
    title: "Step 3 · Choose Your Website's Voice",
    body: "We researched your market — competitors, pricing, and what local customers respond to — and wrote 10 different messaging tones. Pick the one that fits your business. We've recommended the best one.",
    nextLabel: "Go to Logo Generator", nextTo: "/logo-generator",
  },
  {
    to: "/logo-generator", label: "Logo Generator", icon: PenTool, step: 4, gate: "logo",
    activityLabel: "Pick your logo",
    title: "Step 4 · Pick Your Logo",
    body: "We generated 10 logo concepts for your epoxy business. All are created with transparent backgrounds so they look perfect on any website theme. Tap the one that feels right.",
    nextLabel: "Go to Brand Generator", nextTo: "/brand-generator",
  },
  {
    to: "/brand-generator", label: "Brand Generator", icon: Shirt, step: 5, gate: "brand",
    activityLabel: "Approve your brand mockups",
    title: "Step 5 · See Your Brand Come to Life",
    body: "We applied your logo to 10 real-world mockups — business cards, brochures, apparel, a van wrap and more. All are included. Don't like one? Regenerate just that item.",
    nextLabel: "Go to Website Design", nextTo: "/design-direction",
  },
  {
    to: "/design-direction", label: "Website Design", icon: Palette, step: 6, gate: "design",
    activityLabel: "Pick your website design",
    title: "Step 6 · Pick Your Website Design",
    body: "We wrote your site copy from your onboarding and real local data, then designed 10 distinct website layouts with your logo and brand colors. Preview each (desktop + mobile), hover any section to comment or regenerate just that part, and pick the one you love.",
    nextLabel: "Go to Social Media", nextTo: "/social-media",
  },
  {
    to: "/social-media", label: "Social Media", icon: Share2, step: 7, gate: "social",
    activityLabel: "Approve your social media pack",
    title: "Step 7 · Your Social Media Brand Kit",
    body: "We designed 10 on-brand social templates with your logo — profile, cover, stories, posts, favicon, icons — plus a full 30-day content calendar with captions and best posting times. All included.",
    nextLabel: "Go to Video Generator", nextTo: "/video-generator",
  },
  {
    to: "/video-generator", label: "Video Generator", icon: Video, step: 8, gate: "video",
    activityLabel: "Approve your video concepts",
    title: "Step 8 · Your Video Concepts",
    body: "We created 10 video concepts using your onboarding, content tone, logo, and brand. Preview each, generate the actual video for any you like, and use them on your site, social media, or YouTube.",
    nextLabel: "Go to Your Designs", nextTo: "/your-designs",
  },
  {
    to: "/your-designs", label: "Your Designs", icon: LayoutTemplate, step: 9, gate: "auto",
    activityLabel: "Review your finished brand package",
    title: "Step 9 · Your Finished Brand Package",
    body: "Everything you picked — your content tone, logo, brand mockups, website design, social media kit, and videos — is compiled here. Review it all, then continue to choose any enhancements.",
    nextLabel: "Go to Enhancements", nextTo: "/enhancements",
  },
  {
    to: "/enhancements", label: "Enhancements", icon: Sparkles, step: 10, gate: "auto",
    activityLabel: "Choose optional add-ons",
    title: "Step 10 · Enhance Your Package",
    body: "Add optional enhancements to supercharge your launch — rush delivery, extra pages, blog content, Google Business Profile setup, and more. Skip if you're happy with your current package.",
    nextLabel: "Go to Sign Agreement", nextTo: "/signatures",
  },
  {
    to: "/signatures", label: "Sign Agreement", icon: FileSignature, step: 11, gate: "signatures",
    activityLabel: "Sign your service agreement",
    title: "Step 11 · Sign Your Service Agreement",
    body: "Review and sign your service agreement below. You must sign all pending documents before we can begin building. Need to change something? Go back to any step.",
    nextLabel: "Go to Design Approval", nextTo: "/approvals",
  },
  {
    to: "/approvals", label: "Design Approval", icon: ShieldCheck, step: 12, gate: "approvals",
    activityLabel: "Approve your website design",
    title: "Step 12 · Approve Your Website Design",
    body: "Review and approve your website design below. Nothing goes live until you approve it.",
    nextLabel: "Go to Launch", nextTo: "/receipts",
  },
  {
    to: "/receipts", label: "Launch", icon: Rocket, step: 13, gate: "auto",
    activityLabel: "Track your launch",
    title: "Step 13 · Your Website Is Launching",
    body: "Every action your team takes to build and launch your epoxy contractor website is logged here for full transparency.",
    nextLabel: null, nextTo: null,
  },
];

export const CLIENT_UTILITIES = [
  { to: "/client-portal", label: "Client Portal", icon: LayoutDashboard, end: true },
  { to: "/settings", label: "Settings", icon: Settings, end: true },
];

export const CLIENT_NAV = [...CLIENT_STEPS, ...CLIENT_UTILITIES];

export function getStepByPath(path) {
  return CLIENT_STEPS.find((s) => s.to === path) || null;
}