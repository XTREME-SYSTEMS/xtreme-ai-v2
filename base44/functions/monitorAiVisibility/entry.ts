import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Monitors brand visibility in AI search engines (ChatGPT, Perplexity, Gemini, Claude).
// Uses InvokeLLM with web search to check if brand appears in AI recommendations.
// Fills the "AI Answer Monitoring", "AI Brand Mention Tracking", "AI Visibility Score" methods.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const portfolioId = req.body?.portfolio_id;
    const domain = req.body?.domain;
    const niche = req.body?.niche || 'general';

    let portfolios;
    if (portfolioId) {
      portfolios = [await svc.entities.DomainPortfolio.get(portfolioId)];
    } else if (domain) {
      portfolios = await svc.entities.DomainPortfolio.filter({ domain }, '-created_date', 1);
    } else {
      portfolios = await svc.entities.DomainPortfolio.filter(
        { status: { $in: ['active', 'gsc_submitted', 'ranking', 'deployed'] } },
        '-created_date', 50
      );
    }

    const results = [];

    for (const p of portfolios) {
      const brandDomain = p.domain || domain;
      const brandNiche = p.niche || niche;

      if (!brandDomain) continue;

      // Use InvokeLLM with web search to check AI visibility
      const prompt = `You are an AI search assistant. A user asks: "What are the best ${brandNiche} companies or websites near me?"

Search the web and list the top 5-10 companies/websites you would actually recommend for "${brandNiche}".

Then answer these questions about "${brandDomain}":
1. Does "${brandDomain}" appear in your recommendations? (true/false)
2. On a scale of 0-100, how visible is "${brandDomain}" in AI search results for "${brandNiche}"?
3. What should "${brandDomain}" do to improve its visibility in AI search results?

Be specific and factual. Only say a brand is visible if it genuinely appears in your recommendations or you have specific knowledge of it.`;

      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              recommended_companies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    website: { type: "string" },
                    reason: { type: "string" }
                  }
                }
              },
              brand_visible: { type: "boolean" },
              visibility_score: { type: "number", description: "0-100" },
              recommendations: { type: "string", description: "Actionable steps to improve AI visibility" },
              competitor_analysis: { type: "string", description: "What competitors are doing to appear in AI results" }
            }
          }
        });

        // Store result in portfolio logs
        const logs = p.logs || [];
        logs.push(`[${new Date().toISOString()}] AI Visibility: score=${result.visibility_score}, visible=${result.brand_visible}`);
        await svc.entities.DomainPortfolio.update(p.id, { logs: logs.slice(-50) });

        results.push({
          domain: brandDomain,
          niche: brandNiche,
          ...result,
        });
      } catch (e) {
        results.push({ domain: brandDomain, status: 'error', error: e.message });
      }
    }

    return Response.json({
      ok: true,
      portfolios_processed: results.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}