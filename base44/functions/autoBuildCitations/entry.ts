import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Orchestrator: auto-builds local citation plans for ALL active portfolio sites.
// Creates RankCitation records across all major directories for each site.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Get all active portfolio sites with a linked rank engine
    const portfolios = await svc.entities.DomainPortfolio.filter(
      { status: { $in: ['active', 'gsc_submitted', 'ranking', 'deployed'] } },
      '-created_date', 200
    );

    // Load directory catalog once
    const directories = await svc.entities.CitationDirectory.filter({ status: 'active' });

    const results = [];
    for (const p of portfolios) {
      if (!p.engine_id) continue;
      try {
        // Check existing citations to avoid duplicates
        const existing = await svc.entities.RankCitation.filter({ engine_id: p.engine_id });
        const existingNames = new Set(existing.map(c => c.source_name));

        // Create missing citation records
        const toCreate = directories
          .filter(d => !existingNames.has(d.name))
          .map(d => ({
            engine_id: p.engine_id,
            source_name: d.name,
            source_url: d.url,
            category: d.category,
            domain_authority: d.domain_authority || 0,
            status: 'pending',
            notes: d.requires_gbp ? 'Requires Google Business Profile' : (d.auto_submittable ? 'Auto-submittable' : ''),
          }));

        let created = 0;
        if (toCreate.length > 0) {
          await svc.entities.RankCitation.bulkCreate(toCreate);
          created = toCreate.length;
        }

        const total = existing.length + created;
        await svc.entities.DomainPortfolio.update(p.id, {
          citations_count: total,
          logs: [...(p.logs || []), `Auto-citation build: ${total} citations (${created} new) — ${new Date().toISOString().slice(0, 16)}`].slice(-20),
        });

        results.push({ domain: p.domain, citations_total: total, new: created });
      } catch (e) {
        results.push({ domain: p.domain, error: e.message });
      }
    }

    return Response.json({
      ok: true,
      sites_processed: results.length,
      directories_available: directories.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}