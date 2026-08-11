import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Identifies the top-ranking sites for a keyword and creates SerpBlueprint records.
// Also identifies high-value site types: direct competitors, authority sites, directories,
// featured snippets, AI-cited sites, and local pack entries.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const keyword = req.body?.keyword;
    const niche = req.body?.niche || '';
    const city = req.body?.city || '';
    const cloneThem = req.body?.clone || false;

    if (!keyword) {
      return Response.json({ error: 'keyword is required' }, { status: 400 });
    }

    const fullQuery = city ? `${keyword} near ${city}` : keyword;

    // Use InvokeLLM with web search to find top SERP results
    const prompt = `Search Google for "${fullQuery}" and analyze the top 10 organic search results.

For each result, provide:
1. The exact URL
2. The domain name
3. The page title as it appears in SERP
4. The SERP position (1-10)
5. The site type: "direct_competitor" (a business offering same service), "authority_site" (high-authority niche blog/resource), "directory" (Yelp, Angi, BBB, etc.), "featured_snippet" (has a featured snippet), "ai_cited" (commonly cited by AI), or "local_pack" (in the local map pack)

Also identify:
- Which sites have featured snippets
- Which sites appear in AI search results (ChatGPT/Perplexity would likely cite)
- Which sites are local directories vs direct competitors
- Which 3 sites would be most valuable to clone for SEO intelligence

Be specific with real URLs from the actual search results.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
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
                site_type: { type: "string", enum: ["direct_competitor", "authority_site", "directory", "featured_snippet", "ai_cited", "local_pack"] },
                has_featured_snippet: { type: "boolean" },
                in_local_pack: { "type": "boolean" },
                why_valuable: { type: "string", "description": "Why this site is worth cloning for intelligence" }
              }
            }
          },
          top_3_to_clone: { type: "array", items: { type: "string" }, "description": "URLs of the 3 most valuable sites to clone" },
          serp_summary: { type: "string", "description": "Overall SERP analysis - what does it take to rank for this keyword?" }
        }
      }
    });

    // Create SerpBlueprint records for each result
    const created = [];
    for (const r of result.results || []) {
      if (!r.url) continue;
      try {
        const bp = await svc.entities.SerpBlueprint.create({
          keyword: fullQuery,
          niche,
          city,
          competitor_url: r.url,
          competitor_domain: r.domain,
          competitor_title: r.title,
          serp_position: r.position,
          site_type: r.site_type || 'direct_competitor',
          status: 'identified',
        });
        created.push(bp);

        // Optionally create CloneProject entries
        if (cloneThem && r.url) {
          try {
            const existing = await svc.entities.CloneProject.filter({ target_url: r.url }, '-created_date', 1);
            if (!existing || existing.length === 0) {
              const clone = await svc.entities.CloneProject.create({
                target_url: r.url,
                industry: niche,
                current_step: 'queued',
                status: 'queued',
                approval_status: 'pending',
                logs: [`Created from SERP competitor analysis for "${fullQuery}"`],
              });
              await svc.entities.SerpBlueprint.update(bp.id, {
                clone_project_id: clone.id,
                status: 'cloned',
              });
            }
          } catch {}
        }
      } catch (e) {}
    }

    return Response.json({
      ok: true,
      keyword: fullQuery,
      serp_summary: result.serp_summary,
      top_3_to_clone: result.top_3_to_clone,
      competitors_found: created.length,
      blueprints: created,
      raw_results: result.results,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}