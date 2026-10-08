// ─────────────────────────────────────────────────────────────────────────
// ONBOARDING CARD DATA
// The 4 category cards on the Business Generator page. Each card contains
// a set of questions designed to collect enough information about the person,
// their vision, their business, and their content preferences to:
//   1. Skip-trace the person and their business
//   2. Instruct GPT on the exact style of business and website to build
//   3. Guide the user toward profitable, wealth-building niches
//   4. Enable mass deployment of hundreds/thousands of websites
//   5. Power a fully automated social media system
//
// The combined answers are sent to the vision discovery + strategy
// generation pipeline, which produces the brief GPT uses to build sites.
// ─────────────────────────────────────────────────────────────────────────

export const ONBOARDING_CARDS = [
  // ── CARD 1: VISION GENERATOR ──────────────────────────────────────────
  {
    id: "vision",
    title: "Vision Generator",
    icon: "Eye",
    color: { ring: "border-emerald-400", bg: "bg-emerald-400/10", text: "text-emerald-400", solid: "bg-emerald-400 text-white" },
    subtitle: "Who you are & what you're building",
    description: "Tell us about yourself and your dream. We skip-trace your background and research your vision to build the perfect strategy.",
    questions: [
      {
        key: "full_name",
        label: "Your full name",
        placeholder: "e.g. John Smith",
        hint: "We research your background, experience, and public profiles.",
        type: "text",
        skipTrace: true,
      },
      {
        key: "background_experience",
        label: "Your professional background",
        placeholder: "e.g. 10 years in construction, epoxy flooring contractor, marketing agency owner...",
        hint: "Your experience shapes the business types we recommend.",
        type: "text",
        skipTrace: true,
      },
      {
        key: "vision_statement",
        label: "Describe your vision in one sentence",
        placeholder: "I want to build a network of epoxy flooring websites that generate passive income across 50 cities...",
        hint: "This is the seed. Everything flows from this one sentence.",
        type: "textarea",
        skipTrace: true,
      },
      {
        key: "business_type",
        label: "What type of business draws you?",
        type: "choice",
        options: [
          { value: "local_service", label: "Local Service Empire", desc: "Multiple city sites for the same service (flooring, HVAC, roofing)" },
          { value: "ecommerce", label: "E-Commerce Store", desc: "Physical products, dropshipping, or print-on-demand" },
          { value: "saas", label: "SaaS / Software", desc: "Recurring revenue software product" },
          { value: "content_media", label: "Content / Media Site", desc: "Blog, newsletter, or media site monetized with ads/affiliate" },
          { value: "lead_gen", label: "Lead Generation", desc: "Generate and sell leads to local businesses" },
          { value: "affiliate", label: "Affiliate Marketing", desc: "Review/comparison sites that earn affiliate commissions" },
        ],
        hint: "Each type has different profit potential and scalability.",
      },
      {
        key: "dream_outcome",
        label: "What's your dream outcome?",
        type: "choice",
        options: [
          { value: "passive_income", label: "Passive Income for Life", desc: "Set it and forget it — income that runs itself" },
          { value: "build_sell", label: "Build & Sell", desc: "Build a valuable business and sell it in 2-5 years" },
          { value: "lifestyle", label: "Lifestyle Business", desc: "Replace your job with a business you enjoy running" },
          { value: "empire", label: "Build an Empire", desc: "Scale to $1M+/year and dominate a market" },
        ],
        hint: "This determines how aggressive or conservative your strategy is.",
      },
      {
        key: "time_commitment",
        label: "How many hours per week can you commit?",
        type: "choice",
        options: [
          { value: "1-5", label: "1-5 hours (mostly hands-off)" },
          { value: "5-10", label: "5-10 hours (part-time)" },
          { value: "10-20", label: "10-20 hours (serious side hustle)" },
          { value: "20+", label: "20+ hours (full-time focus)" },
        ],
        hint: "More time = faster results, but the system is designed to be automated.",
      },
    ],
  },

  // ── CARD 2: STRATEGY BLUEPRINT ────────────────────────────────────────
  {
    id: "strategy",
    title: "Strategy Blueprint",
    icon: "Brain",
    color: { ring: "border-amber-400", bg: "bg-amber-400/10", text: "text-amber-400", solid: "bg-amber-400 text-white" },
    subtitle: "Market, niche & competitive edge",
    description: "Pick a profitable niche, define your competitive advantage, and set your scale target. We research the market and validate your strategy.",
    questions: [
      {
        key: "industry_niche",
        label: "What industry or niche interests you?",
        placeholder: "e.g. Epoxy flooring, solar installation, HVAC, roofing, landscaping...",
        hint: "Browse the Profitable Niche Intelligence below for data-backed suggestions.",
        type: "text",
        skipTrace: true,
      },
      {
        key: "competitive_advantage",
        label: "What's your unique advantage or angle?",
        placeholder: "e.g. 15 years experience, proprietary technique, fastest turnaround, luxury positioning...",
        hint: "We validate this against the competitive landscape.",
        type: "text",
        skipTrace: true,
      },
      {
        key: "target_customer",
        label: "Who is your ideal customer?",
        placeholder: "e.g. Homeowners with garages, commercial property managers, new home builders...",
        hint: "We research your target demographic and their buying behavior.",
        type: "text",
        skipTrace: true,
      },
      {
        key: "monthly_budget",
        label: "What's your monthly budget for this venture?",
        type: "choice",
        options: [
          { value: "0-500", label: "$0 - $500/month (bootstrap)" },
          { value: "500-2000", label: "$500 - $2,000/month" },
          { value: "2000-5000", label: "$2,000 - $5,000/month" },
          { value: "5000+", label: "$5,000+/month (aggressive growth)" },
        ],
        hint: "This determines how many sites we can deploy and how fast.",
      },
      {
        key: "scale_target",
        label: "How many websites do you want to build?",
        type: "choice",
        options: [
          { value: "1-5", label: "1-5 sites (focused)" },
          { value: "10-50", label: "10-50 sites (regional)" },
          { value: "100-500", label: "100-500 sites (national)" },
          { value: "1000+", label: "1,000+ sites (empire)" },
        ],
        hint: "More sites = more passive income streams, but each needs its own city/niche.",
      },
      {
        key: "revenue_model",
        label: "How do you want to make money?",
        type: "choice",
        options: [
          { value: "lead_gen", label: "Lead Generation", desc: "Generate leads and sell them to local businesses" },
          { value: "direct_service", label: "Direct Service Revenue", desc: "Customers book your service through the site" },
          { value: "affiliate", label: "Affiliate Commissions", desc: "Refer traffic and earn commissions" },
          { value: "advertising", label: "Ad Revenue", desc: "Monetize traffic with display ads" },
          { value: "subscription", label: "Subscription / SaaS", desc: "Recurring monthly revenue" },
          { value: "hybrid", label: "Hybrid (multiple streams)", desc: "Combine several revenue models" },
        ],
        hint: "Each model has different margins and scalability.",
      },
      {
        key: "target_cities",
        label: "What cities or regions do you want to target?",
        placeholder: "e.g. Phoenix AZ, Dallas TX, Miami FL — or 'top 50 US cities' for mass deployment",
        hint: "We research demand, competition, and pricing in each market.",
        type: "text",
        skipTrace: true,
      },
    ],
  },

  // ── CARD 3: BUSINESS PROFILES ─────────────────────────────────────────
  {
    id: "business",
    title: "Business Profiles",
    icon: "Building2",
    color: { ring: "border-cyan-400", bg: "bg-cyan-400/10", text: "text-cyan-400", solid: "bg-cyan-400 text-white" },
    subtitle: "Brand identity & business style",
    description: "Define your business name, brand personality, and visual style. This is what GPT uses to design every website in your empire.",
    questions: [
      {
        key: "business_name",
        label: "Business name (or let AI generate one)",
        placeholder: "e.g. Xtreme Polishing Systems — or leave blank for AI suggestions",
        hint: "We check domain availability and trademark conflicts.",
        type: "text",
        skipTrace: true,
      },
      {
        key: "brand_personality",
        label: "What's your brand personality?",
        type: "choice",
        options: [
          { value: "professional", label: "Professional & Trustworthy", desc: "Clean, corporate, authoritative" },
          { value: "friendly", label: "Friendly & Approachable", desc: "Warm, welcoming, down-to-earth" },
          { value: "luxury", label: "Luxury & Premium", desc: "High-end, exclusive, sophisticated" },
          { value: "bold", label: "Bold & Energetic", desc: "Striking, confident, attention-grabbing" },
          { value: "minimal", label: "Minimal & Modern", desc: "Clean lines, lots of whitespace, understated" },
          { value: "playful", label: "Playful & Fun", desc: "Colorful, quirky, memorable" },
        ],
        hint: "This drives logo, color, and website design choices.",
      },
      {
        key: "brand_colors",
        label: "Color preference (or let AI choose)",
        type: "choice",
        options: [
          { value: "auto", label: "Let AI choose (recommended)" },
          { value: "blue", label: "Blue (trust, professional)" },
          { value: "green", label: "Green (growth, eco)" },
          { value: "red", label: "Red (energy, bold)" },
          { value: "black_gold", label: "Black & Gold (luxury)" },
          { value: "orange", label: "Orange (friendly, warm)" },
        ],
        hint: "Colors affect conversion rates and brand perception.",
      },
      {
        key: "services_offered",
        label: "What services or products will you offer?",
        placeholder: "e.g. Metallic epoxy, flake systems, polished concrete, crack repair...",
        hint: "List everything — we research pricing and demand for each.",
        type: "textarea",
        skipTrace: true,
      },
      {
        key: "price_positioning",
        label: "Where do you position on price?",
        type: "choice",
        options: [
          { value: "budget", label: "Budget / Value", desc: "Lowest prices, high volume" },
          { value: "midmarket", label: "Mid-Market", desc: "Competitive prices, good value" },
          { value: "premium", label: "Premium", desc: "Higher prices, better quality" },
          { value: "luxury", label: "Luxury", desc: "Top of market, exclusive clientele" },
        ],
        hint: "Premium positioning often means higher margins with fewer clients.",
      },
      {
        key: "differentiator",
        label: "What makes this business different from competitors?",
        placeholder: "e.g. 24/7 emergency service, lifetime warranty, proprietary process...",
        hint: "This becomes your core marketing message on every site.",
        type: "text",
        skipTrace: true,
      },
    ],
  },

  // ── CARD 4: CONTENT GENERATOR ────────────────────────────────────────
  {
    id: "content",
    title: "Content Generator",
    icon: "MessageSquareText",
    color: { ring: "border-violet-400", bg: "bg-violet-400/10", text: "text-violet-400", solid: "bg-violet-400 text-white" },
    subtitle: "Voice, social media & automation",
    description: "Define your content voice, social media platforms, and automation preferences. This powers the fully automated social media system across all your websites.",
    questions: [
      {
        key: "content_tone",
        label: "What tone should your content have?",
        type: "choice",
        options: [
          { value: "professional", label: "Professional & Authoritative", desc: "Expert voice, industry authority" },
          { value: "conversational", label: "Conversational & Friendly", desc: "Like talking to a knowledgeable friend" },
          { value: "energetic", label: "Energetic & Motivational", desc: "High energy, inspiring, action-driven" },
          { value: "educational", label: "Educational & Informative", desc: "Teach the reader, build trust" },
          { value: "luxury", label: "Luxury & Aspirational", desc: "Sophisticated, exclusive, premium" },
          { value: "humorous", label: "Humorous & Entertaining", desc: "Fun, memorable, shareable" },
        ],
        hint: "We write all website copy and social posts in this voice.",
      },
      {
        key: "social_platforms",
        label: "Which social media platforms do you want?",
        type: "multi",
        options: [
          { value: "instagram", label: "Instagram" },
          { value: "tiktok", label: "TikTok" },
          { value: "youtube", label: "YouTube" },
          { value: "facebook", label: "Facebook" },
          { value: "linkedin", label: "LinkedIn" },
          { value: "x", label: "X (Twitter)" },
        ],
        hint: "We create and automate content for each platform you select.",
      },
      {
        key: "content_topics",
        label: "What topics should your content cover?",
        placeholder: "e.g. Before/after transformations, how-to guides, industry tips, customer stories...",
        hint: "We generate a 30-day content calendar from these topics.",
        type: "textarea",
        skipTrace: true,
      },
      {
        key: "video_style",
        label: "What video style do you prefer?",
        type: "choice",
        options: [
          { value: "educational", label: "Educational / How-To", desc: "Teach the viewer something useful" },
          { value: "showcase", label: "Showcase / Before-After", desc: "Show transformations and results" },
          { value: "promotional", label: "Promotional / Ads", desc: "Drive action and bookings" },
          { value: "behind_scenes", label: "Behind the Scenes", desc: "Show the process and personality" },
          { value: "testimonial", label: "Customer Testimonials", desc: "Social proof and reviews" },
        ],
        hint: "We generate video concepts in this style for each site.",
      },
      {
        key: "automation_level",
        label: "How automated do you want this?",
        type: "choice",
        options: [
          { value: "fully", label: "Fully Automated (recommended)", desc: "Set it once, never touch it again" },
          { value: "semi", label: "Semi-Automated", desc: "Auto-generate, you approve before posting" },
          { value: "manual", label: "Manual Control", desc: "Generate suggestions, you post everything" },
        ],
        hint: "Fully automated means the system creates and posts content on a schedule.",
      },
      {
        key: "topics_to_avoid",
        label: "Any topics or content to avoid?",
        placeholder: "e.g. Politics, controversial topics, competitor names...",
        hint: "We filter these out of all generated content.",
        type: "text",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// PROFITABLE NICHE INTELLIGENCE
// Data-backed information about high-profit niches to guide the user toward
// wealth-building business choices. Shown as an expandable advisory section
// within the Strategy Blueprint card.
// ─────────────────────────────────────────────────────────────────────────

export const NICHE_INTELLIGENCE = [
  {
    category: "Local Service Empires",
    icon: "Building2",
    niches: [
      {
        name: "Epoxy / Concrete Flooring",
        profitMargin: "60-75%",
        avgTicket: "$3,500 - $8,000",
        scalability: "Very High",
        competition: "Medium",
        why: "High ticket, low material cost, repeatable process. One site per city = instant local dominance. Lead gen sites can sell leads for $50-150 each.",
        bestFor: "mass_deploy",
      },
      {
        name: "HVAC Services",
        profitMargin: "40-55%",
        avgTicket: "$4,000 - $12,000",
        scalability: "Very High",
        competition: "High",
        why: "Essential service, high emergency demand, recurring maintenance contracts. Lead gen sites in this space earn $75-200 per lead.",
        bestFor: "lead_gen",
      },
      {
        name: "Roofing",
        profitMargin: "35-50%",
        avgTicket: "$6,000 - $15,000",
        scalability: "Very High",
        competition: "High",
        why: "Insurance-funded jobs mean reliable payment. High ticket = high lead value ($100-300 per lead). Storm damage creates spikes.",
        bestFor: "lead_gen",
      },
      {
        name: "Solar Installation",
        profitMargin: "20-40%",
        avgTicket: "$15,000 - $35,000",
        scalability: "High",
        competition: "Very High",
        why: "Massive growth market with tax incentives. Very high ticket = very high lead value ($200-500 per lead).",
        bestFor: "lead_gen",
      },
      {
        name: "Landscaping / Hardscaping",
        profitMargin: "50-65%",
        avgTicket: "$2,000 - $25,000",
        scalability: "High",
        competition: "Medium",
        why: "Recurring maintenance contracts + high-ticket installs. Low barrier to entry but strong local SEO wins big.",
        bestFor: "direct_service",
      },
      {
        name: "Pressure Washing",
        profitMargin: "70-85%",
        avgTicket: "$300 - $2,500",
        scalability: "Very High",
        competition: "Low",
        why: "Extremely low overhead, high margin. Easy to scale across cities. Great for mass deployment of lead gen sites.",
        bestFor: "mass_deploy",
      },
    ],
  },
  {
    category: "Digital / Scalable Businesses",
    icon: "Monitor",
    niches: [
      {
        name: "Affiliate Review Sites",
        profitMargin: "80-95%",
        avgTicket: "Variable",
        scalability: "Very High",
        competition: "High",
        why: "Pure content play — write once, earn forever. Build sites around product categories, rank in Google, earn affiliate commissions. No inventory, no service delivery.",
        bestFor: "affiliate",
      },
      {
        name: "Local Directory Sites",
        profitMargin: "85-95%",
        avgTicket: "$50 - $500/mo",
        scalability: "Very High",
        competition: "Medium",
        why: "Build a directory for a niche + city, charge businesses to list. Recurring revenue, fully automated, scales infinitely across cities and niches.",
        bestFor: "subscription",
      },
      {
        name: "Niche Comparison Sites",
        profitMargin: "85-95%",
        avgTicket: "Variable",
        scalability: "Very High",
        competition: "Medium",
        why: "Compare services/products in a niche (insurance, software, contractors). Earn referral commissions. High-intent traffic converts well.",
        bestFor: "affiliate",
      },
      {
        name: "AI Tool Directories",
        profitMargin: "80-95%",
        avgTicket: "$50 - $500/mo",
        scalability: "Very High",
        competition: "Low",
        why: "Fast-growing market. List AI tools, charge for featured placement. Low competition right now = first-mover advantage.",
        bestFor: "subscription",
      },
    ],
  },
  {
    category: "High-Margin Services",
    icon: "Wrench",
    niches: [
      {
        name: "Junk Removal",
        profitMargin: "60-75%",
        avgTicket: "$200 - $800",
        scalability: "Very High",
        competition: "Low",
        why: "Low skill barrier, simple to operate, easy to franchise across cities. Great for mass lead gen sites.",
        bestFor: "mass_deploy",
      },
      {
        name: "Tree Service",
        profitMargin: "45-60%",
        avgTicket: "$500 - $5,000",
        scalability: "High",
        competition: "Medium",
        why: "Emergency demand after storms, high ticket, insurance-funded. Lead gen sites earn $75-200 per lead.",
        bestFor: "lead_gen",
      },
      {
        name: "Pest Control",
        profitMargin: "50-70%",
        avgTicket: "$250 - $600 initial, $40-80/mo",
        scalability: "Very High",
        competition: "Medium",
        why: "Recurring revenue model — initial treatment + monthly maintenance. Perfect for subscription-style lead gen.",
        bestFor: "lead_gen",
      },
      {
        name: "Window Cleaning",
        profitMargin: "75-90%",
        avgTicket: "$150 - $500",
        scalability: "Very High",
        competition: "Low",
        why: "Very low overhead, recurring commercial contracts, easy to scale. Perfect for mass city deployment.",
        bestFor: "mass_deploy",
      },
    ],
  },
];

// Wealth-building summary shown at the top of the niche intelligence section
export const NICHE_SUMMARY = {
  title: "Profitable Niche Intelligence",
  intro: "Not all businesses are created equal. These niches are selected for high profit margins, scalability, and passive income potential. The system can deploy hundreds of sites across these niches — each one a separate income stream.",
  keyInsights: [
    "Local service niches with high ticket values ($3,000+) are best for mass deployment — each city gets its own site",
    "Lead generation sites earn passive income by selling leads to local businesses — no service delivery needed",
    "Affiliate and directory sites have 80-95% margins and scale infinitely with zero inventory",
    "Recurring revenue models (subscriptions, maintenance contracts) compound into true passive income",
    "The system can deploy 100+ sites across these niches in under an hour — each targeting a different city",
  ],
};