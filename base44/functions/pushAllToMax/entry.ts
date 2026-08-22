import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Push every domain as far through the 10-stage pipeline as possible in one shot.
// Runs: rank engine (keywords+pages) → citations → backlinks → outreach → IndexNow → live tracking
// This maximizes every domain's pipeline progress immediately.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit) || 8, 1), 20);

    const domains = await svc.entities.DomainPortfolio.list('-created_date', 200);
    // Only process domains that still have work to do — skip fully-pushed and
    // failed. Capping the batch prevents gateway 524 timeouts on large
    // portfolios; the nightly workflow re-invokes until has_more is false.
    const needsWork = domains.filter(d =>
      d.status !== 'failed' &&
      ((d.keywords_count || 0) === 0 || (d.pages_count || 0) === 0 ||
       (d.citations_count || 0) === 0 || (d.backlinks_count || 0) === 0)
    );
    const batch = needsWork.slice(0, limit);
    const hasMore = needsWork.length > batch.length;
    const results = [];

    for (const d of batch) {
      const r = { domain: d.domain, stages_pushed: [] };

      // Skip failed domains
      if (d.status === 'failed') {
        r.skipped = 'failed status';
        results.push(r);
        continue;
      }

      // ---- Stage 1-2: Ensure engine exists (launch if needed) ----
      if (!d.engine_id) {
        try {
          const launchRes = await base44.functions.invoke('launchDomainPortfolio', {
            portfolio_id: d.id,
            niche: d.niche,
          });
          const updated = await svc.entities.DomainPortfolio.get(d.id);
          d.engine_id = updated.engine_id;
          r.stages_pushed.push('launched');
        } catch (e) {
          r.error = `launch failed: ${e.message}`;
          results.push(r);
          continue;
        }
      }

      if (!d.engine_id) {
        r.skipped = 'no engine_id after launch';
        results.push(r);
        continue;
      }

      // ---- Stage 3-5: Run rank engine to generate keywords + pages ----
      if ((d.keywords_count || 0) === 0 || (d.pages_count || 0) === 0) {
        try {
          await base44.functions.invoke('runRankEngine', {
            action: 'run',
            engine_id: d.engine_id,
          });
          r.stages_pushed.push('keywords+pages_generated');
        } catch (e) {
          r.errors = r.errors || [];
          r.errors.push(`rank_engine: ${e.message}`);
        }
      }

      // ---- Stage 6: Build citations ----
      if ((d.citations_count || 0) === 0) {
        try {
          await base44.functions.invoke('buildCitationPlan', {
            portfolio_id: d.id,
            niche: d.niche,
          });
          r.stages_pushed.push('citations_built');
        } catch (e) {
          r.errors = r.errors || [];
          r.errors.push(`citations: ${e.message}`);
        }
      }

      // ---- Stage 7: Prospect backlinks ----
      if ((d.backlinks_count || 0) === 0) {
        try {
          await base44.functions.invoke('prospectBacklinks', {
            portfolio_id: d.id,
            niche: d.niche,
            limit: 15,
          });
          r.stages_pushed.push('backlinks_prospected');
        } catch (e) {
          r.errors = r.errors || [];
          r.errors.push(`backlinks: ${e.message}`);
        }
      }

      // ---- Stage 8: Send outreach ----
      try {
        await base44.functions.invoke('sendOutreach', { portfolio_id: d.id });
        r.stages_pushed.push('outreach_sent');
      } catch (e) {
        r.errors = r.errors || [];
        r.errors.push(`outreach: ${e.message}`);
      }

      // ---- IndexNow: Submit all pages for instant indexing ----
      try {
        await base44.functions.invoke('submitIndexNow', { portfolio_id: d.id });
        r.stages_pushed.push('indexnow_submitted');
      } catch (e) {
        r.errors = r.errors || [];
        r.errors.push(`indexnow: ${e.message}`);
      }

      // ---- Stage 9: Track live rankings ----
      try {
        await base44.functions.invoke('trackLiveRankings', { portfolio_id: d.id });
        r.stages_pushed.push('rankings_tracked');
      } catch (e) {
        r.errors = r.errors || [];
        r.errors.push(`tracking: ${e.message}`);
      }

      // ---- Log the push ----
      const logEntry = `[${new Date().toISOString()}] Pipeline push: ${r.stages_pushed.join(', ')}`;
      await svc.entities.DomainPortfolio.update(d.id, {
        logs: [...(d.logs || []), logEntry].slice(-20),
      });

      results.push(r);
    }

    // Summary
    const summary = {
      total: results.length,
      pushed: results.filter(r => r.stages_pushed.length > 0).length,
      skipped: results.filter(r => r.skipped).length,
      failed: results.filter(r => r.error).length,
      has_more: hasMore,
      remaining: needsWork.length - batch.length,
    };

    return Response.json({ ok: true, summary, results });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}