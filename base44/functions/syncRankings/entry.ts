import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const logs = [];
    const log = (m) => { logs.push(m); };

    const svc = base44.asServiceRole;

    // ---- Get GSC connection ----
    let connection;
    try {
      connection = await svc.connectors.getConnection('google_search_console');
    } catch (e) {
      return Response.json({ error: 'Google Search Console not connected. Authorize the connector first.', logs }, { status: 400 });
    }
    const accessToken = connection.accessToken;

    // ---- List verified sites ----
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!sitesRes.ok) {
      const errText = await sitesRes.text();
      return Response.json({ error: `GSC sites list failed: ${sitesRes.status}`, detail: errText, logs }, { status: 502 });
    }
    const sitesData = await sitesRes.json();
    const sites = sitesData.siteEntry || [];
    log(`Found ${sites.length} verified GSC sites`);

    // ---- Determine which engines to sync ----
    let engines;
    if (body.engine_id) {
      engines = [await svc.entities.RankEngine.get(body.engine_id)];
    } else {
      engines = await svc.entities.RankEngine.filter({ status: 'active' });
    }
    if (!engines.length) return Response.json({ ok: true, message: 'No active campaigns to sync', logs });

    const today = new Date();
    const endDate = today.toISOString().slice(0, 10);
    const startDate = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    let totalSynced = 0;
    let enginesUpdated = 0;

    for (const engine of engines) {
      // Find matching GSC site by hostname
      const engineHost = (engine.site_url || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '').toLowerCase();
      if (!engineHost) { log(`Skip ${engine.site_name} — no site_url`); continue; }
      const site = sites.find(s => {
        const host = s.siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '').toLowerCase();
        return host === engineHost;
      });
      if (!site) { log(`No GSC site match for ${engine.site_name} (${engineHost})`); continue; }

      // ---- Query search analytics (last 28 days, by query) ----
      const siteUrlEncoded = encodeURIComponent(site.siteUrl);
      const queryRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${siteUrlEncoded}/searchAnalytics/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 5000 })
      });
      if (!queryRes.ok) { log(`Query failed for ${engine.site_name}: ${queryRes.status}`); continue; }
      const queryData = await queryRes.json();
      const rows = queryData.rows || [];
      log(`GSC returned ${rows.length} queries for ${engine.site_name}`);

      // Build keyword -> metrics map
      const gscMap = {};
      for (const row of rows) {
        gscMap[row.keys[0].toLowerCase()] = {
          position: Math.round(row.position * 10) / 10,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: Math.round(row.ctr * 10000) / 100
        };
      }

      // ---- Match against tracked keywords ----
      const tracked = await svc.entities.RankKeyword.filter({ engine_id: engine.id });
      const updates = [];
      let pageOneCount = 0;
      let rankingCount = 0;

      for (const kw of tracked) {
        const kwLower = kw.keyword.toLowerCase();
        let match = gscMap[kwLower];
        // Fallback: partial match (tracked keyword contained in a GSC query)
        if (!match) {
          const partialKey = Object.keys(gscMap).find(k => k.includes(kwLower) || kwLower.includes(k));
          if (partialKey) match = gscMap[partialKey];
        }

        if (match) {
          const prevPos = kw.current_position || null;
          let status = 'tracking';
          if (match.position <= 10) { status = 'page_one'; pageOneCount++; }
          else if (match.position <= 100) { status = 'ranking'; rankingCount++; }
          updates.push({
            id: kw.id,
            previous_position: prevPos,
            current_position: match.position,
            impressions: match.impressions,
            clicks: match.clicks,
            ctr: match.ctr,
            last_checked: new Date().toISOString(),
            status
          });
        } else {
          // No GSC data — mark stalled if it previously ranked, otherwise just timestamp
          updates.push({
            id: kw.id,
            previous_position: kw.current_position || null,
            last_checked: new Date().toISOString(),
            status: kw.current_position ? 'stalled' : kw.status
          });
        }
      }

      if (updates.length) {
        await svc.entities.RankKeyword.bulkUpdate(updates);
        totalSynced += updates.length;
      }

      // ---- Update engine with real ranking progress ----
      const realAuthorityBoost = Math.round((pageOneCount * 5) + (rankingCount * 2));
      await svc.entities.RankEngine.update(engine.id, {
        authority_score: Math.max(engine.authority_score || 0, realAuthorityBoost),
        logs
      });
      log(`${engine.site_name}: ${pageOneCount} page-one, ${rankingCount} ranking, ${updates.length} synced`);
      enginesUpdated++;
    }

    return Response.json({
      ok: true,
      engines_synced: enginesUpdated,
      keywords_synced: totalSynced,
      gsc_sites: sites.length,
      logs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}