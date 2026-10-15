import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Generates social media content + syndication plan from existing site content.
// Fills "Automated Social Posting", "Content Syndication", "Content Repurposing" methods.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const portfolioId = req.body?.portfolio_id;

    let portfolios;
    if (portfolioId) {
      portfolios = [await svc.entities.DomainPortfolio.get(portfolioId)];
    } else {
      portfolios = await svc.entities.DomainPortfolio.filter(
        { status: { $in: ['active', 'gsc_submitted', 'ranking', 'deployed'] } },
        '-created_date', 50
      );
    }

    const results = [];

    for (const p of portfolios) {
      if (!p.engine_id) continue;

      // Get recent deployed pages
      let pages = [];
      try {
        pages = await svc.entities.RankPage.filter(
          { engine_id: p.engine_id, status: 'deployed' },
          '-created_date', 3
        );
      } catch {}

      if (pages.length === 0) continue;

      const pageSummaries = pages.map(pg => `- ${pg.title}: ${pg.meta_description || ''}`).join('\n');
      const siteUrl = p.site_url || `https://${p.domain}`;
      const niche = p.niche || 'general';

      // Use InvokeLLM to generate multi-platform content
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Generate social media content for ${p.domain} (${niche} services).

Recent published content:
${pageSummaries}

Website: ${siteUrl}

Generate content for each platform. Make it engaging, relevant, and include calls to action linking to ${siteUrl}.

Format as JSON with these fields:
- twitter_thread: array of 3-5 tweet strings
- linkedin_post: professional LinkedIn post
- facebook_post: engaging Facebook post
- instagram_caption: Instagram caption with 10-15 relevant hashtags
- youtube_script: 60-second YouTube Shorts script
- tiktok_script: 30-second TikTok script
- medium_outline: Medium article outline for content syndication (with canonical back to ${siteUrl})
- reddit_post: Reddit post for relevant subreddit
- quora_answer: Quora answer template with link back to site`,
        response_json_schema: {
          type: "object",
          properties: {
            twitter_thread: { type: "array", items: { type: "string" } },
            linkedin_post: { type: "string" },
            facebook_post: { type: "string" },
            instagram_caption: { type: "string" },
            youtube_script: { type: "string" },
            tiktok_script: { type: "string" },
            medium_outline: { type: "string" },
            reddit_post: { type: "string" },
            quora_answer: { type: "string" },
          }
        }
      });

      results.push({
        domain: p.domain,
        niche,
        pages_processed: pages.length,
        content: result,
      });
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