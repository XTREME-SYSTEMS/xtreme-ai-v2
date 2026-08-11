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

    // Resolve portfolio record
    let portfolio;
    if (body.portfolio_id) {
      portfolio = await svc.entities.DomainPortfolio.get(body.portfolio_id);
    } else if (body.domain) {
      const existing = await svc.entities.DomainPortfolio.filter({ domain: body.domain });
      if (existing.length) portfolio = existing[0];
    }
    if (!portfolio) {
      return Response.json({ error: 'Portfolio record not found — provide portfolio_id or domain' }, { status: 400 });
    }

    const domain = portfolio.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    const siteUrl = `https://${domain}`;
    const propertyUrl = encodeURIComponent(siteUrl);
    log(`Submitting ${domain} to Google Search Console`);

    // ---- Get GSC connection ----
    let accessToken;
    try {
      const connection = await svc.connectors.getConnection('google_search_console');
      accessToken = connection.accessToken;
    } catch (e) {
      return Response.json({ error: 'Google Search Console not connected', detail: e.message, logs }, { status: 400 });
    }

    // ---- 1. Add the property to GSC ----
    log('Adding property to GSC...');
    const addRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${propertyUrl}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (addRes.ok) {
      log('Property added to GSC');
    } else if (addRes.status === 409) {
      log('Property already exists in GSC');
    } else {
      const errText = await addRes.text();
      log(`Property add returned ${addRes.status}: ${errText.slice(0, 200)}`);
    }

    // ---- 2. Check verification status ----
    let verified = false;
    const getRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${propertyUrl}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (getRes.ok) {
      const siteInfo = await getRes.json();
      const level = siteInfo.permissionLevel || '';
      verified = ['siteOwner', 'siteFullUser', 'siteRestrictedUser'].includes(level);
      log(`Permission level: ${level || 'none'} — verified: ${verified}`);
    } else {
      log(`Property not yet verified (GET returned ${getRes.status})`);
    }

    let sitemapSubmitted = false;
    let indexingStatus = null;

    if (verified) {
      // ---- 3. Submit sitemap ----
      log('Submitting sitemap.xml...');
      const sitemapRes = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${propertyUrl}/sitemaps/${encodeURIComponent('sitemap.xml')}`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        }
      );
      sitemapSubmitted = sitemapRes.ok;
      log(sitemapRes.ok ? 'Sitemap submitted' : `Sitemap submit failed: ${sitemapRes.status}`);

      // ---- 4. Inspect homepage indexing status ----
      try {
        const inspectRes = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${propertyUrl}/urlInspection:index`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inspectionUrl: siteUrl, languageCode: 'en-US' }),
          }
        );
        if (inspectRes.ok) {
          const inspectData = await inspectRes.json();
          indexingStatus = {
            indexStatus: inspectData.inspectionResult?.indexStatusResult?.verdict || 'unknown',
            coverageState: inspectData.inspectionResult?.indexStatusResult?.coverageState || '',
            indexingState: inspectData.inspectionResult?.indexStatusResult?.indexingState || '',
            lastCrawlTime: inspectData.inspectionResult?.indexStatusResult?.lastCrawlTime || '',
          };
          log(`Index status: ${indexingStatus.indexStatus} / ${indexingStatus.coverageState}`);
        }
      } catch (e) {
        log(`URL inspection failed: ${e.message}`);
      }
    } else {
      // ---- Get verification tokens so the user can verify ----
      try {
        const tokenRes = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${propertyUrl}/verificationTokens`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          const tokens = (tokenData.verificationTokens || []).filter(t => t.verificationMethod === 'META_TAG' || t.verificationMethod === 'HTML_TAG');
          if (tokens.length) {
            log(`Verification needed. Add this meta tag to the site <head>: <meta name="google-site-verification" content="${tokens[0].token}" />`);
          }
        }
      } catch {}
    }

    // ---- Update portfolio record ----
    const update = {
      gsc_property_url: siteUrl,
      gsc_verified: verified,
      gsc_sitemap_submitted: sitemapSubmitted,
      gsc_indexing_requested: verified,
      status: verified ? 'gsc_submitted' : 'deployed',
      logs: [...(portfolio.logs || []), ...logs].slice(-20),
    };
    if (verified && portfolio.deployed_date) update.status = 'active';
    await svc.entities.DomainPortfolio.update(portfolio.id, update);

    return Response.json({
      ok: true,
      domain,
      verified,
      sitemap_submitted: sitemapSubmitted,
      indexing_status: indexingStatus,
      logs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}