import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeInvoke, safeUpdate } from '../../shared/resilience.ts';

// Analyzes top-ranking competitors for target keywords using web search,
// extracts their content structure/depth/schema, and generates a gap report
// showing exactly what our pages need to match or exceed to reach page 1.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const logs = [];
    const log = (m) => { logs.push(m); };

    // Admin-only (but allow service-role invocation)
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {}

    const svc = base44.asServiceRole;
    const engineId = body.engine_id;
    if (!engineId) return Response.json({ error: 'engine_id required' }, { status: 400 });

    const engine = await svc.entities.RankEngine.get(engineId);
    log(`Analyzing competitors for "${engine.site_name}" (${engine.niche})`);

    // Get top target keywords (lowest difficulty first = easiest to rank)
    const allKw = await svc.entities.RankKeyword.filter({ engine_id: engineId });
    const targetKw = allKw
      .filter(k => k.status === 'target' || k.status === 'tracking')
      .sort((a, b) => (a.difficulty || 100) - (b.difficulty || 100))
      .slice(0, 8);
    log(`Analyzing ${targetKw.length} target keywords`);

    if (!targetKw.length) {
      return Response.json({ error: 'No target keywords found. Run the Rank Engine first.' }, { status: 400 });
    }

    // Get our pages for comparison
    const ourPages = await svc.entities.RankPage.filter({ engine_id: engineId });
    const pageByKw = {};
    ourPages.forEach(p => { if (p.keyword) pageByKw[p.keyword.toLowerCase()] = p; });

    // Single web-context call: analyze competitors for all keywords
    const gapPrompt = `You are an elite SEO competitor analyst. For the business "${engine.site_name}" in the "${engine.niche}" niche targeting these keywords: ${JSON.stringify(targetKw.map(k => k.keyword))}

For EACH keyword, search Google and analyze the top 5 ranking pages. Extract:
- Average word count of top-ranking pages
- Common heading structure (what H2s/H3s they all use)
- Schema/structured data types they use
- Key topics/entities they cover that a new site might miss
- What it would take for a brand-new site to match or exceed them

Also provide an overall competitor gap report summarizing the biggest opportunities.

Return JSON: {
  "keyword_gaps": [
    {
      "keyword": string,
      "competitor_avg_word_count": number,
      "common_headings": [string],
      "schema_types": [string],
      "missing_topics": [string],
      "difficulty_assessment": string,
      "recommendation": string
    }
  ],
  "overall_report": string (detailed markdown report with actionable recommendations),
  "top_gaps": [string] (5-8 most critical gaps to fix)
}`;

    const gapRes = await safeInvoke(base44, {
      prompt: gapPrompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      timeout: 60000,
      retries: 2,
      label: 'competitor-gap-analysis',
      response_json_schema: {
        type: 'object',
        properties: {
          keyword_gaps: { type: 'array', items: { type: 'object', properties: {
            keyword: { type: 'string' },
            competitor_avg_word_count: { type: 'number' },
            common_headings: { type: 'array', items: { type: 'string' } },
            schema_types: { type: 'array', items: { type: 'string' } },
            missing_topics: { type: 'array', items: { type: 'string' } },
            difficulty_assessment: { type: 'string' },
            recommendation: { type: 'string' }
          } } },
          overall_report: { type: 'string' },
          top_gaps: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    const keywordGaps = gapRes.keyword_gaps || [];
    const overallReport = gapRes.overall_report || '';
    const topGaps = gapRes.top_gaps || [];
    log(`Analyzed ${keywordGaps.length} keyword gaps, ${topGaps.length} top gaps identified`);

    // Update each RankPage with its competitor gap data
    for (const kg of keywordGaps) {
      const page = pageByKw[kg.keyword.toLowerCase()];
      if (page) {
        await safeUpdate(svc, 'RankPage', page.id, {
          competitor_gap: {
            competitor_avg_word_count: kg.competitor_avg_word_count || 0,
            our_word_count: page.word_count || 0,
            missing_topics: kg.missing_topics || [],
            recommendations: kg.recommendation || ''
          }
        }, 'page-gap-update');
      }
    }
    log('Updated page-level gap data');

    // Update engine with overall report
    await safeUpdate(svc, 'RankEngine', engineId, {
      audit_summary: overallReport.slice(0, 5000),
      gaps: topGaps,
      competitor_gap_report: overallReport,
      gap_analyzed_at: new Date().toISOString(),
      logs: [...(engine.logs || []), ...logs].slice(-20)
    }, 'engine-gap-update');

    return Response.json({
      ok: true,
      engine_id: engineId,
      keywords_analyzed: keywordGaps.length,
      top_gaps: topGaps,
      report: overallReport,
      keyword_gaps: keywordGaps,
      logs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}