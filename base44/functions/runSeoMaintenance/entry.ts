import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeUpdate } from '../../shared/resilience.ts';

// Runs technical SEO audit + content refresh across all active engines.
// Designed to be called by the weekly SEO maintenance workflow.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const logs = [];
    const log = (m) => { logs.push(m); };

    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {}

    const svc = base44.asServiceRole;
    const engines = await svc.entities.RankEngine.filter({ status: 'active' });
    log(`Running SEO maintenance for ${engines.length} active engines`);

    const results = [];

    for (const engine of engines) {
      const result = { engine_id: engine.id, site_name: engine.site_name, audited: 0, refreshed: 0, errors: [] };
      try {
        // 1. Technical SEO audit
        const auditRes = await base44.functions.invoke('runTechnicalSeoAudit', { engine_id: engine.id });
        const auditData = auditRes?.data || auditRes;
        result.audited = auditData?.pages_audited || 0;
        result.avg_seo_score = auditData?.avg_seo_score || 0;
        result.critical_issues = auditData?.critical_issues || 0;
        log(`Audit ${engine.site_name}: score ${result.avg_seo_score}, ${result.critical_issues} critical`);

        // 2. Content refresh
        const refreshRes = await base44.functions.invoke('refreshStaleContent', { engine_id: engine.id });
        const refreshData = refreshRes?.data || refreshRes;
        result.refreshed = refreshData?.refreshed || 0;
        if (result.refreshed > 0) log(`Refreshed ${result.refreshed} stale pages for ${engine.site_name}`);
      } catch (e) {
        result.errors.push(e.message);
        log(`Error on ${engine.site_name}: ${e.message}`);
      }
      results.push(result);
    }

    log(`Maintenance complete: ${results.length} engines processed`);

    return Response.json({
      ok: true,
      engines_processed: results.length,
      total_audited: results.reduce((a, r) => a + r.audited, 0),
      total_refreshed: results.reduce((a, r) => a + r.refreshed, 0),
      results,
      logs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}