import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Orchestrator: auto-clones top SERP competitors for ALL portfolio keywords.
// For each active site's top keywords, finds ranking competitors and creates SerpBlueprints.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Get all active portfolio sites with a linked rank engine
    const portfolios = await svc.entities.DomainPortfolio.filter(
      { status: { $in: ['active', 'gsc_submitted', 'ranking', 'deployed'] } },
      '-created_date', 200
    );

    const results = [];
    for (const p of portfolios) {
      if (!p.engine_id) continue;
      try {
        // Get top 5 keywords for this site (by search volume)
        const keywords = await svc.entities.RankKeyword.filter(
          { engine_id: p.engine_id },
          '-monthly_volume', 5
        );

        if (!keywords || keywords.length === 0) {
          results.push({ domain: p.domain, status: 'no_keywords' });
          continue;
        }

        for (const kw of keywords) {
          const fullQuery = kw.city ? `${kw.keyword} near ${kw.city}` : kw.keyword;

          // Skip if we already have 3+ blueprints for this keyword
          const existing = await svc.entities.SerpBlueprint.filter({ keyword: fullQuery }, '-created_date', 10);
          if (existing && existing.length >= 3) {
            results.push({ domain: p.domain, keyword: fullQuery, status: 'already_has_blueprints' });
            continue;
          }

          // Find top SERP competitors via AI web search
          const serpResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Search Google for "${fullQuery}" and list the top 5 organic results. For each, provide: url, domain, title, position (1-5), and site_type (direct_competitor, authority_site, directory, featured_snippet, ai_cited, local_pack). Only include real results from the actual search.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      url: { type: "string" },
                      domain: { type: "string" },
                      title: { type: "string" },
                      position: { type: "number" },
                      site_type: { type: "string", enum: ["direct_competitor", "authority_site", "directory", "featured_snippet", "ai_cited", "local_pack"] }
                    }
                  }
                }
              }
            }
          });

          let created = 0;
          for (const r of (serpResult.results || [])) {
            if (!r.url) continue;
            try {
              // Skip if we already have this competitor URL for this keyword
              const dupCheck = await svc.entities.SerpBlueprint.filter({ competitor_url: r.url, keyword: fullQuery }, '-created_date', 1);
              if (dupCheck && dupCheck.length > 0) continue;

              await svc.entities.SerpBlueprint.create({
                keyword: fullQuery,
                niche: p.niche || '',
                city: kw.city || '',
                competitor_url: r.url,
                competitor_domain: r.domain,
                competitor_title: r.title,
                serp_position: r.position,
                site_type: r.site_type || 'direct_competitor',
                portfolio_id: p.id,
                status: 'identified',
              });
              created++;
            } catch {}
          }

          // Auto-extract ranking blueprint for the #1 competitor
          try {
            const topBp = await svc.entities.SerpBlueprint.filter(
              { keyword: fullQuery, serp_position: 1, status: 'identified' },
              '-created_date', 1
            );
            if (topBp && topBp.length > 0) {
              await base44.functions.invoke('extractRankingBlueprint', { blueprint_id: topBp[0].id });
            }
          } catch {}

          results.push({ domain: p.domain, keyword: fullQuery, blueprints_created: created });
        }
      } catch (e) {
        results.push({ domain: p.domain, error: e.message });
      }
    }

    return Response.json({
      ok: true,
      sites_processed: results.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}