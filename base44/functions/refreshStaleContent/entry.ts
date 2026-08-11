import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeInvoke, safeUpdate } from '../../shared/resilience.ts';

// Finds pages with stale content (last_refreshed > 30 days ago or null)
// and regenerates/enhances their content to keep it fresh.
// Google rewards content freshness — this is a key page-1 accelerator.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const logs = [];
    const log = (m) => { logs.push(m); };

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
    const pages = await svc.entities.RankPage.filter({ engine_id: engineId });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const stalePages = pages.filter(p => !p.last_refreshed || p.last_refreshed < thirtyDaysAgo);
    log(`Found ${stalePages.length} stale pages (of ${pages.length} total) for "${engine.site_name}"`);

    if (!stalePages.length) {
      return Response.json({ ok: true, engine_id: engineId, refreshed: 0, message: 'All pages are fresh', logs });
    }

    // Refresh up to 5 stale pages per run (to avoid LLM overload)
    const toRefresh = stalePages.slice(0, 5);
    log(`Refreshing ${toRefresh.length} pages`);

    const refreshPrompt = `You are an elite SEO content writer. For "${engine.site_name}" (${engine.niche}), refresh and enhance these landing pages. For each page, expand the content to 800+ words, add fresh insights, update the FAQ with new Q&As, improve E-E-A-T signals, and ensure topical depth. Keep the same keyword targeting but make the content more comprehensive and valuable than typical competitor pages.

Pages to refresh: ${JSON.stringify(toRefresh.map(p => ({ keyword: p.keyword, title: p.title, current_word_count: p.word_count, city: p.city })))}

Return JSON: { "pages": [ { "keyword": string, "title": string, "meta_description": string, "headline": string, "body_content": string (HTML, 800+ words), "faq": [ { "question": string, "answer": string } ] } ] }`;

    const refreshRes = await safeInvoke(base44, {
      prompt: refreshPrompt,
      model: 'gemini_3_flash',
      timeout: 60000,
      retries: 2,
      label: 'content-refresh',
      response_json_schema: {
        type: 'object',
        properties: {
          pages: { type: 'array', items: { type: 'object', properties: {
            keyword: { type: 'string' },
            title: { type: 'string' },
            meta_description: { type: 'string' },
            headline: { type: 'string' },
            body_content: { type: 'string' },
            faq: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } } } }
          } } }
        }
      }
    });

    const refreshed = refreshRes.pages || [];
    let updatedCount = 0;
    const now = new Date().toISOString();

    for (const r of refreshed) {
      const page = toRefresh.find(p => p.keyword && p.keyword.toLowerCase() === r.keyword?.toLowerCase());
      if (!page) continue;
      const wc = (r.body_content || '').split(/\s+/).length;
      await safeUpdate(svc, 'RankPage', page.id, {
        title: r.title || page.title,
        meta_description: r.meta_description || page.meta_description,
        headline: r.headline || page.headline,
        body_content: r.body_content || page.body_content,
        faq: r.faq || page.faq,
        word_count: wc,
        last_refreshed: now,
        status: 'refreshing'
      }, `refresh-${page.id}`);
      updatedCount++;
    }
    log(`Refreshed ${updatedCount} pages`);

    // Update content score on engine
    const allPages = await svc.entities.RankPage.filter({ engine_id: engineId });
    const avgWordCount = allPages.reduce((a, p) => a + (p.word_count || 0), 0) / (allPages.length || 1);
    const contentScore = Math.min(100, Math.round(avgWordCount / 10));
    await safeUpdate(svc, 'RankEngine', engineId, {
      content_score: contentScore,
      last_run_at: now,
      logs: [...(engine.logs || []), ...logs].slice(-20)
    }, 'engine-refresh-update');

    return Response.json({
      ok: true,
      engine_id: engineId,
      refreshed: updatedCount,
      stale_remaining: stalePages.length - updatedCount,
      content_score: contentScore,
      logs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}