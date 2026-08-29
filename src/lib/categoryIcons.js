import {
  PaintBucket, ShieldCheck, HardHat, Sparkles, Building2, Layers,
  TrendingUp, Zap, Factory, Warehouse, Wrench, Hammer, Brush,
  Boxes, Package, Home, LayoutGrid, Globe,
} from "lucide-react";

// Maps trending category names to brand-appropriate lucide icons.
// The brand accent is gold (amber-400), so callers should render the
// returned icon with `text-amber-400` to match the Xtreme AI identity.

const KEYWORD_MAP = [
  { keywords: ["epoxy", "flooring", "floor", "garage", "metallic"], icon: PaintBucket },
  { keywords: ["coating", "protective", "seal", "anti-slip", "food-grade", "chemical"], icon: ShieldCheck },
  { keywords: ["contractor", "install", "service", "repair", "resurface"], icon: HardHat },
  { keywords: ["polished", "shine", "gloss", "burnish", "densif"], icon: Sparkles },
  { keywords: ["decorative", "stamp", "overlay", "micro", "aggregate"], icon: Building2 },
  { keywords: ["concrete", "cement", "slab"], icon: Layers },
  { keywords: ["warehouse", "industrial", "commercial"], icon: Factory },
  { keywords: ["3d", "metallic"], icon: Sparkles },
  { keywords: ["web", "site", "website", "landing"], icon: Globe },
  { keywords: ["app", "application", "software"], icon: Boxes },
  { keywords: ["ecommerce", "shop", "store", "retail"], icon: Package },
  { keywords: ["platform", "marketplace", "system"], icon: LayoutGrid },
  { keywords: ["tool", "automation", "ai", "bot"], icon: Zap },
  { keywords: ["home", "residential", "house"], icon: Home },
  { keywords: ["wrench", "fix", "maintain"], icon: Wrench },
];

// If the stored icon field is a lucide-style name (kebab-case, not an emoji),
// map it directly. Otherwise fall back to keyword matching on the name.
const NAME_MAP = {
  "paint-bucket": PaintBucket,
  "shield-check": ShieldCheck,
  "hard-hat": HardHat,
  "sparkles": Sparkles,
  "building-2": Building2,
  "layers": Layers,
  "factory": Factory,
  "warehouse": Warehouse,
  "wrench": Wrench,
  "hammer": Hammer,
  "brush": Brush,
  "boxes": Boxes,
  "package": Package,
  "home": Home,
  "layout-grid": LayoutGrid,
  "globe": Globe,
  "zap": Zap,
  "trending-up": TrendingUp,
};

export function getCategoryIcon(name, storedIcon) {
  if (storedIcon && NAME_MAP[storedIcon]) return NAME_MAP[storedIcon];
  if (!name) return TrendingUp;
  const lower = name.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.icon;
  }
  return TrendingUp;
}