// seedLeadSources — Seeds the lead source library on first run so the
// system has real sources to scrape immediately. Idempotent — checks for
// existing sources by name + client_email before creating.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { ALL_SEED_SOURCES } from '../../shared/seedSources.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let user;
    try { user = await base44.auth.me(); } catch {}
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const clientEmail = body.client_email || user.email;
    const { force = false } = body;

    // Check what's already seeded for this client
    const existing = await svc.entities.LeadSource.filter({ client_email: clientEmail }, '-created_date', 200);
    const existingNames = new Set((existing || []).map(s => s.source_name));

    if (existingNames.size >= ALL_SEED_SOURCES.length && !force) {
      return Response.json({
        ok: true,
        already_seeded: true,
        existing_count: existingNames.size,
        created: 0,
      });
    }

    const created = [];
    const skipped = [];
    for (const src of ALL_SEED_SOURCES) {
      if (existingNames.has(src.source_name)) {
        skipped.push(src.source_name);
        continue;
      }
      try {
        const rec = await svc.entities.LeadSource.create({
          client_email: clientEmail,
          source_type: src.source_type,
          source_name: src.source_name,
          source_url: src.source_url,
          location: src.location,
          service_keywords: src.service_keywords,
          scrape_frequency: src.scrape_frequency,
          active: true,
        });
        created.push(rec.id);
      } catch (e) {
        console.log(`Failed to seed ${src.source_name}: ${e?.message || e}`);
      }
    }

    return Response.json({
      ok: true,
      created: created.length,
      skipped: skipped.length,
      created_ids: created,
    });
  } catch (error) {
    console.error('seedLeadSources error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}