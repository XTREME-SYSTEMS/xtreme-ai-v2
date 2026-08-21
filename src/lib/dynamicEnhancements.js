import {
  Zap, FileText, MapPin, Star, Phone, Calendar, Globe, Camera, Mail, ShoppingCart, Search, Shield, Megaphone, Video,
} from "lucide-react";

// Base enhancements available to all industries
const BASE_ENHANCEMENTS = [
  { id: "rush", name: "Priority Rush Delivery", description: "Get your website built and launched in 3 business days instead of the standard 2-week timeline.", price: 500, icon: Zap },
  { id: "extra_page", name: "Additional Service Page", description: "Add a fully-designed, SEO-optimized page for an additional service.", price: 150, icon: FileText },
  { id: "gbp", name: "Google Business Profile Setup", description: "Complete setup and optimization of your Google Business Profile for maximum local search visibility.", price: 300, icon: MapPin },
  { id: "reviews", name: "Review Management System", description: "Automated review request system that sends review links to your customers after job completion.", price: 400, icon: Star },
  { id: "call_tracking", name: "Call Tracking Number", description: "Dedicated tracking phone number with call recording and analytics to measure your lead flow.", price: 200, icon: Phone },
  { id: "social_mgmt", name: "Social Media Management (3 months)", description: "We manage your social media posting for 3 months using your generated content calendar.", price: 900, icon: Calendar },
];

// Industry-specific enhancements — these are RECOMMENDED based on the client's industry
const INDUSTRY_ENHANCEMENTS = {
  "home-services": [
    { id: "before_after", name: "Before/After Photo Gallery", description: "Showcase your work with a stunning before/after photo gallery on your website.", price: 250, icon: Camera, recommended: true },
    { id: "booking", name: "Online Booking System", description: "Let customers book appointments directly on your website with calendar integration.", price: 600, icon: Calendar, recommended: true },
    { id: "multi_loc", name: "Multi-Location SEO (per location)", description: "Additional location pages with local SEO optimization for each service area you cover.", price: 600, icon: MapPin },
  ],
  "contracting": [
    { id: "before_after", name: "Project Portfolio Gallery", description: "Showcase completed projects with photos, descriptions, and project details.", price: 350, icon: Camera, recommended: true },
    { id: "quote_form", name: "Advanced Quote Calculator", description: "Interactive quote form that estimates project costs based on square footage and materials.", price: 500, icon: FileText, recommended: true },
    { id: "multi_loc", name: "Multi-Location SEO (per location)", description: "Additional location pages with local SEO optimization for each service area.", price: 600, icon: MapPin },
  ],
  "professional-services": [
    { id: "appointment", name: "Online Appointment Scheduling", description: "Clients book consultations directly on your website with automated reminders.", price: 500, icon: Calendar, recommended: true },
    { id: "intake", name: "Client Intake Forms", description: "Custom online intake forms that capture client info before your first consultation.", price: 350, icon: FileText, recommended: true },
    { id: "email_campaign", name: "Email Marketing Campaign (3 months)", description: "Monthly email newsletters to your client list with industry insights and offers.", price: 750, icon: Mail },
  ],
  "retail": [
    { id: "ecommerce", name: "E-Commerce Integration", description: "Online store with product catalog, shopping cart, and secure checkout.", price: 1200, icon: ShoppingCart, recommended: true },
    { id: "inventory", name: "Inventory Sync System", description: "Real-time inventory sync between your website and POS system.", price: 600, icon: Search },
    { id: "loyalty", name: "Loyalty Program Integration", description: "Digital loyalty program that rewards repeat customers and drives referrals.", price: 400, icon: Star },
  ],
  "health-wellness": [
    { id: "booking", name: "Online Booking System", description: "Let clients book appointments with calendar sync and automated reminders.", price: 600, icon: Calendar, recommended: true },
    { id: "hipaa", name: "HIPAA-Compliant Contact Forms", description: "Secure, encrypted contact and intake forms for healthcare practices.", price: 450, icon: Shield, recommended: true },
    { id: "wellness_blog", name: "Wellness Blog Pack (10 articles)", description: "10 SEO-optimized wellness articles targeting local health searches.", price: 750, icon: FileText },
  ],
  "automotive": [
    { id: "service_menu", name: "Digital Service Menu", description: "Interactive service menu with pricing, descriptions, and online booking.", price: 400, icon: FileText, recommended: true },
    { id: "vehicle_gallery", name: "Vehicle Showcase Gallery", description: "Photo gallery showcasing vehicles, before/after results, and specialty services.", price: 300, icon: Camera },
    { id: "parts_catalog", name: "Parts & Accessories Catalog", description: "Online catalog of parts and accessories with inquiry forms.", price: 800, icon: ShoppingCart },
  ],
  "food-hospitality": [
    { id: "menu_online", name: "Digital Menu Integration", description: "Your menu displayed beautifully online with photos, prices, and dietary info.", price: 400, icon: FileText, recommended: true },
    { id: "reservations", name: "Online Reservation System", description: "Table booking and reservation management directly on your website.", price: 600, icon: Calendar, recommended: true },
    { id: "ordering", name: "Online Ordering System", description: "Take orders directly from your website with pickup and delivery options.", price: 900, icon: ShoppingCart },
  ],
};

// Blog pack is universal
const UNIVERSAL_ENHANCEMENTS = [
  { id: "blog_pack", name: "Blog Content Pack (10 articles)", description: "10 SEO-optimized blog articles targeting local search terms, written and ready to publish.", price: 750, icon: FileText },
  { id: "video_testimonial", name: "Video Testimonial Production", description: "Professional video testimonials with your customers, edited and ready for your site.", price: 1200, icon: Video },
  { id: "landing_pages", name: "Landing Page Pack (5 pages)", description: "5 high-converting landing pages for specific services or ad campaigns.", price: 600, icon: Megaphone },
];

// Returns the full enhancement catalog for a given industry, with recommended
// items first, then industry-specific, then universal, then base.
export function getEnhancementsForIndustry(industry) {
  const industrySpecific = INDUSTRY_ENHANCEMENTS[industry] || [];
  const recommended = [...industrySpecific].filter((e) => e.recommended);
  const rest = [...industrySpecific].filter((e) => !e.recommended);

  // Recommended first, then industry-specific non-recommended, then base, then universal
  const all = [
    ...recommended,
    ...rest,
    ...BASE_ENHANCEMENTS,
    ...UNIVERSAL_ENHANCEMENTS,
  ];

  // Deduplicate by id
  const seen = new Set();
  return all.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

// Returns just the recommended enhancement IDs for an industry
export function getRecommendedEnhancementIds(industry) {
  const industrySpecific = INDUSTRY_ENHANCEMENTS[industry] || [];
  return industrySpecific.filter((e) => e.recommended).map((e) => e.id);
}