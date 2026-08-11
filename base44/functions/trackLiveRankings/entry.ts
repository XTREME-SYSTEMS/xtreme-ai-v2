import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Checks actual live SERP positions for target keywords using AI web search.
// Searches Google for each keyword and finds where the domain ranks.
// Updates RankKeyword records with real-time position data.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const portfolioId = req.body?.portfolio_id;

    // Get active portfolios with engine_ids
    let portfolios;
    if (portfolioId) {
      portfolios = [await svc.entities.DomainPortfolio.get(portfolioId)];
    } else {
      portfolios = await svc.entities.DomainPortfolio.filter(
        { status: { $in: ['active', 'gsc_submitted', 'ranking', 'deployed'] } },
        '-created_date', 100
      );
    }

    const allResults = [];
    let totalChecked = 0;
    let totalFound = 0;

    for (const portfolio of portfolios) {
      if (!portfolio.engine_id) continue;

      // Get target keywords for this portfolio
      let keywords = [];
      try {
        keywords = await svc.entities.RankKeyword.filter(
          { engine_id: portfolio.engine_id },
          '-created_date', 50
        );
      } catch { continue; }

      if (keywords.length === 0) continue;

      const domain = portfolio.domain;
      const siteUrl = portfolio.site_url || `https://${domain}`;

      // Batch keywords — 10 per LLM call to stay efficient
      const batches = [];
      for (let i = 0; i < keywords.length; i += 10) {
        batches.push(keywords.slice(i, i + 10));
      }

      for (const batch of batches) {
        const keywordList = batch.map((k, i) =>
          `${i + 1}. "${k.keyword}"${k.city ? ` near ${k.city}` : ''}`
        ).join('\n');

        const prompt = `You are a SERP (Search Engine Results Page) position tracker. For each keyword below, search Google and determine the organic ranking position of "${domain}" (or any page from ${siteUrl}).

Keywords to check:
${keywordList}

For each keyword:
1. Search the web for that exact keyword
2. Look through the top 100 organic results (not ads)
3. Find "${domain}" or any URL starting with "${siteUrl}"
4. Report the position number (1 = first organic result, 2 = second, etc.)
5. If the domain is NOT found in the top 100, report position as 0
6. If found, report the exact URL that appeared

Be accurate. Only report a position if you genuinely find the domain in the results. Do not guess.`;

        try {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                rankings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      keyword: { type: "string" },
                      position: { type: "number", description: "0 if not found in top 100, otherwise SERP position (1-100)" },
                      found_url: { type: "string", description: "The URL found in SERP, empty if not found" }
                    }
                  }
                }
              }
            }
          });

          // Update each keyword with the live position
          const updates = [];
          for (const ranking of result.rankings || []) {
            const kw = batch.find(k =>
              k.keyword === ranking.keyword ||
              k.keyword.toLowerCase().includes(ranking.keyword.toLowerCase()) ||
              ranking.keyword.toLowerCase().includes(kw_keyword_match(k.keyword, ranking.keyword))
            );
            if (kw) {
              const prevPos = kw.current_position || 0;
              const newPos = ranking.position || 0;
              updates.push(svc.entities.RankKeyword.update(kw.id, {
                previous_position: prevPos,
                current_position: newPos,
                last_checked: new Date().toISOString(),
                page_url: ranking.found_url || kw.page_url || '',
                status: newPos > 0 && newPos <= 10 ? 'page_one'
                      : newPos > 0 ? 'ranking'
                      : kw.status === 'target' ? 'target' : 'tracking',
              }));
              totalChecked++;
              if (newPos > 0) totalFound++;
            }
          }
          await Promise.all(updates);

          allResults.push({
            domain,
            keywords_checked: batch.length,
            rankings: result.rankings,
          });
        } catch (e) {
          allResults.push({ domain, error: e.message });
        }
      }
    }

    return Response.json({
      ok: true,
      portfolios_processed: allResults.length,
      keywords_checked: totalChecked,
      keywords_ranking: totalFound,
      results: allResults,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

function kw_keyword_match(a, b) {
  const aa = a.toLowerCase().trim();
  const bb = b.toLowerCase().trim();
  if (aa === bb) return aa;
  if (aa.includes(bb)) return bb;
  if (bb.includes(aa)) return aa;
  return bb;
}