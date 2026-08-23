// visionCortexFramework.ts — Shared Vision Cortex logic.
// Source definitions for Browserbase scraping + the YC 10-key-question
// scoring framework + exhaustive summary generation.
//
// Used by:
// - visionCortexDiscover (scrape sources → 50 raw ideas)
// - visionCortexValidate (score with YC framework → pick top 10 → generate exhaustive summaries)
// - visionCortexProvision (provision top idea into AutoBuild)

// ============================================================
// SOURCE DEFINITIONS — where Vision Cortex scrapes for ideas
// ============================================================
// Each source has a URL and a scrape prompt that tells the LLM
// what to look for. The scraper fetches the page content, then
// the LLM extracts ideas from it.

export interface VisionSource {
  id: string;
  label: string;
  url: string;
  category: 'social' | 'forum' | 'ai_platform' | 'app_directory' | 'idea_site' | 'trend' | 'elite';
  scrape_prompt: string;
}

export const VISION_SOURCES: VisionSource[] = [
  {
    id: 'reddit_somebodymakethis',
    label: 'Reddit: r/SomebodyMakeThis',
    url: 'https://www.reddit.com/r/SomebodyMakeThis/top/?t=week',
    category: 'forum',
    scrape_prompt: 'Find posts where users are requesting apps, tools, or websites to be built. These are direct idea requests from people who want a solution.',
  },
  {
    id: 'reddit_Entrepreneur',
    label: 'Reddit: r/Entrepreneur',
    url: 'https://www.reddit.com/r/Entrepreneur/top/?t=week',
    category: 'forum',
    scrape_prompt: 'Find discussions about business problems, gaps in the market, tools people wish existed, and startup ideas being discussed.',
  },
  {
    id: 'reddit_SaaS',
    label: 'Reddit: r/SaaS',
    url: 'https://www.reddit.com/r/SaaS/top/?t=week',
    category: 'forum',
    scrape_prompt: 'Find SaaS startup ideas, pain points SaaS founders discuss, tools they wish they had, and market gaps in the SaaS space.',
  },
  {
    id: 'reddit_smallbusiness',
    label: 'Reddit: r/smallbusiness',
    url: 'https://www.reddit.com/r/smallbusiness/top/?t=week',
    category: 'forum',
    scrape_prompt: 'Find problems small business owners complain about — software gaps, operational pain points, tools they need but do not have.',
  },
  {
    id: 'producthunt',
    label: 'Product Hunt: Latest',
    url: 'https://www.producthunt.com/',
    category: 'app_directory',
    scrape_prompt: 'Find newly launched products and identify gaps — what is missing, what adjacent ideas could be built, what problems are not yet solved by these products.',
  },
  {
    id: 'hackernews_front',
    label: 'Hacker News: Front Page',
    url: 'https://news.ycombinator.com/',
    category: 'forum',
    scrape_prompt: 'Find trending tech discussions, problems developers and founders are discussing, new technologies that enable new products, and startup ideas from comments.',
  },
  {
    id: 'hackernews_show',
    label: 'Hacker News: Show HN',
    url: 'https://news.ycombinator.com/show',
    category: 'forum',
    scrape_prompt: 'Find newly built projects by developers — identify what problems they solve and what adjacent or improved versions could be built.',
  },
  {
    id: 'ai_tools_directory',
    label: 'AI Tools Directory',
    url: 'https://www.producthunt.com/categories/artificial-intelligence',
    category: 'ai_platform',
    scrape_prompt: 'Find trending AI tools and identify gaps — what AI applications are missing, what problems could be solved with AI that no one has built yet.',
  },
  {
    id: 'google_trends_tech',
    label: 'Google Trends: Technology',
    url: 'https://trends.google.com/trends/explore?cat=5',
    category: 'trend',
    scrape_prompt: 'Find trending technology topics and identify product opportunities riding these trends.',
  },
  {
    id: 'indiehackers',
    label: 'Indie Hackers: Latest',
    url: 'https://www.indiehackers.com/',
    category: 'idea_site',
    scrape_prompt: 'Find indie startup ideas, problems indie founders are solving, and gaps in the market they discuss.',
  },
  {
    id: 'autonomous_systems_hn',
    label: 'HN: AI & Autonomous SaaS',
    url: 'https://hn.algolia.com/?q=AI+automated+saas+recurring+revenue',
    category: 'elite',
    scrape_prompt: 'Find ideas for FULLY AUTONOMOUS digital systems — software that runs itself with AI, requires minimal human operation, targets high-paying customers ($500+/mo), and can reach profitability within weeks. Focus on: AI-powered SaaS, automated platforms, AI agents, self-service tools with recurring revenue, no-code/low-code automation, digital products with near-zero marginal cost.',
  },
];

// ============================================================
// YC 10-KEY-QUESTION FRAMEWORK + VISIONARY PRINCIPLES
// ============================================================
// Based on YC's Jared Friedman framework:
// KQ-01: Founder Market Fit → adapted as "autonomous build fit"
// KQ-02: Market Size
// KQ-03: Problem Acuity
// KQ-04: Competition (with genuine insight)
// KQ-05: Personal Demand
// KQ-06: Recently Became Possible
// KQ-07: Proxy Validation
// Plus: Scalability, Technical Feasibility, Autonomous Build Potential

export const YC_SCORING_SCHEMA = {
  type: 'object',
  properties: {
    founder_market_fit: { type: 'number', description: 'KQ-01 (0-100): Is this a good idea for an AI-driven autonomous build system to build? Does it leverage AI generation, web scraping, and automated deployment?' },
    market_size: { type: 'number', description: 'KQ-02 (0-100): How big is the market? Large today ($1B+) or growing rapidly enough to be large at scale?' },
    problem_acuity: { type: 'number', description: 'KQ-03 (0-100): How acute is the problem? Is there no good existing solution? Are users working around it with painful hacks?' },
    competition_insight: { type: 'number', description: 'KQ-04 (0-100): Is there a genuine insight competitors are missing? Higher = clearer differentiation. Presence of competitors is fine IF there is a sharp insight.' },
    personal_demand: { type: 'number', description: 'KQ-05 (0-100): Do people actually want this? Is there evidence of real demand in the source material?' },
    recently_possible: { type: 'number', description: 'KQ-06 (0-100): Did this only recently become possible or necessary due to new technology, regulation, or behavior change?' },
    proxy_validation: { type: 'number', description: 'KQ-07 (0-100): Is there a successful proxy company proving the model works in another market or vertical?' },
    scalability: { type: 'number', description: '(0-100): How easily does this scale without proportional cost increase?' },
    technical_feasibility: { type: 'number', description: '(0-100): How feasible is it to build with current technology (React, Tailwind, AI APIs, cloud infrastructure)?' },
    autonomous_build_potential: { type: 'number', description: '(0-100): Can the Auto Builder system build and launch this autonomously — generate architecture, data model, UI, code, and deploy without human intervention?' },
    automation_level: { type: 'number', description: '(0-100): How fully can this system be built AND operated autonomously via AI and digital capabilities AFTER launch? 100 = zero human operation needed, the system runs itself. 50 = some manual monitoring/intervention. 0 = requires constant human labor.' },
    speed_to_profit: { type: 'number', description: '(0-100): How fast can this reach profitability from launch? 100 = profitable within weeks (near-zero CAC, self-serve). 50 = within 3-6 months. 0 = years or never (high CAC, long sales cycles).' },
    end_user_value: { type: 'number', description: '(0-100): How much will the end user pay? 100 = high-ticket ($500+/mo or $5k+ one-time, enterprise/B2B). 50 = mid-tier ($50-500/mo, prosumer). 0 = free/freemium only, low willingness to pay.' },
    manual_work_required: { type: 'number', description: '(0-100): How much manual human work is needed to launch AND maintain this system? 100 = heavy manual labor (physical ops, manual fulfillment, human-in-loop). 0 = fully automated, no human touch after deployment.' },
    autonomous_overall: { type: 'number', description: 'Weighted composite for the autonomous systems category (0-100): automation_level 35%, speed_to_profit 25%, end_user_value 25%, (100 - manual_work_required) 15%. Higher = better fit as a fully autonomous, fast-to-profit, high-value system.' },
    system_category: { type: 'string', description: '"fully_autonomous" if automation_level >= 70 AND speed_to_profit >= 60 AND end_user_value >= 60 AND manual_work_required <= 30. Otherwise "general".' },
    overall: { type: 'number', description: 'Weighted composite (0-100). Weights: problem_acuity 20%, market_size 15%, autonomous_build_potential 15%, scalability 10%, competition_insight 10%, recently_possible 10%, technical_feasibility 10%, founder_market_fit 5%, personal_demand 3%, proxy_validation 2%' },
    score_breakdown: { type: 'string', description: '3-5 sentence explanation of why each dimension was scored this way, referencing the YC framework' },
    is_tarpit: { type: 'boolean', description: 'Is this a tarpit idea — looks attractive but has hidden structural reasons it has never succeeded?' },
    tarpit_warning: { type: 'string', description: 'If is_tarpit is true, explain the structural barrier. If false, empty string.' },
  },
  required: ['founder_market_fit', 'market_size', 'problem_acuity', 'competition_insight', 'personal_demand', 'recently_possible', 'proxy_validation', 'scalability', 'technical_feasibility', 'autonomous_build_potential', 'automation_level', 'speed_to_profit', 'end_user_value', 'manual_work_required', 'autonomous_overall', 'system_category', 'overall', 'score_breakdown', 'is_tarpit'],
};

// ============================================================
// IDEA EXTRACTION — from scraped content
// ============================================================

export const IDEA_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'A concise, memorable name for the app/website/business' },
          description: { type: 'string', description: 'What it does and why it matters (2-3 sentences)' },
          problem_statement: { type: 'string', description: 'The specific problem it solves — be concrete' },
          proposed_solution: { type: 'string', description: 'How it solves the problem — the core mechanism' },
          target_audience: { type: 'string', description: 'Who would use this — be specific' },
          source: { type: 'string', description: 'Where this idea was found (reddit, producthunt, hackernews, ai_website, app_directory, social_media, google_search)' },
          source_url: { type: 'string', description: 'The actual URL where this was discussed' },
          source_snippet: { type: 'string', description: 'A brief quote or summary from the source' },
          industry: { type: 'string', description: 'Primary industry' },
          sub_industry: { type: 'string', description: 'Sub-industry or niche' },
          product_type: { type: 'string', description: '"web_app", "ecommerce", "platform", or "marketing_site"' },
          keywords: { type: 'array', items: { type: 'string' }, description: '5-10 relevant search keywords' },
          competitors: { type: 'array', items: { type: 'string' }, description: 'Known competitors or similar products' },
        },
        required: ['title', 'description', 'problem_statement', 'proposed_solution', 'target_audience'],
      },
    },
  },
  required: ['ideas'],
};

// ============================================================
// EXHAUSTIVE SUMMARY — for top 10 ideas
// ============================================================

export const EXHAUSTIVE_SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    how_it_works: { type: 'string', description: 'Detailed explanation of how the product works end-to-end — user journey, core flows, key features' },
    how_to_build: { type: 'string', description: 'Step-by-step build plan — tech stack (React, Tailwind, Node, database), architecture, phases, estimated timeline' },
    possible_complications: { type: 'string', description: 'What could go wrong — technical challenges, market risks, legal/compliance issues, operational hurdles. List each explicitly.' },
    complication_prevention: { type: 'string', description: 'How to prevent or mitigate each complication listed above — concrete strategies for each' },
    financial_cost: { type: 'string', description: 'Estimated cost to build and launch: infrastructure (hosting, database, APIs), AI/LLM costs, tools, any paid services. Give dollar ranges.' },
    gross_income_potential: { type: 'string', description: 'Estimated gross revenue potential — conservative and optimistic scenarios, monthly and yearly. Include pricing model assumptions.' },
    net_income_potential: { type: 'string', description: 'Estimated net profit after all costs — conservative and optimistic, monthly and yearly' },
    niche: { type: 'string', description: 'The specific niche this targets — be precise about the market segment' },
    problems_solved: { type: 'string', description: 'Exhaustive list of all problems this solves — not just the main one' },
    ai_usage_plan: { type: 'string', description: 'How AI is used to build AND operate the product — which AI APIs, what they do, how they reduce costs' },
    autonomous_build_plan: { type: 'string', description: 'How the Auto Builder system can build this autonomously — step by step: architecture generation → data model → UI system → codegen → deploy → post-deploy verification' },
    architecture_overview: { type: 'string', description: 'High-level system architecture — main pages, data models/entities, key integrations, user flows' },
    data_systems_needed: { type: 'string', description: 'What data systems, APIs, databases, and third-party integrations are needed (Stripe, OpenAI, Supabase, etc.)' },
    brand_strategy: { type: 'string', description: 'Brand name ideas (3-5), positioning statement, brand tone, visual direction (colors, style)' },
    go_to_market: { type: 'string', description: 'How to launch and get first 100 users — channels, tactics, pricing strategy, distribution' },
  },
  required: ['how_it_works', 'how_to_build', 'possible_complications', 'complication_prevention', 'financial_cost', 'gross_income_potential', 'net_income_potential', 'niche', 'problems_solved', 'ai_usage_plan', 'autonomous_build_plan', 'architecture_overview', 'data_systems_needed', 'brand_strategy', 'go_to_market'],
};

// ============================================================
// SCORING FUNCTIONS
// ============================================================

function clampScore(val: any): number {
  const n = Number(val) || 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Score an idea using the YC 10-key-question framework.
 * Uses InvokeLLM with web search for market/competitor context.
 */
export async function scoreIdeaYC(base44: any, idea: {
  title: string;
  description: string;
  problem_statement?: string;
  proposed_solution?: string;
  target_audience?: string;
  industry?: string;
  sub_industry?: string;
  source?: string;
  source_snippet?: string;
}): Promise<{
  yc_scores: any;
  score_breakdown: string;
  is_tarpit: boolean;
  tarpit_warning: string;
  monetization_model: string;
  competitors: string[];
  keywords: string[];
}> {
  const prompt = `You are an elite startup evaluator using the Y Combinator framework for evaluating startup ideas (Jared Friedman's 10 Key Questions). You are evaluating ideas for an AI-driven autonomous build system that can generate, build, and launch web apps, websites, and platforms without human intervention.

IDEA TITLE: ${idea.title}
DESCRIPTION: ${idea.description}
PROBLEM: ${idea.problem_statement || 'Not specified'}
SOLUTION: ${idea.proposed_solution || 'Not specified'}
TARGET AUDIENCE: ${idea.target_audience || 'Not specified'}
INDUSTRY: ${idea.industry || 'General'}
SUB-INDUSTRY: ${idea.sub_industry || 'General'}
SOURCE: ${idea.source || 'web scrape'}
SOURCE SNIPPET: ${idea.source_snippet || 'N/A'}

Score each dimension 0-100 (100 = excellent) using the YC framework:

KQ-01 — Founder Market Fit (adapted): Is this a good idea for an AI-driven autonomous build system? Does it leverage AI generation, web scraping, automated deployment? Can our system build it well?
KQ-02 — Market Size: Is the market large ($1B+) today, or small but growing rapidly enough to be large at scale?
KQ-03 — Problem Acuity: How acute is the problem? Is there no good existing solution? Are users working around it with painful hacks? The strongest problems have NO good existing solution.
KQ-04 — Competition Insight: Is there a genuine insight competitors are missing? Presence of competitors is FINE if there is a sharp differentiation. No competition often means no one wants the product.
KQ-05 — Personal Demand: Do people actually want this? Is there evidence of real demand in the source material?
KQ-06 — Recently Became Possible: Did this only recently become possible or necessary due to new technology, regulation, or behavior change?
KQ-07 — Proxy Validation: Is there a successful proxy company proving the model works in another market/vertical?
Scalability: How easily does this scale without proportional cost increase?
Technical Feasibility: How feasible to build with current tech (React, Tailwind, AI APIs, cloud)?
Autonomous Build Potential: Can the Auto Builder system build and launch this autonomously — generate architecture, data model, UI, code, deploy, verify — without human intervention?

FULLY AUTONOMOUS SYSTEMS CATEGORY — Score these additional dimensions (0-100):
- Automation Level: How fully can this system be built AND operated autonomously via AI and digital capabilities AFTER launch? 100 = zero human operation needed, the system runs itself. 0 = requires constant human labor.
- Speed to Profit: How fast can this reach profitability from launch? 100 = profitable within weeks (near-zero CAC, self-serve). 50 = within 3-6 months. 0 = years or never.
- End User Value: How much will the end user pay? 100 = high-ticket ($500+/mo or $5k+ one-time, enterprise/B2B). 50 = mid-tier ($50-500/mo). 0 = free/freemium only.
- Manual Work Required: How much manual human work is needed to launch AND maintain? 100 = heavy manual labor. 0 = fully automated, no human touch.
- Autonomous Overall = automation_level 35%, speed_to_profit 25%, end_user_value 25%, (100 - manual_work_required) 15%
- System Category: Set to "fully_autonomous" if automation_level >= 70 AND speed_to_profit >= 60 AND end_user_value >= 60 AND manual_work_required <= 30. Otherwise "general".

ALSO: Determine if this is a TAR PIT IDEA — a concept that looks attractive but has hidden structural reasons it has never succeeded (e.g. friend meetup planners). If it is a tarpit, set is_tarpit=true and explain the structural barrier in tarpit_warning.

Overall = weighted composite: problem_acuity 20%, market_size 15%, autonomous_build_potential 15%, scalability 10%, competition_insight 10%, recently_possible 10%, technical_feasibility 10%, founder_market_fit 5%, personal_demand 3%, proxy_validation 2%

Search the web for market data, competitor info, and trend validation.`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: YC_SCORING_SCHEMA,
    model: 'gemini_3_flash',
  });

  const data = response as any;

  return {
    yc_scores: {
      founder_market_fit: clampScore(data.founder_market_fit),
      market_size: clampScore(data.market_size),
      problem_acuity: clampScore(data.problem_acuity),
      competition_insight: clampScore(data.competition_insight),
      personal_demand: clampScore(data.personal_demand),
      recently_possible: clampScore(data.recently_possible),
      proxy_validation: clampScore(data.proxy_validation),
      scalability: clampScore(data.scalability),
      technical_feasibility: clampScore(data.technical_feasibility),
      autonomous_build_potential: clampScore(data.autonomous_build_potential),
      automation_level: clampScore(data.automation_level),
      speed_to_profit: clampScore(data.speed_to_profit),
      end_user_value: clampScore(data.end_user_value),
      manual_work_required: clampScore(data.manual_work_required),
      autonomous_overall: clampScore(data.autonomous_overall),
      overall: clampScore(data.overall),
    },
    system_category: data.system_category === 'fully_autonomous' ? 'fully_autonomous' : 'general',
    score_breakdown: data.score_breakdown || '',
    is_tarpit: Boolean(data.is_tarpit),
    tarpit_warning: data.tarpit_warning || '',
    monetization_model: 'subscription',
    competitors: [],
    keywords: [],
  };
}

/**
 * Generate an exhaustive build summary for a top 10 idea.
 * Uses InvokeLLM with web search for cost/competitor/market data.
 */
export async function generateExhaustiveSummary(base44: any, idea: any): Promise<any> {
  const prompt = `You are a world-class product architect, startup strategist, and technical advisor. Generate an EXHAUSTIVE build summary for this top-ranked startup idea. This summary will be used to autonomously build and launch the product.

IDEA: ${idea.title}
DESCRIPTION: ${idea.description}
PROBLEM: ${idea.problem_statement || 'N/A'}
SOLUTION: ${idea.proposed_solution || 'N/A'}
TARGET AUDIENCE: ${idea.target_audience || 'N/A'}
INDUSTRY: ${idea.industry || 'General'}
MONETIZATION: ${idea.monetization_model || 'subscription'}
KEYWORDS: ${(idea.keywords || []).join(', ')}

Generate a comprehensive, production-grade summary covering EVERY aspect:

1. HOW IT WORKS — Detailed end-to-end explanation: user journey, core flows, key features, what the user sees and does
2. HOW TO BUILD — Step-by-step build plan: exact tech stack (React, Tailwind CSS, Node.js, database choice), architecture, build phases, estimated timeline in days
3. POSSIBLE COMPLICATIONS — Every risk: technical challenges, market risks, legal/compliance issues, operational hurdles, competitive threats. Be thorough and specific.
4. COMPLICATION PREVENTION — For EACH complication listed, provide a concrete mitigation strategy
5. FINANCIAL COST — Estimated cost to build and launch: infrastructure (hosting, database, APIs), AI/LLM API costs, paid tools/services. Give specific dollar ranges (low/high).
6. GROSS INCOME POTENTIAL — Revenue potential: conservative and optimistic, monthly and yearly. Include pricing model and assumptions.
7. NET INCOME POTENTIAL — Net profit after all costs: conservative and optimistic, monthly and yearly
8. NICHE — The precise market niche and segment being targeted
9. PROBLEMS SOLVED — Exhaustive list of ALL problems this solves (not just the main one)
10. AI USAGE PLAN — How AI is used to build AND operate: which AI APIs (OpenAI, Claude, etc.), what they do, how they reduce costs and enable features
11. AUTONOMOUS BUILD PLAN — How the Auto Builder system builds this autonomously: architecture generation → data model → UI system → codegen → deploy → post-deploy verification. Step by step.
12. ARCHITECTURE OVERVIEW — High-level system architecture: main pages (list them), data models/entities (list them), key integrations, user flows
13. DATA SYSTEMS NEEDED — All data systems, APIs, databases, third-party integrations needed (Stripe, OpenAI, Supabase, etc.) — list each with its purpose
14. BRAND STRATEGY — 3-5 brand name ideas, positioning statement, brand tone, visual direction (colors, style, aesthetic)
15. GO TO MARKET — How to launch and get first 100 users: channels, tactics, pricing strategy, distribution plan

Search the web for competitor pricing, market size data, and technology costs to make your estimates realistic.`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: EXHAUSTIVE_SUMMARY_SCHEMA,
    model: 'claude_sonnet_4_6',
  });

  return response as any;
}