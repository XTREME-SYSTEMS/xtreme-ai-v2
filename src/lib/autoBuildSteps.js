import {
  Building2, Compass, MessageSquareText, PenTool, Shirt,
  Palette, Share2, Video, CheckCircle, Loader2, AlertCircle,
} from "lucide-react";

// Auto Builder pipeline — mirrors the client portal steps exactly so the
// admin can walk through the same journey a client does, improve on it,
// and eventually flip on auto_advance for autonomous execution.
export const AUTO_BUILD_STEPS = [
  {
    key: "profile",
    label: "Business Profile",
    icon: Building2,
    description: "Business name, industry, services, service area — the input that feeds every downstream generator.",
    activityLabel: "Set up business profile",
  },
  {
    key: "names",
    label: "Business Names",
    icon: Compass,
    description: "AI generates 20 business name ideas with viral scoring and domain availability.",
    activityLabel: "Generate business name ideas",
  },
  {
    key: "content",
    label: "Content",
    icon: MessageSquareText,
    description: "AI writes 10 content tone templates — hero, about, services, FAQ copy variations.",
    activityLabel: "Generate content templates",
  },
  {
    key: "logo",
    label: "Logo",
    icon: PenTool,
    description: "AI generates 10 logo concepts with transparent backgrounds, multiple styles.",
    activityLabel: "Generate logo concepts",
  },
  {
    key: "brand",
    label: "Brand",
    icon: Shirt,
    description: "AI generates 10 brand mockups — business cards, brochure, apparel, van wrap, signage.",
    activityLabel: "Generate brand mockups",
  },
  {
    key: "website",
    label: "Website",
    icon: Palette,
    description: "AI writes website copy + generates project imagery + design layouts.",
    activityLabel: "Generate website content & design",
  },
  {
    key: "social",
    label: "Social Media",
    icon: Share2,
    description: "AI generates social templates + 30-day content calendar with captions.",
    activityLabel: "Generate social media pack",
  },
  {
    key: "video",
    label: "Video",
    icon: Video,
    description: "AI generates 10 video concepts using the brand, content, and industry context.",
    activityLabel: "Generate video concepts",
  },
  {
    key: "review",
    label: "Review",
    icon: CheckCircle,
    description: "Compile all generated assets and mark the build complete.",
    activityLabel: "Compile & finalize",
  },
];

export const STEP_KEYS = AUTO_BUILD_STEPS.map((s) => s.key);

export function getStep(key) {
  return AUTO_BUILD_STEPS.find((s) => s.key === key) || null;
}

export function getNextStep(key) {
  const idx = STEP_KEYS.indexOf(key);
  if (idx < 0 || idx >= STEP_KEYS.length - 1) return null;
  return AUTO_BUILD_STEPS[idx + 1];
}

export function getStepIndex(key) {
  return STEP_KEYS.indexOf(key);
}

export function stepStatus(build, stepKey) {
  if (!build) return "pending";
  const visited = build.visited_steps || [];
  const current = build.current_step;
  const idx = STEP_KEYS.indexOf(stepKey);
  const currentIdx = STEP_KEYS.indexOf(current);
  if (visited.includes(stepKey)) return "done";
  if (stepKey === current) return "current";
  if (idx < currentIdx) return "done";
  return "pending";
}