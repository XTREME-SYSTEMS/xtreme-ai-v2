import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Submits URLs to IndexNow API for instant Bing/Yandex indexing.
// Fills the "IndexNow API" and "Bing instant indexing" methods in the checklist.
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
        '-created_date', 100
      );
    }

    const indexNowKey = crypto.randomUUID();
    const results = [];

    for (const p of portfolios) {
      if (!p.site_url && !p.domain) {
        results.push({ domain: p.domain, status: 'skipped', reason: 'no url' });
        continue;
      }

      const siteUrl = p.site_url || `https://${p.domain}`;
      let host, origin;
      try {
        const u = new URL(siteUrl);
        host = u.host;
        origin = u.origin;
      } catch {
        results.push({ domain: p.domain, status: 'skipped', reason: 'invalid url' });
        continue;
      }

      const urlList = [siteUrl, `${origin}/sitemap.xml`];

      // Also submit any deployed RankPage URLs
      if (p.engine_id) {
        try {
          const pages = await svc.entities.RankPage.filter(
            { engine_id: p.engine_id, status: 'deployed' },
            '-created_date', 50
          );
          pages.forEach(pg => { if (pg.deployed_url) urlList.push(pg.deployed_url); });
        } catch {}
      }

      try {
        const resp = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host,
            key: indexNowKey,
            keyLocation: `${origin}/${indexNowKey}.txt`,
            urlList: urlList.slice(0, 10000),
          }),
        });

        results.push({
          domain: p.domain,
          status: resp.status === 200 ? 'submitted' : resp.status === 202 ? 'accepted' : 'failed',
          statusCode: resp.status,
          urls_submitted: urlList.length,
        });
      } catch (e) {
        results.push({ domain: p.domain, status: 'error', error: e.message });
      }
    }

    return Response.json({
      ok: true,
      key: indexNowKey,
      key_file: `${indexNowKey}.txt`,
      portfolios_processed: results.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}