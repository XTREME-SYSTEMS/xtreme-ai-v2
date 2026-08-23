// ============================================================
// CAPABILITY MAP — Competitive gap analysis against top AI platforms
// ============================================================
// This module is the single source of truth for every capability
// the system has or needs. It was built from research of the top
// AI marketing, branding, architecture, SEO, and AEO platforms:
//
//   Marketing: Gumloop, Zapier, Albert.ai, Jasper, HubSpot, Apollo,
//              ZoomInfo, Clearbit, Cognism, Mailchimp, Klaviyo
//   Branding:  Canva, Writer.com, Grammarly, Sprinklr
//   Website:   Wix, Framer, Lovable, v0, Builder.io, Chariot, 10Web
//   SEO:       Ahrefs, Semrush, BrightEdge, seoClarity, Moz, SpyFu
//   AEO/GEO:   Ayzeo, Otterly, Goodie AI, Jasper GEO
//   Social:    Buffer, Predis.ai, Sprinklr, Synthesia, Lumen5, InVideo
//   Reputation: Birdeye, Podium, Reputation.com, HiFiveStar, NiceJob
//   Programmatic SEO: Psyke, HashBuilds, LaunchMind
//
// Each capability is tagged with its competitive status so the
// recursive hardener knows what to audit and what to build.
// ============================================================

export type CapabilityStatus = "have" | "partial" | "gap" | "ingested";

export interface Capability {
  id: string;
  name: string;
  category: "marketing" | "branding" | "website" | "seo" | "aeo" | "social" | "reputation" | "lead-gen" | "analytics" | "architecture";
  status: CapabilityStatus;
  source_systems: string[]; // competitor platforms that have this
  our_function?: string; // our backend function that implements it
  description: string;
  priority: "critical" | "high" | "medium" | "low";
}

export const CAPABILITY_MAP: Capability[] = [
  // ─── MARKETING ──────────────────────────────────────────
  { id: "ad-creative-gen", name: "AI Ad Creative Generator", category: "marketing", status: "ingested", source_systems: ["Albert.ai", "Meta Ads", "Google Ads", "Predis.ai"], our_function: "generateAdCreative", description: "Generate ad copy + creative variations for Google/Meta ads from business profile", priority: "high" },
  { id: "email-sequence", name: "AI Email Sequence Builder", category: "marketing", status: "ingested", source_systems: ["Mailchimp", "Klaviyo", "HubSpot"], our_function: "buildEmailSequence", description: "Automated email drip campaigns with AI-written sequences", priority: "high" },
  { id: "marketing-automation", name: "Marketing Automation Workflows", category: "marketing", status: "have", source_systems: ["Gumloop", "Zapier"], our_function: "workflows", description: "Trigger-driven automated processes", priority: "high" },
  { id: "content-calendar", name: "AI Content Calendar", category: "marketing", status: "have", source_systems: ["Buffer", "Predis.ai", "StoryChief"], description: "Scheduled content across channels", priority: "medium" },
  { id: "marketing-mix", name: "AI Marketing Mix Modeling", category: "marketing", status: "ingested", source_systems: ["HubSpot", "Google Analytics"], our_function: "modelMarketingMix", description: "Multi-touch attribution and channel ROI modeling", priority: "medium" },
  { id: "content-repurpose", name: "AI Content Repurposing Engine", category: "marketing", status: "ingested", source_systems: ["Jasper", "Writer.com"], our_function: "repurposeContent", description: "Turn blog → social → video → email automatically", priority: "high" },

  // ─── BRANDING ───────────────────────────────────────────
  { id: "brand-voice", name: "AI Brand Voice Enforcer", category: "branding", status: "ingested", source_systems: ["Writer.com", "Grammarly", "Jasper"], our_function: "enforceBrandVoice", description: "Check content consistency against brand voice guidelines", priority: "high" },
  { id: "logo-gen", name: "AI Logo Generator", category: "branding", status: "have", source_systems: ["Canva", "Looka", "Brandmark"], our_function: "LogoGenerator", description: "10 custom logo concepts from business name", priority: "high" },
  { id: "brand-kit", name: "AI Brand Kit Generator", category: "branding", status: "have", source_systems: ["Canva", "Vista Create"], our_function: "BrandGenerator", description: "Full brand identity with mockups", priority: "high" },
  { id: "brand-consistency", name: "Brand Consistency Checker", category: "branding", status: "ingested", source_systems: ["Writer.com", "Frontify"], our_function: "enforceBrandVoice", description: "Cross-asset brand consistency validation", priority: "medium" },

  // ─── WEBSITE / ARCHITECTURE ─────────────────────────────
  { id: "ai-website-gen", name: "AI Website Generation", category: "website", status: "have", source_systems: ["Lovable", "v0", "Framer", "Wix", "Chariot"], our_function: "runWebsiteFactory", description: "Generate full websites from prompts", priority: "critical" },
  { id: "programmatic-seo", name: "Programmatic SEO at Scale", category: "website", status: "have", source_systems: ["Psyke", "HashBuilds", "LaunchMind"], our_function: "runRankEngine", description: "Generate thousands of SEO pages from templates", priority: "critical" },
  { id: "cro-optimizer", name: "AI Conversion Rate Optimizer", category: "website", status: "ingested", source_systems: ["Optimizely", "VWO", "Unbounce"], our_function: "optimizeConversionRate", description: "A/B testing recommendations and CRO analysis", priority: "high" },
  { id: "page-speed-opt", name: "AI Page Speed Optimizer", category: "website", status: "ingested", source_systems: ["Google PageSpeed", "Cloudflare"], our_function: "optimizePageSpeed", description: "Core Web Vitals analysis and fix recommendations", priority: "high" },
  { id: "internal-linking", name: "AI Internal Linking Engine", category: "website", status: "ingested", source_systems: ["Link Whisper", "Surfer SEO"], our_function: "buildInternalLinks", description: "Automated internal link building and optimization", priority: "high" },
  { id: "schema-markup", name: "AI Schema Markup Generator", category: "website", status: "ingested", source_systems: ["Schema.org", "Merkle", "Surfer SEO"], our_function: "generateSchemaMarkup", description: "Advanced structured data / JSON-LD generation", priority: "high" },

  // ─── SEO ───────────────────────────────────────────────
  { id: "tech-seo-audit", name: "Technical SEO Audit", category: "seo", status: "have", source_systems: ["BrightEdge", "seoClarity", "Ahrefs"], our_function: "runTechnicalSeoAudit", description: "Full technical SEO crawl and fix recommendations", priority: "critical" },
  { id: "content-gap", name: "Content Gap Analysis", category: "seo", status: "have", source_systems: ["Ahrefs", "Semrush"], our_function: "analyzeCompetitorGaps", description: "Identify content gaps vs competitors", priority: "high" },
  { id: "rank-tracking", name: "Rank Tracking", category: "seo", status: "have", source_systems: ["Ahrefs", "Semrush", "Rank Ranger"], our_function: "syncRankings", description: "Daily keyword position tracking", priority: "critical" },
  { id: "backlink-analysis", name: "Backlink Analysis & Outreach", category: "seo", status: "have", source_systems: ["Ahrefs", "Semrush", "Pitchbox"], our_function: "prospectBacklinks", description: "Prospect discovery and outreach automation", priority: "high" },
  { id: "keyword-cluster", name: "AI Keyword Clustering", category: "seo", status: "ingested", source_systems: ["Surfer SEO", "Keyword Insights"], our_function: "clusterKeywords", description: "Group keywords into topic clusters for content planning", priority: "high" },
  { id: "content-brief", name: "AI Content Brief Generator", category: "seo", status: "ingested", source_systems: ["Surfer SEO", "Frase", "MarketMuse"], our_function: "generateContentBrief", description: "Generate SEO-optimized content briefs for writers", priority: "high" },
  { id: "competitor-monitor", name: "AI Competitor Monitoring", category: "seo", status: "ingested", source_systems: ["Visualping", "Semrush", "SpyFu"], our_function: "monitorCompetitors", description: "Ongoing competitor tracking with change alerts", priority: "high" },
  { id: "serp-blueprint", name: "SERP Blueprint Extraction", category: "seo", status: "have", source_systems: ["BrightEdge", "seoClarity"], our_function: "extractRankingBlueprint", description: "Extract ranking factors from top SERP results", priority: "high" },

  // ─── AEO / GEO ─────────────────────────────────────────
  { id: "aeo-optimize", name: "AEO Answer Block Optimization", category: "aeo", status: "have", source_systems: ["Ayzeo", "Jasper GEO"], our_function: "optimizeAeo", description: "Optimize content for AI answer engines", priority: "critical" },
  { id: "ai-citation-track", name: "AI Citation Tracking", category: "aeo", status: "ingested", source_systems: ["Ayzeo", "Otterly", "Goodie AI"], our_function: "trackAiCitations", description: "Track brand citations in ChatGPT, Perplexity, Gemini, Copilot", priority: "critical" },
  { id: "ai-visibility", name: "AI Visibility Monitoring", category: "aeo", status: "have", source_systems: ["Ayzeo", "Otterly"], our_function: "monitorAiVisibility", description: "Monitor brand visibility across AI engines", priority: "high" },
  { id: "topic-cluster", name: "AI Topic Cluster Modeling", category: "aeo", status: "ingested", source_systems: ["HubSpot", "MarketMuse"], our_function: "clusterKeywords", description: "Topical authority modeling for AI search", priority: "high" },

  // ─── SOCIAL ─────────────────────────────────────────────
  { id: "social-gen", name: "AI Social Media Generator", category: "social", status: "have", source_systems: ["Predis.ai", "Buffer", "Sprinklr"], our_function: "generateSocialMediaPack", description: "Generate social posts with images and captions", priority: "high" },
  { id: "social-listening", name: "AI Social Listening", category: "social", status: "ingested", source_systems: ["Sprout Social", "Brandwatch", "Mention"], our_function: "monitorSocialListening", description: "Monitor brand mentions across social platforms", priority: "high" },
  { id: "video-gen", name: "AI Video Generator", category: "social", status: "have", source_systems: ["Synthesia", "Lumen5", "InVideo", "OpusClip"], our_function: "generateVideoPack", description: "Generate promo videos from text", priority: "high" },
  { id: "influencer-id", name: "AI Influencer Identification", category: "social", status: "ingested", source_systems: ["Upfluence", "AspireIQ", "Klear"], our_function: "identifyInfluencers", description: "Find relevant influencers in a niche", priority: "medium" },

  // ─── REPUTATION ─────────────────────────────────────────
  { id: "review-gen", name: "Automated Review Generation", category: "reputation", status: "have", source_systems: ["Birdeye", "Podium", "HiFiveStar"], our_function: "monthly-reviews", description: "Automated review request system", priority: "high" },
  { id: "review-response", name: "AI Review Response Generator", category: "reputation", status: "ingested", source_systems: ["Birdeye", "Reputation.com", "NiceJob"], our_function: "generateReviewResponse", description: "AI-generated replies to customer reviews", priority: "high" },
  { id: "reputation-monitor", name: "Reputation Monitoring", category: "reputation", status: "ingested", source_systems: ["Reputation.com", "ReviewTrackers"], our_function: "monitorSocialListening", description: "Monitor reviews across platforms with sentiment", priority: "medium" },

  // ─── LEAD GEN ───────────────────────────────────────────
  { id: "lead-scoring", name: "AI Lead Scoring Engine", category: "lead-gen", status: "ingested", source_systems: ["Apollo", "HubSpot", "ZoomInfo", "MadKudu"], our_function: "scoreLeads", description: "Score leads based on behavior, firmographics, intent", priority: "critical" },
  { id: "lead-enrichment", name: "AI Lead Enrichment", category: "lead-gen", status: "ingested", source_systems: ["Clearbit", "ZoomInfo", "Cognism"], our_function: "scoreLeads", description: "Enrich leads with firmographic and intent data", priority: "high" },
  { id: "prospect-discovery", name: "Prospect Discovery", category: "lead-gen", status: "have", source_systems: ["Apollo", "ZoomInfo"], our_function: "discoverHighValueDomains", description: "Discover high-value prospects and domains", priority: "high" },
  { id: "outreach-auto", name: "Automated Outreach", category: "lead-gen", status: "have", source_systems: ["Salesloft", "Outreach.io"], our_function: "sendOutreach", description: "Personalized outreach email automation", priority: "high" },

  // ─── ANALYTICS ──────────────────────────────────────────
  { id: "predictive-forecast", name: "AI Predictive Analytics", category: "analytics", status: "ingested", source_systems: ["HubSpot", "Salesforce Einstein", "Clari"], our_function: "forecastMetrics", description: "Forecast traffic, leads, and revenue", priority: "high" },
  { id: "journey-mapping", name: "AI Customer Journey Mapping", category: "analytics", status: "ingested", source_systems: ["HubSpot", "Adobe Analytics"], our_function: "analyzeCustomerJourney", description: "Map and analyze customer journeys", priority: "medium" },
  { id: "gsc-tracking", name: "GSC Traffic Tracking", category: "analytics", status: "have", source_systems: ["Google Search Console"], our_function: "submitToGSC", description: "GSC sync, indexing, and traffic tracking", priority: "high" },
  { id: "system-health", name: "System Health Scoring", category: "analytics", status: "have", source_systems: ["Datadog", "New Relic"], our_function: "computeSystemScore", description: "System health scoring and monitoring", priority: "high" },
];

// Count capabilities by status
export function getCapabilityStats() {
  const stats = { have: 0, partial: 0, gap: 0, ingested: 0, total: CAPABILITY_MAP.length };
  CAPABILITY_MAP.forEach(c => { stats[c.status] = (stats[c.status] || 0) + 1; });
  return stats;
}

// Get all ingested functions that need backend implementation
export function getIngestedFunctions() {
  return CAPABILITY_MAP.filter(c => c.status === "ingested" && c.our_function)
    .map(c => c.our_function!)
    .filter((fn, i, arr) => arr.indexOf(fn) === i); // unique
}