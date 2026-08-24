import {
  Package, Building2, MessageSquareText, PenTool, Shirt, Palette, Share2,
  Video, LayoutTemplate, FileSignature, ShieldCheck, Rocket, Sparkles, Compass,
} from "lucide-react";

// Xtreme AI step library — an independent copy of the client portal
// steps, with routes prefixed under /portal-studio/. This is a separate
// config so the clone can diverge (refine, harden, brand) without touching
// the live client portal's step definitions.

const BASE = "/portal-studio";

export const PORTAL_STUDIO_STEPS = {
  welcome: {
    key: "welcome",
    to: `${BASE}/welcome`, label: "Welcome", icon: Package, gate: "auto",
    activityLabel: "Review your package",
    title: "Welcome to Xtreme AI",
    body: "Xtreme AI is your AI-guided system for building businesses, apps, brands, websites, and automated social media. Walk the full build journey, refine the UX, and brand it for launch.",
    nextLabel: "Go to Business Name", nextTo: `${BASE}/business-name`,
  },
  "business-name": {
    key: "business-name",
    to: `${BASE}/business-name`, label: "Business Name", icon: Compass, gate: "auto",
    activityLabel: "Find your business name & domain",
    title: "Find Your Business Name & Domain",
    body: "AI scans Google and state registries to recommend viral business names with available .com domains. Pick your favorite and secure the URL.",
    nextLabel: "Go to Business Profile", nextTo: `${BASE}/business-profile`,
  },
  "business-profile": {
    key: "business-profile",
    to: `${BASE}/business-profile`, label: "Business Profile", icon: Building2, gate: "profile",
    activityLabel: "Complete your business profile",
    title: "Tell Us About Your Business",
    body: "Fill out your business details — industry, name, services, service area, logo and photos. This feeds everything downstream.",
    nextLabel: "Go to Content", nextTo: `${BASE}/content`,
  },
  content: {
    key: "content",
    to: `${BASE}/content`, label: "Content Generator", icon: MessageSquareText, gate: "content",
    activityLabel: "Pick your content tone",
    title: "Choose Your Website's Voice",
    body: "We researched your market and wrote 10 different messaging tones. Pick the one that fits your business.",
    nextLabel: "Go to Logo", nextTo: `${BASE}/logo`,
  },
  logo: {
    key: "logo",
    to: `${BASE}/logo`, label: "Logo Generator", icon: PenTool, gate: "logo",
    activityLabel: "Pick your logo",
    title: "Pick Your Logo",
    body: "We generated 10 logo concepts with transparent backgrounds. Tap the one that feels right.",
    nextLabel: "Go to Brand", nextTo: `${BASE}/brand`,
  },
  brand: {
    key: "brand",
    to: `${BASE}/brand`, label: "Brand Generator", icon: Shirt, gate: "brand",
    activityLabel: "Approve your brand mockups",
    title: "See Your Brand Come to Life",
    body: "We applied your logo to 10 real-world mockups — business cards, brochures, apparel, a vehicle wrap and more.",
    nextLabel: "Go to Website", nextTo: `${BASE}/website`,
  },
  website: {
    key: "website",
    to: `${BASE}/website`, label: "Website Design", icon: Palette, gate: "design",
    activityLabel: "Pick your website design",
    title: "Pick Your Website Design",
    body: "We wrote your site copy and designed 10 distinct layouts with your logo and brand colors. Preview each and pick the one you love.",
    nextLabel: "Go to Social", nextTo: `${BASE}/social`,
  },
  social: {
    key: "social",
    to: `${BASE}/social`, label: "Social Media", icon: Share2, gate: "social",
    activityLabel: "Approve your social media pack",
    title: "Your Social Media Brand Kit",
    body: "10 on-brand social templates with your logo plus a full 30-day content calendar with captions and best posting times.",
    nextLabel: "Go to Video", nextTo: `${BASE}/video`,
  },
  video: {
    key: "video",
    to: `${BASE}/video`, label: "Video Generator", icon: Video, gate: "video",
    activityLabel: "Approve your video concepts",
    title: "Your Video Concepts",
    body: "10 video concepts using your onboarding, content tone, logo, and brand. Preview each and generate the ones you like.",
    nextLabel: "Go to Enhancements", nextTo: `${BASE}/enhancements`,
  },
  enhancements: {
    key: "enhancements",
    to: `${BASE}/enhancements`, label: "Enhancements", icon: Sparkles, gate: "auto",
    activityLabel: "Choose optional add-ons",
    title: "Enhance Your Package",
    body: "Browse every AI tool and add-on available for your business. Try a live, branded demo of each.",
    nextLabel: "Go to Your Designs", nextTo: `${BASE}/your-designs`,
  },
  "your-designs": {
    key: "your-designs",
    to: `${BASE}/your-designs`, label: "Your Designs", icon: LayoutTemplate, gate: "auto",
    activityLabel: "Review your finished brand package",
    title: "Your Finished Brand Package",
    body: "Everything you picked — content, logo, brand, website, social, videos — compiled here for review.",
    nextLabel: "Go to Sign Agreement", nextTo: `${BASE}/signatures`,
  },
  signatures: {
    key: "signatures",
    to: `${BASE}/signatures`, label: "Sign Agreement", icon: FileSignature, gate: "signatures",
    activityLabel: "Sign your service agreement",
    title: "Sign Your Service Agreement",
    body: "Review and sign your service agreement. In the sandbox, this step auto-completes — no real e-signature needed.",
    nextLabel: "Go to Design Approval", nextTo: `${BASE}/approvals`,
  },
  approvals: {
    key: "approvals",
    to: `${BASE}/approvals`, label: "Design Approval", icon: ShieldCheck, gate: "approvals",
    activityLabel: "Approve your website design",
    title: "Approve Your Website Design",
    body: "Review and approve your website design. In the sandbox, this step auto-completes — nothing is gated.",
    nextLabel: "Go to Launch", nextTo: `${BASE}/launch`,
  },
  launch: {
    key: "launch",
    to: `${BASE}/launch`, label: "Launch", icon: Rocket, gate: "auto",
    activityLabel: "Track your launch",
    title: "Package & Deploy",
    body: "Package your Xtreme AI build and push it separately to GitHub, Google Drive, Vercel, and Supabase. Every deployment action is logged for full transparency.",
    nextLabel: null, nextTo: null,
  },
};

// Marketing build pipeline (full with social + video)
const FULL_BUILD = [
  "welcome", "business-name", "business-profile", "content", "logo", "brand", "website",
  "social", "video", "enhancements", "your-designs", "signatures", "approvals", "launch",
];

export const PRODUCT_STUDIO_STEPS = {
  "marketing_site": FULL_BUILD,
  "web_app": FULL_BUILD,
  "ecommerce": FULL_BUILD,
  "platform": FULL_BUILD,
};

export function getStudioStepKeys(productType) {
  return PRODUCT_STUDIO_STEPS[productType] || FULL_BUILD;
}

export function getVisibleStudioSteps(productType) {
  const stepKeys = getStudioStepKeys(productType);
  const steps = stepKeys.map((key) => PORTAL_STUDIO_STEPS[key]).filter(Boolean);
  return steps.map((step, i) => {
    const next = steps[i + 1];
    return {
      ...step,
      step: i + 1,
      nextLabel: next ? `Go to ${next.label}` : null,
      nextTo: next ? next.to : null,
    };
  });
}

export function getStudioStepByPath(path) {
  return Object.values(PORTAL_STUDIO_STEPS).find((s) => s.to === path) || null;
}