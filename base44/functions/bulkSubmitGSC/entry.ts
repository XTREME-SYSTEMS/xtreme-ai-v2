import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeUpdate } from '../../shared/resilience.ts';

// Bulk GSC management using the Webmasters API (webmasters scope only).
// The webmasters scope can add properties + check verification + submit sitemaps,
// but CANNOT retrieve verification tokens (that needs the siteverification scope).
//
// action: "add_all" (default) — bulk-adds all unverified domains as GSC properties
// action: "verify_all" — checks verification status + submits sitemaps for verified ones
// action: "all" — does both
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'add_all';
    const logs = [];
    const log = (m) => { logs.push(m); };

    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {}

    const svc = base44.asServiceRole;

    let accessToken;
    try {
      const connection = await svc.connectors.getConnection('google_search_console');
      accessToken = connection.accessToken;
    } catch (e) {
      return Response.json({ error: 'Google Search Console not connected', detail: e.message }, { status: 400 });
    }

    const portfolios = await svc.entities.DomainPortfolio.list('-created_date', 200);
    const targets = action === 'all'
      ? portfolios
      : portfolios.filter(p => !p.gsc_verified);

    log(`Processing ${targets.length} domains (action: ${action})`);

    const added = [];     // Properties added to GSC this run
    const verified = [];  // Properties confirmed verified this run
    const failed = [];    // Errors

    for (const p of targets) {
      const domain = p.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
      const scDomain = `sc-domain:${domain}`;
      const urlPrefix = `https://${domain}`;
      const isSubdomain = domain.includes('.vercel.app') || domain.includes('.netlify.app') || domain.startsWith('www.');

      try {
        // ---- Phase 1: Add property to GSC ----
        if (action === 'add_all' || action === 'all') {
          let addedProperty = null;

          // For custom domains (not subdomains/www), try domain property first
          if (!isSubdomain) {
            const addDomainRes = await fetch(
              `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(scDomain)}`,
              { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
            );
            if (addDomainRes.ok || addDomainRes.status === 204) {
              addedProperty = { type: 'domain', url: scDomain };
              log(`${domain}: domain property added to GSC`);
            }
          }

          // Also add URL-prefix property (works for all domains including subdomains)
          const addUrlRes = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(urlPrefix)}`,
            { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
          );
          if (addUrlRes.ok || addUrlRes.status === 204) {
            if (!addedProperty) {
              addedProperty = { type: 'url_prefix', url: urlPrefix };
            }
            log(`${domain}: URL-prefix property added to GSC`);
          }

          if (addedProperty) {
            added.push({
              domain,
              portfolio_id: p.id,
              property_type: addedProperty.type,
              gsc_url: `https://search.google.com/search-console?resource_id=${encodeURIComponent(addedProperty.url)}`,
            });
          } else {
            const errText = await addUrlRes.text();
            log(`${domain}: property add failed: ${addUrlRes.status} ${errText.slice(0, 100)}`);
            failed.push({ domain, error: `Property add failed: ${addUrlRes.status}` });
          }
        }

        // ---- Phase 2: Check verification + submit sitemap ----
        if (action === 'verify_all' || action === 'all') {
          let isVerified = false;
          let verifiedPropertyUrl = '';

          // Check domain property first
          if (!isSubdomain) {
            const checkRes = await fetch(
              `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(scDomain)}`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (checkRes.ok) {
              const siteInfo = await checkRes.json();
              const level = siteInfo.permissionLevel || '';
              if (['siteOwner', 'siteFullUser', 'siteRestrictedUser'].includes(level)) {
                isVerified = true;
                verifiedPropertyUrl = scDomain;
              }
            }
          }

          // Check URL-prefix property
          if (!isVerified) {
            const checkRes = await fetch(
              `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(urlPrefix)}`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (checkRes.ok) {
              const siteInfo = await checkRes.json();
              const level = siteInfo.permissionLevel || '';
              if (['siteOwner', 'siteFullUser', 'siteRestrictedUser'].includes(level)) {
                isVerified = true;
                verifiedPropertyUrl = urlPrefix;
              }
            }
          }

          if (isVerified) {
            let sitemapOk = false;
            try {
              const sitemapRes = await fetch(
                `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(verifiedPropertyUrl)}/sitemaps/${encodeURIComponent('sitemap.xml')}`,
                { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
              );
              sitemapOk = sitemapRes.ok;
            } catch {}

            await safeUpdate(svc, 'DomainPortfolio', p.id, {
              gsc_verified: true,
              gsc_property_url: verifiedPropertyUrl,
              gsc_sitemap_submitted: sitemapOk,
              gsc_indexing_requested: true,
              status: 'gsc_submitted',
              logs: [...(p.logs || []), `${domain} verified + sitemap ${sitemapOk ? 'submitted' : 'failed'}`].slice(-20)
            }, `portfolio-${p.id}`);

            verified.push({ domain, sitemap_submitted: sitemapOk, property: verifiedPropertyUrl });
            log(`${domain}: verified ✓ + sitemap ${sitemapOk ? 'submitted' : 'failed'}`);
          } else {
            failed.push({ domain, error: 'Not yet verified — add the DNS TXT record or meta tag in GSC, then run Verify All' });
            log(`${domain}: not yet verified`);
          }
        }
      } catch (e) {
        log(`Error on ${domain}: ${e.message}`);
        failed.push({ domain, error: e.message });
      }
    }

    log(`Done: ${added.length} added, ${verified.length} verified, ${failed.length} failed`);

    return Response.json({
      ok: true,
      action,
      added,
      verified,
      failed,
      gsc_console_url: 'https://search.google.com/search-console',
      summary: {
        total: targets.length,
        added: added.length,
        verified: verified.length,
        failed: failed.length,
      },
      logs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}