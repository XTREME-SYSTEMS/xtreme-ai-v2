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
  { id: "faq_page", name: "SEO FAQ Page", description: "A search-optimized FAQ page answering the top questions your customers ask, with schema markup for rich Google results.", price: 0, tier: "free", icon: FileText, demoType: "faq" },
  { id: "privacy_terms", name: "Privacy & Terms Generator", description: "Auto-generated privacy policy and terms of service, customized to your business and jurisdiction.", price: 0, tier: "free", icon: Shield, demoType: "legal" },
  { id: "contact_widget", name: "Floating Contact Widget", description: "A click-to-call and quick-message button floating on every page so customers reach you in one tap.", price: 0, tier: "free", icon: MessageCircle, demoType: "widget" },

  // ── LOW COST ──
  { id: "extra_page", name: "Additional Service Page", description: "A fully-designed, SEO-optimized page for an additional service you offer.", price: 150, tier: "low", icon: FileText, demoType: "page" },
  { id: "call_tracking", name: "Call Tracking Number", description: "A dedicated tracking phone number with call recording and analytics to measure your lead flow.", price: 200, tier: "low", icon: Phone, demoType: "call" },
  { id: "before_after", name: "Before/After Photo Gallery", description: "A stunning before/after gallery showcasing your work with interactive swipe sliders.", price: 250, tier: "low", icon: Camera, demoType: "gallery" },
  { id: "gbp", name: "Google Business Profile Setup", description: "Complete setup and optimization of your Google Business Profile for maximum local search visibility.", price: 300, tier: "low", icon: MapPin, demoType: "gbp" },

  // ── MID COST ──
  { id: "reviews", name: "Review Management System", description: "Automated review-request system that texts review links to customers after each completed job.", price: 400, tier: "mid", icon: Star, demoType: "reviews" },
  { id: "quote_form", name: "Advanced Quote Calculator", description: "Interactive quote form that estimates project costs from square footage and materials.", price: 500, tier: "mid", icon: FileText, demoType: "quote" },
  { id: "rush", name: "Priority Rush Delivery", description: "Get your website built and launched in 3 business days instead of the standard 2-week timeline.", price: 500, tier: "mid", icon: Zap, demoType: "rush" },
  { id: "booking", name: "Online Booking System", description: "Let customers book appointments directly on your website with calendar integration and reminders.", price: 600, tier: "mid", icon: Calendar, demoType: "booking" },
  { id: "landing_pages", name: "Landing Page Pack (5 pages)", description: "5 high-converting landing pages for specific services or ad campaigns.", price: 600, tier: "mid", icon: Megaphone, demoType: "landing" },
  { id: "email_campaign", name: "Email Marketing Campaign (3 months)", description: "Monthly email newsletters to your client list with industry insights and offers.", price: 750, tier: "mid", icon: Mail, demoType: "email" },
  { id: "blog_pack", name: "Blog Content Pack (10 articles)", description: "10 SEO-optimized blog articles targeting local search terms, written and ready to publish.", price: 750, tier: "mid", icon: FileText, demoType: "blog" },

  // ── PREMIUM ──
  { id: "social_mgmt", name: "Social Media Management (3 months)", description: "We manage your social posting for 3 months using your generated content calendar.", price: 900, tier: "premium", icon: Calendar, demoType: "social" },
  { id: "ecommerce", name: "E-Commerce Integration", description: "Online store with product catalog, shopping cart, and secure checkout.", price: 1200, tier: "premium", icon: ShoppingCart, demoType: "ecommerce" },
  { id: "video_testimonial", name: "Video Testimonial Production", description: "Professional video testimonials with your customers, filmed and edited for your site.", price: 1200, tier: "premium", icon: Video, demoType: "video_testimonial" },
  { id: "multi_loc", name: "Multi-Location SEO (per location)", description: "Additional location pages with local SEO optimization for each service area you cover.", price: 800, tier: "premium", icon: Globe, demoType: "multi_loc" },
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