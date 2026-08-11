import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Autonomous daily optimization cycle — for every active domain:
// 1. Refreshes stale content (delegates to refreshStaleContent)
// 2. AI-optimizes page metadata (title + meta description) for CTR + rankings
// 3. Reviews and optimizes internal link structure
// 4. Logs all optimizations to the domain's activity log
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Get all launched/active domains
    const domains = await svc.entities.DomainPortfolio.filter(
      { status: { $in: ['active', 'ranking', 'gsc_submitted', 'deployed'] } },
      '-created_date', 100
    );

    if (!domains || domains.length === 0) {
      return Response.json({ ok: true, message: 'No active domains to optimize', optimized: 0 });
    }

    const results = [];

    for (const d of domains) {
      const optimizations = [];
      let pagesOptimized = 0;

      try {
        if (!d.engine_id) {
          results.push({ domain: d.domain, skipped: 'no engine_id' });
          continue;
        }

        // ---- 1. Refresh stale content ----
        try {
          await base44.functions.invoke('refreshStaleContent', { engine_id: d.engine_id });
          optimizations.push('content_refreshed');
        } catch (e) {
          optimizations.push(`content_refresh_failed: ${e.message}`);
        }

        // ---- 2. AI-optimize metadata for deployed pages (limit 5 per domain per run) ----
        try {
          const pages = await svc.entities.RankPage.filter(
            { engine_id: d.engine_id, status: { $in: ['deployed', 'indexed', 'generated'] } },
            '-updated_date', 5
          );

          for (const page of pages) {
            try {
              const optRes = await base44.integrations.Core.InvokeLLM({
                prompt: `You are an SEO metadata optimizer. Given the following page details, generate an optimized SEO title (max 60 chars) and meta description (max 155 chars) that maximize click-through rate and search ranking.

Page title: "${page.title}"
Current meta: "${page.meta_description || ''}"
Target keyword: "${page.keyword || page.title}"
Page type: "${page.page_type}"
City: "${page.city || 'N/A'}"
Service: "${page.service || 'N/A'}"

Rules:
- Title must be compelling, include the primary keyword, and be under 60 characters
- Meta description must include the keyword, a value proposition, and a call to action, under 155 characters
- For local pages, include the city name
- Do not use clickbait; be factual and compelling

Return JSON with optimized_title and optimized_meta_description.`,
                response_json_schema: {
                  type: "object",
                  properties: {
                    optimized_title: { type: "string" },
                    optimized_meta_description: { type: "string" }
                  }
                }
              });

              const updates = {};
              if (optRes?.optimized_title && optRes.optimized_title !== page.title) {
                updates.title = optRes.optimized_title;
              }
              if (optRes?.optimized_meta_description && optRes.optimized_meta_description !== page.meta_description) {
                updates.meta_description = optRes.optimized_meta_description;
              }

              if (Object.keys(updates).length > 0) {
                updates.last_refreshed = new Date().toISOString();
                await svc.entities.RankPage.update(page.id, updates);
                pagesOptimized++;
              }
            } catch (e) {
              // Skip this page, continue to next
            }
          }
          if (pagesOptimized > 0) optimizations.push(`metadata_optimized:${pagesOptimized}_pages`);
        } catch (e) {
          optimizations.push(`metadata_optimization_failed: ${e.message}`);
        }

        // ---- 3. Internal link structure optimization ----
        try {
          const allPages = await svc.entities.RankPage.filter(
            { engine_id: d.engine_id, status: { $in: ['deployed', 'indexed'] } },
            '-created_date', 50
          );

          if (allPages.length >= 2) {
            // Use LLM to identify internal linking opportunities
            const linkRes = await base44.integrations.Core.InvokeLLM({
              prompt: `You are an internal linking strategist. Given these pages on the same site, suggest 3 high-value internal links to add. For each, specify which page should link to which, and what anchor text to use.

Pages:
${allPages.slice(0, 10).map((p, i) => `${i + 1}. "${p.title}" (keyword: ${p.keyword || 'N/A'}, city: ${p.city || 'N/A'})`).join('\n')}

Return JSON with an array of link suggestions, each containing from_page_title, to_page_title, and anchor_text.`,
              response_json_schema: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        from_page_title: { type: "string" },
                        to_page_title: { type: "string" },
                        anchor_text: { type: "string" }
                      }
                    }
                  }
                }
              }
            });

            const suggestionCount = linkRes?.suggestions?.length || 0;
            if (suggestionCount > 0) {
              optimizations.push(`link_structure:${suggestionCount}_suggestions`);
            }
          }
        } catch (e) {
          optimizations.push(`link_structure_failed: ${e.message}`);
        }

        // ---- 4. Log the optimization ----
        const logEntry = `[${new Date().toISOString()}] Auto-optimized: ${optimizations.join(', ')}`;
        await svc.entities.DomainPortfolio.update(d.id, {
          logs: [...(d.logs || []), logEntry].slice(-20),
        });

        results.push({ domain: d.domain, optimizations, pages_optimized: pagesOptimized });
      } catch (e) {
        results.push({ domain: d.domain, error: e.message });
      }
    }

    return Response.json({
      ok: true,
      optimized: results.filter(r => !r.error && !r.skipped).length,
      skipped: results.filter(r => r.skipped).length,
      failed: results.filter(r => r.error).length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}