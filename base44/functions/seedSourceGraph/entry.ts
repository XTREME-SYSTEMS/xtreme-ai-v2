// seedSourceGraph — Seeds the SourceNode graph with the expanded source
// library from the Construction AI Growth OS Master Workbook. Creates
// SourceNode records for each source (idempotent — skips existing URLs).
// This is the initial seed; the recursive discovery engine expands it.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { WORKBOOK_SEED_SOURCES } from '../../shared/workbookSeedSources.ts';

const SOURCE_CATEGORIES = {
  'directory': 'directory', 'social': 'social', 'marketplace': 'marketplace',
  'forum': 'forum', 'bid_board': 'bid_board', 'plan_room': 'plan_room',
  'procurement': 'procurement', 'permit': 'permit', 'property': 'property',
  'cre': 'cre', 'foreclosure': 'foreclosure', 'news': 'news',
  'association': 'association', 'chamber': 'association', 'public_notice': 'public_notice',
  'search_engine': 'search_engine',
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let user;
    try { user = await base44.auth.me(); } catch {}
    const svc = base44.asServiceRole;
    const { client_email, force = false } = body;

    const ownerEmail = client_email || user?.email;
    if (!ownerEmail) {
      return Response.json({ error: 'No client_email or authenticated user' }, { status: 400 });
    }

    // Check existing source nodes
    const existing = await svc.entities.SourceNode.filter(
      { client_email: ownerEmail },
      '-created_date',
      500
    );
    const existingUrls = new Set((existing || []).map(s => s.url));

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const src of WORKBOOK_SEED_SOURCES) {
      if (!force && existingUrls.has(src.url)) {
        skipped++;
        continue;
      }
      try {
        await svc.entities.SourceNode.create({
          client_email: ownerEmail,
          source_type: src.source_type,
          category: src.category,
          name: src.name,
          url: src.url,
          geo_coverage: src.geo_coverage,
          service_relevance: src.service_relevance,
          parent_source_id: null,
          discovery_depth: 0,
          discovered_via: 'seed',
          quality_score: src.priority === 'High' ? 75 : src.priority === 'Medium' ? 50 : 30,
          active: true,
          verified: false,
          discovered_at: new Date().toISOString(),
        });
        created++;
      } catch (e) {
        errors.push({ name: src.name, error: e?.message || 'create failed' });
      }
    }

    return Response.json({
      ok: true,
      total_sources: WORKBOOK_SEED_SOURCES.length,
      created,
      skipped,
      errors: errors.length,
    });
  } catch (error) {
    console.error('seedSourceGraph error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}