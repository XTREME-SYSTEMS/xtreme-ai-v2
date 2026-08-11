import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeUpdate } from '../../shared/resilience.ts';

// Bulk GSC submission + verification.
// action: "get_tokens" (default) — gets DNS TXT tokens for all unverified domains
// action: "verify_all" — checks verification + adds to GSC + submits sitemaps
// action: "all" — does both in one pass
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'get_tokens';
    const logs = [];
    const log = (m) => { logs.push(m); };

    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {}

    const svc = base44.asServiceRole;

    // Get GSC connection
    let accessToken;
    try {
      const connection = await svc.connectors.getConnection('google_search_console');
      accessToken = connection.accessToken;
    } catch (e) {
      return Response.json({ error: 'Google Search Console not connected', detail: e.message }, { status: 400 });
    }

    // Get all unverified portfolios (or all if action is "all")
    const portfolios = await svc.entities.DomainPortfolio.list('-created_date', 200);
    const targets = action === 'all'
      ? portfolios
      : portfolios.filter(p => !p.gsc_verified);

    log(`Processing ${targets.length} domains (action: ${action})`);

    const tokens = [];      // DNS TXT records to add
    const verified = [];    // Domains that got verified this run
    const failed = [];      // Domains that failed

    for (const p of targets) {
      const domain = p.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
      const scDomain = `sc-domain:${domain}`;
      const urlPrefix = `https://${domain}`;

      try {
        // ---- Phase 1: Get DNS TXT verification token ----
        if (action === 'get_tokens' || action === 'all') {
          // Check if already verified as domain property
          const checkRes = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(scDomain)}`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
          );

          if (checkRes.ok) {
            const siteInfo = await checkRes.json();
            const level = siteInfo.permissionLevel || '';
            if (['siteOwner', 'siteFullUser', 'siteRestrictedUser'].includes(level)) {
              log(`${domain} already verified in GSC`);
              await safeUpdate(svc, 'DomainPortfolio', p.id, {
                gsc_verified: true,
                gsc_property_url: scDomain,
                status: 'gsc_submitted',
                logs: [...(p.logs || []), `${domain} already verified in GSC`].slice(-20)
              }, `portfolio-${p.id}`);
              verified.push({ domain, method: 'already_verified' });
              continue;
            }
          }

          // Request DNS TXT verification token via Site Verification API
          const tokenRes = await fetch(
            'https://www.googleapis.com/siteVerification/v1/token',
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                verificationMethod: 'DNS_TXT',
                site: { type: 'INET_DOMAIN', identifier: domain }
              })
            }
          );

          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            const txtRecord = tokenData.token;
            tokens.push({
              domain,
              portfolio_id: p.id,
              txt_record: txtRecord,
              dns_host: '@',
              dns_type: 'TXT',
              instructions: `Add a TXT record to ${domain} DNS: @ IN TXT "${txtRecord}"`
            });
            log(`Got DNS TXT token for ${domain}`);
          } else {
            const errText = await tokenRes.text();
            // Fallback: try URL-prefix property with meta tag
            const metaTokenRes = await fetch(
              `https://www.googleapis.com/siteVerification/v1/token`,
              {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  verificationMethod: 'META',
                  site: { type: 'SITE', identifier: urlPrefix }
                })
              }
            );
            if (metaTokenRes.ok) {
              const metaTokenData = await metaTokenRes.json();
              tokens.push({
                domain,
                portfolio_id: p.id,
                method: 'meta_tag',
                meta_tag: `<meta name="google-site-verification" content="${metaTokenData.token}" />`,
                instructions: `Add this meta tag to ${domain} <head>: <meta name="google-site-verification" content="${metaTokenData.token}" />`
              });
              log(`Got meta tag token for ${domain} (DNS TXT failed)`);
            } else {
              log(`Token request failed for ${domain}: ${errText.slice(0, 100)}`);
              failed.push({ domain, error: errText.slice(0, 200) });
            }
          }
        }

        // ---- Phase 2: Verify + add to GSC + submit sitemap ----
        if (action === 'verify_all' || action === 'all') {
          // Try to verify via Site Verification API
          const verifyRes = await fetch(
            'https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=DNS_TXT',
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                site: { type: 'INET_DOMAIN', identifier: domain }
              })
            }
          );

          let isVerified = false;
          if (verifyRes.ok) {
            isVerified = true;
            log(`${domain} verified via DNS TXT`);
          } else {
            // Check if already verified
            const checkRes = await fetch(
              `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(scDomain)}`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (checkRes.ok) {
              const siteInfo = await checkRes.json();
              const level = siteInfo.permissionLevel || '';
              isVerified = ['siteOwner', 'siteFullUser', 'siteRestrictedUser'].includes(level);
            }
          }

          if (isVerified) {
            // Add domain property to GSC
            await fetch(
              `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(scDomain)}`,
              { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
            );

            // Submit sitemap
            let sitemapOk = false;
            try {
              const sitemapRes = await fetch(
                `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(scDomain)}/sitemaps/${encodeURIComponent('sitemap.xml')}`,
                { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
              );
              sitemapOk = sitemapRes.ok;
            } catch {}

            await safeUpdate(svc, 'DomainPortfolio', p.id, {
              gsc_verified: true,
              gsc_property_url: scDomain,
              gsc_sitemap_submitted: sitemapOk,
              gsc_indexing_requested: true,
              status: 'gsc_submitted',
              logs: [...(p.logs || []), `${domain} verified + sitemap submitted`].slice(-20)
            }, `portfolio-${p.id}`);

            verified.push({ domain, sitemap_submitted: sitemapOk });
            log(`${domain}: verified + GSC property added + sitemap ${sitemapOk ? 'submitted' : 'failed'}`);
          } else {
            log(`${domain} not yet verified — DNS TXT may not have propagated`);
            failed.push({ domain, error: 'DNS TXT not propagated yet' });
          }
        }
      } catch (e) {
        log(`Error on ${domain}: ${e.message}`);
        failed.push({ domain, error: e.message });
      }
    }

    log(`Done: ${tokens.length} tokens, ${verified.length} verified, ${failed.length} failed`);

    return Response.json({
      ok: true,
      action,
      tokens,
      verified,
      failed,
      summary: {
        total: targets.length,
        tokens_needed: tokens.length,
        verified: verified.length,
        failed: failed.length,
      },
      logs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}