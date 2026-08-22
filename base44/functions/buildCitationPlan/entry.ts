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

    // ---- Resolve portfolio ----
    let portfolio;
    if (body.portfolio_id) {
      portfolio = await svc.entities.DomainPortfolio.get(body.portfolio_id);
    } else if (body.domain) {
      const existing = await svc.entities.DomainPortfolio.filter({ domain: body.domain });
      portfolio = existing[0];
    }
    if (!portfolio) {
      return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const domain = portfolio.domain;
    const niche = portfolio.niche || body.niche || 'general';
    const engineId = portfolio.engine_id;

    if (!engineId) {
      return Response.json({ error: 'No RankEngine campaign linked. Launch the domain first.' }, { status: 400 });
    }

    log(`Building citation plan for ${domain} (engine: ${engineId}, niche: ${niche})`);

    // ---- 1. Generate NAP data via LLM ----
    log('Generating NAP (Name, Address, Phone) data...');
    let nap = null;
    try {
      const napRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Generate realistic NAP (Name, Address, Phone) data for a local ${niche} business whose website is ${domain}. Infer a plausible US city/region from the domain name if it contains a location hint, otherwise pick a major US metro. The business should sound like a real local ${niche} contractor. Return JSON with: business_name, phone (US format like 555-123-4567), address (street number + name), city, state (2-letter code), zip (5-digit), short_description (one sentence about the ${niche} service they offer).`,
        response_json_schema: {
          type: 'object',
          properties: {
            business_name: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip: { type: 'string' },
            short_description: { type: 'string' },
          },
        },
      });
      nap = napRes;
      log(`NAP generated: ${nap.business_name} — ${nap.address}, ${nap.city}, ${nap.state} ${nap.zip}`);
    } catch (e) {
      log(`NAP generation failed: ${e.message}`);
    }

    // ---- 2. Load directory catalog ----
    const directories = await svc.entities.CitationDirectory.filter({ status: 'active' });
    log(`Loaded ${directories.length} active directories from catalog`);

    // ---- 3. Check existing citations to avoid duplicates ----
    const existing = await svc.entities.RankCitation.filter({ engine_id: engineId });
    const existingNames = new Set(existing.map((c) => c.source_name));
    log(`Existing citation records: ${existing.length}`);

    // ---- 4. Create RankCitation records for new directories ----
    const toCreate = directories
      .filter((d) => !existingNames.has(d.name))
      .map((d) => ({
        engine_id: engineId,
        source_name: d.name,
        source_url: d.url,
        category: d.category,
        domain_authority: d.domain_authority || 0,
        status: 'pending',
        notes: d.requires_gbp ? 'Requires Google Business Profile' : (d.auto_submittable ? 'Auto-submittable' : ''),
      }));

    let created = 0;
    if (toCreate.length) {
      await base44.entities.RankCitation.bulkCreate(toCreate);
      created = toCreate.length;
      log(`Created ${created} new citation records`);
    } else {
      log('All catalog directories already have citation records');
    }

    const totalCount = existing.length + created;

    // ---- 5. Update portfolio ----
    await svc.entities.DomainPortfolio.update(portfolio.id, {
      citations_count: totalCount,
      logs: [...(portfolio.logs || []), `Citation plan built: ${totalCount} citations (${created} new) — ${new Date().toISOString().slice(0, 16)}`].slice(-20),
    });

    log(`Done. ${totalCount} total citations tracked for ${domain}.`);

    return Response.json({
      ok: true,
      portfolio_id: portfolio.id,
      domain,
      niche,
      nap,
      citations_total: totalCount,
      citations_created: created,
      logs,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}