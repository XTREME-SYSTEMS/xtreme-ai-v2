import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const logs = [];
    const log = (m) => { logs.push(m); };

    // Admin-only
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {}

    const normalize = (url) => {
      if (!url) return null;
      return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase().trim();
    };

    // ---- Load existing portfolio domains (dedup set) ----
    const existing = await svc.entities.DomainPortfolio.list('-created_date', 500);
    const existingDomains = new Set(existing.map(p => p.domain.toLowerCase()));
    log(`Existing portfolio: ${existing.length} domains`);

    const discovered = []; // {domain, niche, engine_id?, project_id?, site_url?, source}

    // ---- 1. Scan RankEngine campaigns ----
    try {
      const engines = await svc.entities.RankEngine.list('-created_date', 200);
      log(`Scanning ${engines.length} RankEngine campaigns...`);
      for (const e of engines) {
        const domain = normalize(e.site_url);
        if (!domain) continue;
        if (existingDomains.has(domain)) {
          // Link engine_id if missing
          const p = existing.find(p => p.domain === domain);
          if (p && !p.engine_id) {
            await svc.entities.DomainPortfolio.update(p.id, { engine_id: e.id, niche: p.niche || e.niche || '' });
            log(`Linked engine to existing: ${domain}`);
          }
          continue;
        }
        existingDomains.add(domain);
        discovered.push({
          domain,
          tld: '.' + domain.split('.').slice(-1)[0],
          niche: e.niche || '',
          engine_id: e.id,
          site_url: e.site_url,
          status: 'deployed',
          keywords_count: e.target_keywords_count || 0,
          pages_count: e.pages_generated || 0,
          source: 'rank_engine',
        });
      }
    } catch (e) { log(`RankEngine scan failed: ${e.message}`); }

    // ---- 2. Scan CloneProjects ----
    try {
      const projects = await svc.entities.CloneProject.list('-created_date', 200);
      log(`Scanning ${projects.length} CloneProjects...`);
      for (const p of projects) {
        const domain = normalize(p.selected_domain || p.target_url);
        if (!domain) continue;
        if (existingDomains.has(domain)) {
          // Link project_id if missing
          const existing_p = existing.find(ep => ep.domain === domain);
          if (existing_p && !existing_p.project_id) {
            await svc.entities.DomainPortfolio.update(existing_p.id, { project_id: p.id, niche: existing_p.niche || p.industry || '' });
            log(`Linked project to existing: ${domain}`);
          }
          continue;
        }
        existingDomains.add(domain);
        discovered.push({
          domain,
          tld: '.' + domain.split('.').slice(-1)[0],
          niche: p.industry || '',
          project_id: p.id,
          site_url: p.selected_domain ? `https://${domain}` : undefined,
          status: p.current_step === 'complete' ? 'deployed' : 'launching',
          source: 'clone_project',
        });
      }
    } catch (e) { log(`CloneProject scan failed: ${e.message}`); }

    // ---- 3. Scan Markets ----
    try {
      const markets = await svc.entities.Market.list('-created_date', 200);
      log(`Scanning ${markets.length} Markets...`);
      for (const m of markets) {
        const domain = normalize(m.domain);
        if (!domain) continue;
        if (existingDomains.has(domain)) continue;
        existingDomains.add(domain);
        discovered.push({
          domain,
          tld: '.' + domain.split('.').slice(-1)[0],
          niche: m.brand_name || '',
          site_url: m.domain ? `https://${domain}` : undefined,
          status: m.status === 'published' ? 'deployed' : 'acquired',
          source: 'market',
        });
      }
    } catch (e) { log(`Market scan failed: ${e.message}`); }

    // ---- Bulk create discovered ----
    let created = 0;
    if (discovered.length) {
      const records = discovered.map(d => ({
        domain: d.domain,
        tld: d.tld,
        niche: d.niche,
        engine_id: d.engine_id || '',
        project_id: d.project_id || '',
        site_url: d.site_url || '',
        status: d.status,
        keywords_count: d.keywords_count || 0,
        pages_count: d.pages_count || 0,
        acquired_date: new Date().toISOString().slice(0, 10),
        notes: `Auto-discovered from ${d.source}`,
        logs: [`Auto-discovered from ${d.source}`],
      }));
      await svc.entities.DomainPortfolio.bulkCreate(records);
      created = records.length;
      log(`Created ${created} new portfolio records`);
    }

    return Response.json({
      ok: true,
      discovered: discovered.map(d => ({ domain: d.domain, source: d.source, niche: d.niche })),
      created,
      existing_linked: logs.filter(l => l.startsWith('Linked')).length,
      logs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}