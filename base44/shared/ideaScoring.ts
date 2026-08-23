// ideaScoring.ts — Shared idea scoring logic.
// Uses InvokeLLM to score idea candidates on key business viability dimensions.
// Shared between runDiscoveryScrape (auto-scoring on ingestion) and the
// scoreIdeaCandidate backend function (manual re-scoring).

export interface IdeaScores {
  profitability: number;
  scalability: number;
  niche_strength: number;
  usability: number;
  competition: number;
  trend_momentum: number;
  technical_feasibility: number;
  overall: number;
}

export interface ScoringResult {
  scores: IdeaScores;
  score_breakdown: string;
  monetization_model: string;
  competitors: string[];
  keywords: string[];
}

const SCORING_SCHEMA = {
  type: 'object',
  properties: {
    profitability: { type: 'number', description: 'Revenue potential (0-100). Consider market size, willingness to pay, monetization clarity.' },
    scalability: { type: 'number', description: 'How easily the product scales without proportional cost increase (0-100)' },
    niche_strength: { type: 'number', description: 'How well-defined and underserved the niche is (0-100)' },
    usability: { type: 'number', description: 'How easy the product is to use and how clear the value prop is (0-100)' },
    competition: { type: 'number', description: 'Inverse competition — higher = less crowded market (0-100)' },
    trend_momentum: { type: 'number', description: 'Current trending strength and growing interest (0-100)' },
    technical_feasibility: { type: 'number', description: 'How feasible to build with current tech (0-100)' },
    overall: { type: 'number', description: 'Weighted composite score (0-100). Weight: profitability 20%, scalability 15%, niche 15%, usability 10%, competition 15%, trend 15%, feasibility 10%' },
    score_breakdown: { type: 'string', description: '2-3 sentence explanation of why each dimension was scored this way' },
    monetization_model: { type: 'string', description: 'Suggested monetization model (subscription, freemium, one-time, marketplace, ads, etc.)' },
    competitors: { type: 'array', items: { type: 'string' }, description: 'Known existing competitors or similar products' },
    keywords: { type: 'array', items: { type: 'string' }, description: '5-10 search keywords that describe this idea' },
  },
  required: ['profitability', 'scalability', 'niche_strength', 'usability', 'competition', 'trend_momentum', 'technical_feasibility', 'overall', 'score_breakdown'],
};

/**
 * Score an idea candidate using InvokeLLM with web search for market context.
 */
export async function scoreIdea(base44: any, idea: {
  title: string;
  description: string;
  problem_statement?: string;
  proposed_solution?: string;
  target_audience?: string;
  industry?: string;
  sub_industry?: string;
  source?: string;
}): Promise<ScoringResult> {
  const prompt = `You are an expert startup analyst and venture evaluator. Score the following app/website/business idea on a scale of 0-100 across each dimension. Use your knowledge of the market, search the web for current trends and competitor data, and provide a rigorous, realistic assessment.

IDEA TITLE: ${idea.title}
DESCRIPTION: ${idea.description}
PROBLEM: ${idea.problem_statement || 'Not specified'}
SOLUTION: ${idea.proposed_solution || 'Not specified'}
TARGET AUDIENCE: ${idea.target_audience || 'Not specified'}
INDUSTRY: ${idea.industry || 'General'}
SUB-INDUSTRY: ${idea.sub_industry || 'General'}
SOURCE: ${idea.source || 'web search'}

Score each dimension 0-100 (100 = excellent):
1. profitability — Revenue potential: market size, willingness to pay, monetization clarity
2. scalability — How easily it scales without proportional cost increase
3. niche_strength — How well-defined and underserved the niche is
4. usability — How easy to use and how clear the value proposition is
5. competition — INVERSE: higher = LESS crowded market (100 = no competitors, 0 = saturated)
6. trend_momentum — Current trending strength and growing interest
7. technical_feasibility — How feasible to build with current technology
8. overall — Weighted composite: profitability 20%, scalability 15%, niche 15%, usability 10%, competition 15%, trend 15%, feasibility 10%

Also suggest a monetization model, list known competitors, and provide 5-10 relevant keywords.`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: SCORING_SCHEMA,
    model: 'gemini_3_flash',
  });

  const data = response as any;

  return {
    scores: {
      profitability: clampScore(data.profitability),
      scalability: clampScore(data.scalability),
      niche_strength: clampScore(data.niche_strength),
      usability: clampScore(data.usability),
      competition: clampScore(data.competition),
      trend_momentum: clampScore(data.trend_momentum),
      technical_feasibility: clampScore(data.technical_feasibility),
      overall: clampScore(data.overall),
    },
    score_breakdown: data.score_breakdown || '',
    monetization_model: data.monetization_model || 'subscription',
    competitors: Array.isArray(data.competitors) ? data.competitors.slice(0, 10) : [],
    keywords: Array.isArray(data.keywords) ? data.keywords.slice(0, 10) : [],
  };
}

function clampScore(val: any): number {
  const n = Number(val) || 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Discover ideas from the web using InvokeLLM with internet context.
 * Searches for problems, trends, and opportunities in a given industry.
 */
export async function discoverIdeasFromWeb(base44: any, params: {
  industry?: string;
  sub_industry?: string;
  search_type?: 'problems' | 'trends' | 'social' | 'gaps';
  max_results?: number;
}): Promise<Array<{
  title: string;
  description: string;
  problem_statement: string;
  proposed_solution: string;
  target_audience: string;
  source: string;
  source_url: string;
  source_snippet: string;
  industry: string;
  sub_industry: string;
  product_type: string;
  keywords: string[];
  competitors: string[];
}>> {
  const { industry, sub_industry, search_type = 'problems', max_results = 10 } = params;

  const searchPrompts: Record<string, string> = {
    problems: `Search the web for common problems, complaints, and pain points that people have${industry ? ` in the ${industry} industry` : ''}${sub_industry ? ` (specifically ${sub_industry})` : ''}. Look at Reddit threads, forum discussions, app store reviews, and social media complaints. Find problems that could be solved by a new app, website, or software tool.`,
    trends: `Search the web for trending topics, emerging technologies, and growing search trends${industry ? ` in the ${industry} industry` : ''}. Look at Google Trends, Product Hunt, Hacker News, and tech blogs. Find opportunities for new apps or websites that ride these trends.`,
    social: `Search social media and online communities for what people are searching for, requesting, or wishing existed${industry ? ` related to ${industry}` : ''}. Look at Reddit r/SomebodyMakeThis, Twitter requests, and product feedback. Find gaps in the market that a new app or website could fill.`,
    gaps: `Search for market gaps and underserved niches${industry ? ` in ${industry}` : ''}. Find areas where existing solutions are expensive, complex, or missing entirely. Identify opportunities for a simpler, cheaper, or more focused product.`,
  };

  const prompt = `${searchPrompts[search_type]}

Return up to ${max_results} distinct, high-potential ideas. For each idea provide:
- title: A concise name for the app/website/business
- description: What it does and why it matters (2-3 sentences)
- problem_statement: The specific problem it solves
- proposed_solution: How it solves the problem
- target_audience: Who would use this
- source: Where you found this idea (reddit, google_trends, producthunt, hackernews, twitter, google_search)
- source_url: A real URL where the problem/trend was discussed (use actual URLs from search results)
- source_snippet: A brief quote or summary from the source
- industry: "${industry || 'General'}"
- sub_industry: "${sub_industry || 'General'}"
- product_type: "web_app", "ecommerce", "platform", or "marketing_site" — choose the best fit
- keywords: 5-10 relevant search keywords
- competitors: Known existing competitors or similar products

Focus on ideas that are profitable, scalable, and serve an underserved niche. Avoid saturated markets unless you find a clear differentiation angle.`;

  const schema = {
    type: 'object',
    properties: {
      ideas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            problem_statement: { type: 'string' },
            proposed_solution: { type: 'string' },
            target_audience: { type: 'string' },
            source: { type: 'string' },
            source_url: { type: 'string' },
            source_snippet: { type: 'string' },
            industry: { type: 'string' },
            sub_industry: { type: 'string' },
            product_type: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            competitors: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'description', 'problem_statement', 'proposed_solution', 'target_audience'],
        },
      },
    },
    required: ['ideas'],
  };

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: schema,
    model: 'gemini_3_flash',
  });

  const data = response as any;
  return Array.isArray(data.ideas) ? data.ideas.slice(0, max_results) : [];
}

/**
 * Discover businesses with bad websites in a given industry/location.
 */
export async function discoverBadWebsites(base44: any, params: {
  industry?: string;
  sub_industry?: string;
  location?: string;
  max_results?: number;
}): Promise<Array<{
  business_name: string;
  website_url: string;
  industry: string;
  sub_industry: string;
  location: string;
  phone: string;
  email: string;
  address: string;
  issues: Array<{ type: string; severity: string; description: string }>;
  suggested_services: string[];
  competitor_analysis: string;
}>> {
  const { industry = 'home services', sub_industry = '', location = '', max_results = 10 } = params;

  const prompt = `Search the web for businesses${industry ? ` in the ${industry} industry` : ''}${sub_industry ? ` (specifically ${sub_industry})` : ''}${location ? ` in ${location}` : ''} that have BAD websites, poor online presence, or technical issues. Look for:
- Businesses with no website at all (only a Facebook page or Google Business listing)
- Businesses with broken, outdated, or very simple websites
- Businesses with no SSL (http:// instead of https://)
- Businesses with very slow websites
- Businesses with no Google Business Profile or very few reviews
- Businesses with poor SEO (no meta tags, thin content)

Return up to ${max_results} businesses. For each, provide:
- business_name: The actual business name
- website_url: Their current website URL (or empty string if none)
- industry: "${industry}"
- sub_industry: "${sub_industry}"
- location: "${location}"
- phone: Their phone number if found
- email: Their email if found
- address: Their address if found
- issues: Array of detected issues (type: no_website|broken_website|slow_load|not_mobile_friendly|poor_seo|no_ssl|outdated_design|missing_schema|no_google_business|low_reviews|no_social_media|broken_links|poor_content|no_cta|security_issue, severity: critical|major|minor, description)
- suggested_services: What services they need (website redesign, SEO, branding, Google Business Profile setup, etc.)
- competitor_analysis: Brief note on how their competitors' websites compare

Focus on real, findable businesses. Use actual URLs and contact info from search results.`;

  const schema = {
    type: 'object',
    properties: {
      businesses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            business_name: { type: 'string' },
            website_url: { type: 'string' },
            industry: { type: 'string' },
            sub_industry: { type: 'string' },
            location: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            suggested_services: { type: 'array', items: { type: 'string' } },
            competitor_analysis: { type: 'string' },
          },
          required: ['business_name', 'issues'],
        },
      },
    },
    required: ['businesses'],
  };

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: schema,
    model: 'gemini_3_flash',
  });

  const data = response as any;
  return Array.isArray(data.businesses) ? data.businesses.slice(0, max_results) : [];
}