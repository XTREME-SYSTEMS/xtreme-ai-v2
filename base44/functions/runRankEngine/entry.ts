import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'run';
    const logs = [];
    const log = (m) => { logs.push(m); };

    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch { /* workflow / service-role invocation */ }

    const svc = base44.asServiceRole;

    // ---- Resolve or create the campaign ----
    let engine;
    if (body.engine_id) {
      engine = await svc.entities.RankEngine.get(body.engine_id);
    } else if (action === 'start') {
      if (!body.site_name) return Response.json({ error: 'site_name required' }, { status: 400 });
      engine = await svc.entities.RankEngine.create({
        site_name: body.site_name,
        site_url: body.site_url || '',
        niche: body.niche || 'general',
        cities: body.cities || [],
        services: body.services || [],
        market_id: body.market_id || '',
        project_id: body.project_id || '',
        status: 'active',
        logs: ['Campaign created']
      });
      log(`Campaign created: ${engine.site_name}`);
    } else {
      const list = await svc.entities.RankEngine.filter({ status: 'active' }, '-created_date', 1);
      engine = list[0];
      if (!engine) return Response.json({ error: 'No active campaign' }, { status: 404 });
    }

    await svc.entities.RankEngine.update(engine.id, { status: 'optimizing', last_run_at: new Date().toISOString() });
    const cityList = (engine.cities && engine.cities.length) ? engine.cities.slice(0, 6) : ['[City]'];
    const serviceList = (engine.services && engine.services.length) ? engine.services : [engine.niche || 'service'];

    // ---- 1. Combined keyword + citation discovery (single web-context call) ----
    log('Phase 1: Keyword + citation discovery');
    const discoveryPrompt = `You are an elite local SEO strategist. For the business "${engine.site_name}" in the "${engine.niche}" niche, targeting cities: ${cityList.join(', ')} and services: ${serviceList.join(', ')}, return TWO things:
1) The 15 highest-value local-intent keywords for a brand-new site to reach page one fast (low-difficulty, high-commercial-intent long-tail).
2) The 12 highest-impact citation/backlink sources a new local business should acquire (directories, social, industry, press).
Return JSON: { "keywords": [ { "keyword": string, "city": string, "search_intent": "transactional|commercial|informational", "monthly_volume": number, "difficulty": 0-100 } ], "citations": [ { "source_name": string, "source_url": string, "category": "directory|social|industry|blog_outreach|press", "domain_authority": number, "notes": string } ] }`;
    const discoveryRes = await base44.integrations.Core.InvokeLLM({
      prompt: discoveryPrompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          keywords: { type: 'array', items: { type: 'object', properties: {
            keyword: { type: 'string' }, city: { type: 'string' },
            search_intent: { type: 'string' }, monthly_volume: { type: 'number' }, difficulty: { type: 'number' }
          } } },
          citations: { type: 'array', items: { type: 'object', properties: {
            source_name: { type: 'string' }, source_url: { type: 'string' },
            category: { type: 'string' }, domain_authority: { type: 'number' }, notes: { type: 'string' }
          } } }
        }
      }
    });
    const keywords = discoveryRes.keywords || [];
    const citations = discoveryRes.citations || [];
    log(`Discovered ${keywords.length} keywords, ${citations.length} citation targets`);

    // Persist keywords
    const existingKw = await svc.entities.RankKeyword.filter({ engine_id: engine.id });
    const kwSet = new Set(existingKw.map(k => k.keyword.toLowerCase()));
    const newKw = keywords.filter(k => !kwSet.has(k.keyword.toLowerCase()));
    if (newKw.length) {
      await svc.entities.RankKeyword.bulkCreate(newKw.map(k => ({
        engine_id: engine.id, keyword: k.keyword, city: k.city || '',
        search_intent: k.search_intent || 'transactional', monthly_volume: k.monthly_volume || 0,
        difficulty: k.difficulty || 0, status: 'target', target_position: 10
      })));
    }

    // Persist citations
    const existingCite = await svc.entities.RankCitation.filter({ engine_id: engine.id });
    const citeSet = new Set(existingCite.map(c => c.source_name.toLowerCase()));
    const newCite = citations.filter(c => !citeSet.has(c.source_name.toLowerCase()));
    if (newCite.length) {
      await svc.entities.RankCitation.bulkCreate(newCite.map(c => ({
        engine_id: engine.id, source_name: c.source_name, source_url: c.source_url || '',
        category: c.category || 'directory', domain_authority: c.domain_authority || 0,
        status: 'pending', notes: c.notes || ''
      })));
    }

    // ---- 2. Programmatic page generation + audit (single call) ----
    log('Phase 2: Programmatic pages + audit');
    const topKw = keywords.slice(0, 6);
    let pagesCreated = 0;
    if (topKw.length) {
      const pagePrompt = `You are an elite SEO content writer and auditor. For "${engine.site_name}" (${engine.niche}), generate unique, indexable, E-E-A-T landing-page content for each target keyword (600+ words each, keyword-rich, with H1, body sections, 4 FAQ Q&As). Also audit the overall SEO readiness of this campaign (it has ${keywords.length} keywords, ${topKw.length} pages with JSON-LD + FAQ, and ${citations.length} citation targets). Return JSON: { "pages": [ { "keyword": string, "title": string, "meta_description": string, "headline": string, "body_content": string (HTML), "faq": [ { "question": string, "answer": string } ] } ], "audit": { "technical_seo_score": 0-100, "content_score": 0-100, "authority_score": 0-100, "gaps": [string], "summary": string } }. One page per keyword, same order: ${JSON.stringify(topKw.map(k => k.keyword))}`;
      const pageRes = await base44.integrations.Core.InvokeLLM({
        prompt: pagePrompt,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            pages: { type: 'array', items: { type: 'object', properties: {
              keyword: { type: 'string' }, title: { type: 'string' }, meta_description: { type: 'string' },
              headline: { type: 'string' }, body_content: { type: 'string' },
              faq: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } } } }
            } } },
            audit: { type: 'object', properties: {
              technical_seo_score: { type: 'number' }, content_score: { type: 'number' },
              authority_score: { type: 'number' }, gaps: { type: 'array', items: { type: 'string' } },
              summary: { type: 'string' }
            } }
          }
        }
      });
      const generated = pageRes.pages || [];
      const audit = pageRes.audit || {};
      const toCreate = [];
      for (let i = 0; i < topKw.length; i++) {
        const g = generated.find(x => x.keyword && x.keyword.toLowerCase() === topKw[i].keyword.toLowerCase()) || generated[i];
        if (!g) continue;
        const wordCount = (g.body_content || '').split(/\s+/).length;
        const slug = ((topKw[i].city ? topKw[i].city.toLowerCase() + '-' : '') + topKw[i].keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');
        toCreate.push({
          engine_id: engine.id, page_type: 'city_service', slug, keyword: topKw[i].keyword,
          city: topKw[i].city || '', service: engine.niche || '',
          title: g.title || topKw[i].keyword, meta_description: g.meta_description || '',
          headline: g.headline || g.title || topKw[i].keyword, body_content: g.body_content || '',
          faq: g.faq || [], word_count: wordCount,
          json_ld: { '@context': 'https://schema.org', '@type': 'Service', name: g.title || topKw[i].keyword, description: g.meta_description || '', provider: { '@type': 'LocalBusiness', name: engine.site_name }, areaServed: topKw[i].city || undefined },
          status: 'generated', seo_score: Math.min(100, Math.round(wordCount / 8)),
          last_refreshed: new Date().toISOString()
        });
      }
      if (toCreate.length) {
        await svc.entities.RankPage.bulkCreate(toCreate);
        pagesCreated = toCreate.length;
      }
      log(`Generated ${pagesCreated} pages`);

      // Apply audit scores
      const technicalSeoScore = audit.technical_seo_score || 0;
      const contentScore = audit.content_score || 0;
      const authorityScore = audit.authority_score || 0;
      const overall = Math.round((technicalSeoScore * 0.3) + (contentScore * 0.35) + (authorityScore * 0.35));

      const allKw = await svc.entities.RankKeyword.filter({ engine_id: engine.id });
      const allPages = await svc.entities.RankPage.filter({ engine_id: engine.id });
      const allCite = await svc.entities.RankCitation.filter({ engine_id: engine.id });

      await svc.entities.RankEngine.update(engine.id, {
        status: 'active',
        target_keywords_count: allKw.length,
        pages_generated: allPages.length,
        citations_built: allCite.filter(c => c.status === 'live').length,
        technical_seo_score: technicalSeoScore,
        content_score: contentScore,
        authority_score: authorityScore,
        overall_rank_readiness: overall,
        audit_summary: audit.summary || '',
        gaps: audit.gaps || [],
        next_run_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        logs
      });

      return Response.json({
        ok: true, engine_id: engine.id, site_name: engine.site_name,
        keywords_tracked: allKw.length, pages_generated: allPages.length,
        citation_targets: allCite.length, pages_created_this_run: pagesCreated,
        scores: { technical_seo: technicalSeoScore, content: contentScore, authority: authorityScore, overall_rank_readiness: overall },
        gaps: audit.gaps || [], logs
      });
    }

    await svc.entities.RankEngine.update(engine.id, { status: 'active', logs });
    return Response.json({ ok: true, engine_id: engine.id, message: 'No keywords to generate pages for', logs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}