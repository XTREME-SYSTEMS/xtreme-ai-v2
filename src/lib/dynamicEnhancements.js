import {
  Zap, FileText, MapPin, Star, Phone, Calendar, Globe, Camera, Mail, ShoppingCart,
  Search, Shield, Megaphone, Video, MessageCircle,
} from "lucide-react";

// Enhancement catalog — a wide variety across four price tiers: free, low,
// mid, and premium. Each enhancement has a `demoType` that drives a branded
// live preview in the EnhancementDemoModal (rendered with the client's actual
// logo, brand palette, and business name so every demo matches their system).
// Industry recommendations are surfaced first and pre-selected.

export const ENHANCEMENT_TIERS = [
  { id: "free", label: "Free Included", blurb: "On the house — added to every package at no cost." },
  { id: "low", label: "Low Cost", blurb: "Quick wins under $400." },
  { id: "mid", label: "Mid Cost", blurb: "High-impact add-ons $400–$799." },
  { id: "premium", label: "Premium", blurb: "Full-service upgrades $800+." },
];

const CATALOG = [
  // ── FREE ──
  { id: "faq_page", name: "SEO FAQ Page", description: "A search-optimized FAQ page answering the top questions your customers ask, with schema markup for rich Google results.", price: 0, tier: "free", icon: FileText, demoType: "faq",
    benefits: ["Rank for 'near me' question searches", "Google rich snippet eligibility", "Reduces repetitive phone calls"],
    gradient: "from-blue-500/20 to-cyan-500/20" },
  { id: "privacy_terms", name: "Privacy & Terms Generator", description: "Auto-generated privacy policy and terms of service, customized to your business and jurisdiction.", price: 0, tier: "free", icon: Shield, demoType: "legal",
    benefits: ["GDPR & CCPA compliant", "Customized to your state", "One-click install on your site"],
    gradient: "from-emerald-500/20 to-teal-500/20" },
  { id: "contact_widget", name: "Floating Contact Widget", description: "A click-to-call and quick-message button floating on every page so customers reach you in one tap.", price: 0, tier: "free", icon: MessageCircle, demoType: "widget",
    benefits: ["One-tap calling from any page", "Quick-message form built in", "Mobile-optimized floating button"],
    gradient: "from-violet-500/20 to-purple-500/20" },

  // ── LOW COST ──
  { id: "extra_page", name: "Additional Service Page", description: "A fully-designed, SEO-optimized page for an additional service you offer.", price: 150, tier: "low", icon: FileText, demoType: "page",
    benefits: ["Targets an additional service keyword", "Matches your brand design", "SEO-optimized for local search"],
    gradient: "from-amber-500/20 to-orange-500/20" },
  { id: "call_tracking", name: "Call Tracking Number", description: "A dedicated tracking phone number with call recording and analytics to measure your lead flow.", price: 200, tier: "low", icon: Phone, demoType: "call",
    benefits: ["Track which pages generate calls", "Call recording for quality training", "Monthly call analytics report"],
    gradient: "from-green-500/20 to-emerald-500/20" },
  { id: "before_after", name: "Before/After Photo Gallery", description: "A stunning before/after gallery showcasing your work with interactive swipe sliders.", price: 250, tier: "low", icon: Camera, demoType: "gallery",
    benefits: ["Interactive swipe sliders", "Proves your work quality visually", "Mobile-optimized touch gestures"],
    gradient: "from-rose-500/20 to-pink-500/20" },
  { id: "gbp", name: "Google Business Profile Setup", description: "Complete setup and optimization of your Google Business Profile for maximum local search visibility.", price: 300, tier: "low", icon: MapPin, demoType: "gbp",
    benefits: ["Rank in Google Maps results", "Optimized business categories", "Review request integration"],
    gradient: "from-red-500/20 to-rose-500/20" },
  { id: "domain_purchase", name: "Domain Purchase (.com)", description: "We purchase and configure your chosen .com domain for you, added to your bill from the Name Studio.", price: 20, tier: "low", icon: Globe, demoType: "domain",
    benefits: ["Professional .com domain registered", "DNS configuration included", "Annual renewal managed for you"],
    gradient: "from-sky-500/20 to-blue-500/20" },

  // ── MID COST ──
  { id: "reviews", name: "Review Management System", description: "Automated review-request system that texts review links to customers after each completed job.", price: 400, tier: "mid", icon: Star, demoType: "reviews",
    benefits: ["Automated SMS review requests", "Boost your Google star rating", "Dashboard to track all reviews"],
    gradient: "from-yellow-500/20 to-amber-500/20" },
  { id: "quote_form", name: "Advanced Quote Calculator", description: "Interactive quote form that estimates project costs from square footage and materials.", price: 500, tier: "mid", icon: FileText, demoType: "quote",
    benefits: ["Qualify leads before calling", "Captures square footage & materials", "Reduces tire-kicker inquiries"],
    gradient: "from-cyan-500/20 to-blue-500/20" },
  { id: "rush", name: "Priority Rush Delivery", description: "Get your website built and launched in 3 business days instead of the standard 2-week timeline.", price: 500, tier: "mid", icon: Zap, demoType: "rush",
    benefits: ["Launch in 3 business days", "Priority queue placement", "Dedicated rush coordinator"],
    gradient: "from-amber-500/20 to-yellow-500/20" },
  { id: "booking", name: "Online Booking System", description: "Let customers book appointments directly on your website with calendar integration and reminders.", price: 600, tier: "mid", icon: Calendar, demoType: "booking",
    benefits: ["Customers self-book 24/7", "Automated SMS reminders", "Reduces no-shows by 40%"],
    gradient: "from-indigo-500/20 to-blue-500/20" },
  { id: "landing_pages", name: "Landing Page Pack (5 pages)", description: "5 high-converting landing pages for specific services or ad campaigns.", price: 600, tier: "mid", icon: Megaphone, demoType: "landing",
    benefits: ["5 dedicated campaign pages", "Optimized for paid ad traffic", "A/B test ready layouts"],
    gradient: "from-orange-500/20 to-red-500/20" },
  { id: "email_campaign", name: "Email Marketing Campaign (3 months)", description: "Monthly email newsletters to your client list with industry insights and offers.", price: 750, tier: "mid", icon: Mail, demoType: "email",
    benefits: ["3 months of newsletters", "Re-engage past customers", "Track opens & clicks"],
    gradient: "from-pink-500/20 to-rose-500/20" },
  { id: "blog_pack", name: "Blog Content Pack (10 articles)", description: "10 SEO-optimized blog articles targeting local search terms, written and ready to publish.", price: 750, tier: "mid", icon: FileText, demoType: "blog",
    benefits: ["10 locally-targeted articles", "Drives organic search traffic", "Establishes industry authority"],
    gradient: "from-teal-500/20 to-cyan-500/20" },

  // ── PREMIUM ──
  { id: "social_mgmt", name: "Social Media Management (3 months)", description: "We manage your social posting for 3 months using your generated content calendar.", price: 900, tier: "premium", icon: Calendar, demoType: "social",
    benefits: ["3 months of managed posting", "Daily content from your calendar", "Monthly engagement report"],
    gradient: "from-purple-500/20 to-indigo-500/20" },
  { id: "ecommerce", name: "E-Commerce Integration", description: "Online store with product catalog, shopping cart, and secure checkout.", price: 1200, tier: "premium", icon: ShoppingCart, demoType: "ecommerce",
    benefits: ["Full product catalog", "Secure Stripe checkout", "Inventory management dashboard"],
    gradient: "from-green-500/20 to-lime-500/20" },
  { id: "video_testimonial", name: "Video Testimonial Production", description: "Professional video testimonials with your customers, filmed and edited for your site.", price: 1200, tier: "premium", icon: Video, demoType: "video_testimonial",
    benefits: ["Professional filming & editing", "Builds instant trust", "Reusable on social media"],
    gradient: "from-red-500/20 to-orange-500/20" },
  { id: "multi_loc", name: "Multi-Location SEO (per location)", description: "Additional location pages with local SEO optimization for each service area you cover.", price: 800, tier: "premium", icon: Globe, demoType: "multi_loc",
    benefits: ["Dedicated page per location", "Rank in multiple cities", "Location-specific schema markup"],
    gradient: "from-blue-500/20 to-sky-500/20" },
];

// Industry → recommended enhancement IDs (surfaced first + pre-selected)
const INDUSTRY_RECOMMENDATIONS = {
  "home-services": ["before_after", "booking", "reviews"],
  "contracting": ["before_after", "quote_form", "reviews"],
  "professional-services": ["booking", "email_campaign", "blog_pack"],
  "retail": ["ecommerce", "reviews", "email_campaign"],
  "health-wellness": ["booking", "reviews", "email_campaign"],
  "automotive": ["before_after", "booking", "reviews"],
  "food-hospitality": ["booking", "reviews", "social_mgmt"],
};

const TIER_ORDER = { free: 0, low: 1, mid: 2, premium: 3 };

// Returns the full enhancement catalog for a given industry, with recommended
// items first, then sorted by tier (free → low → mid → premium).
export function getEnhancementsForIndustry(industry) {
  const recommended = INDUSTRY_RECOMMENDATIONS[industry] || [];
  const sorted = [...CATALOG].sort((a, b) => {
    const ar = recommended.includes(a.id) ? 0 : 1;
    const br = recommended.includes(b.id) ? 0 : 1;
    if (ar !== br) return ar - br;
    return (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9);
  });
  return sorted;
}

// Returns just the recommended enhancement IDs for an industry
export function getRecommendedEnhancementIds(industry) {
  return INDUSTRY_RECOMMENDATIONS[industry] || [];
}

export function getEnhancementById(id) {
  return CATALOG.find((e) => e.id === id);
}