import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const logs = [];
    const log = (m) => { logs.push(m); };

    // Admin-only
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {}

    const svc = base44.asServiceRole;

    // ---- Resolve or create portfolio record ----
    let portfolio;
    if (body.portfolio_id) {
      portfolio = await svc.entities.DomainPortfolio.get(body.portfolio_id);
    } else if (body.domain) {
      const existing = await svc.entities.DomainPortfolio.filter({ domain: body.domain });
      if (existing.length) {
        portfolio = existing[0];
        log(`Found existing portfolio record for ${body.domain}`);
      } else {
        const domain = body.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
        const tld = body.tld || ('.' + domain.split('.').slice(-1)[0]);
        portfolio = await svc.entities.DomainPortfolio.create({
          domain,
          tld,
          niche: body.niche || '',
          status: 'launching',
          acquired_date: new Date().toISOString().slice(0, 10),
          logs: [`Portfolio record created`],
        });
        log(`Created portfolio record for ${domain}`);
      }
    } else {
      return Response.json({ error: 'Provide portfolio_id or domain' }, { status: 400 });
    }

    // ---- Update status to launching ----
    await svc.entities.DomainPortfolio.update(portfolio.id, {
      status: 'launching',
      logs: [...(portfolio.logs || []), 'Launch started'].slice(-20),
    });

    const domain = portfolio.domain;
    const niche = portfolio.niche || body.niche || 'general';
    const siteUrl = body.site_url || portfolio.site_url || `https://${domain}`;

    // ---- 1. Create RankEngine campaign ----
    log('Creating RankEngine campaign...');
    let engineId = portfolio.engine_id;
    if (!engineId) {
      try {
        const engineRes = await base44.functions.invoke('runRankEngine', {
          action: 'start',
          site_name: domain.replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          site_url: siteUrl,
          niche,
          cities: body.cities || ['near me'],
          services: body.services || [],
        });
        engineId = engineRes?.data?.engine_id || engineRes?.engine_id;
        log(`RankEngine campaign created: ${engineId}`);
      } catch (e) {
        log(`RankEngine creation failed: ${e.message}`);
      }
    } else {
      log(`Using existing RankEngine: ${engineId}`);
    }

    // ---- 2. Submit to Google Search Console ----
    log('Submitting to Google Search Console...');
    let gscResult = null;
    try {
      const gscRes = await base44.functions.invoke('submitToGSC', { portfolio_id: portfolio.id });
      gscResult = gscRes?.data || gscRes;
      log(`GSC: verified=${gscResult?.verified}, sitemap=${gscResult?.sitemap_submitted}`);
    } catch (e) {
      log(`GSC submission failed: ${e.message}`);
    }

    // ---- 3. Update portfolio record ----
    const update = {
      engine_id: engineId || '',
      site_url: siteUrl,
      status: gscResult?.verified ? 'active' : 'deployed',
      gsc_verified: gscResult?.verified || false,
      gsc_sitemap_submitted: gscResult?.sitemap_submitted || false,
      deployed_date: new Date().toISOString().slice(0, 10),
      logs: [...(portfolio.logs || []), ...logs].slice(-20),
    };
    await svc.entities.DomainPortfolio.update(portfolio.id, update);

    return Response.json({
      ok: true,
      portfolio_id: portfolio.id,
      domain,
      engine_id: engineId,
      gsc: gscResult,
      logs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}