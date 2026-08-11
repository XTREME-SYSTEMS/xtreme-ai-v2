import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Returns pipeline status for every domain — computes which growth stages
// each domain has completed: acquired → audited → deployed → GSC verified →
// content generated → citations built → backlinks prospected → outreach sent →
// ranking → page one.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const domains = await svc.entities.DomainPortfolio.list('-created_date', 200);

    // Batch-fetch backlink prospects to compute outreach_sent per domain
    const allBacklinks = await svc.entities.BacklinkProspect.list('-created_date', 1000);
    const backlinksByPortfolio = {};
    (allBacklinks || []).forEach(b => {
      const pid = b.portfolio_id || b.engine_id;
      if (pid) {
        if (!backlinksByPortfolio[pid]) backlinksByPortfolio[pid] = [];
        backlinksByPortfolio[pid].push(b);
      }
    });

    // Batch-fetch rank keywords to compute ranking/page_one
    const allKeywords = await svc.entities.RankKeyword.list('-created_date', 1000);
    const keywordsByEngine = {};
    (allKeywords || []).forEach(k => {
      if (k.engine_id) {
        if (!keywordsByEngine[k.engine_id]) keywordsByEngine[k.engine_id] = [];
        keywordsByEngine[k.engine_id].push(k);
      }
    });

    const STAGE_ORDER = [
      'acquired', 'audited', 'deployed', 'gsc_verified', 'content_generated',
      'citations_built', 'backlinks_prospected', 'outreach_sent', 'ranking', 'page_one',
    ];

    const pipeline = domains.map(d => {
      const backlinks = backlinksByPortfolio[d.id] || [];
      const outreachSent = backlinks.some(
        b => ['sent', 'replied', 'accepted', 'follow_up'].includes(b.outreach_status)
      );
      const hasBacklinks = backlinks.length > 0;

      const engineKeywords = d.engine_id ? (keywordsByEngine[d.engine_id] || []) : [];
      const ranking = engineKeywords.some(k => k.current_position > 0);
      const pageOne = engineKeywords.some(k => k.current_position > 0 && k.current_position <= 10);

      const stages = {
        acquired: d.status !== 'failed',
        audited: ['active', 'ranking', 'gsc_submitted', 'deployed'].includes(d.status),
        deployed: !!d.site_url || ['deployed', 'active', 'ranking'].includes(d.status),
        gsc_verified: d.gsc_verified === true,
        content_generated: (d.keywords_count || 0) > 0 && (d.pages_count || 0) > 0,
        citations_built: (d.citations_count || 0) > 0,
        backlinks_prospected: hasBacklinks || (d.backlinks_count || 0) > 0,
        outreach_sent: outreachSent,
        ranking: ranking || (d.best_position || 0) > 0,
        page_one: pageOne || (d.page_one_keywords || 0) > 0,
      };

      // Compute current stage (last completed stage)
      let currentStage = 'acquired';
      let stageIndex = 0;
      for (let i = 0; i < STAGE_ORDER.length; i++) {
        if (stages[STAGE_ORDER[i]]) {
          currentStage = STAGE_ORDER[i];
          stageIndex = i;
        } else {
          break;
        }
      }

      return {
        id: d.id,
        domain: d.domain,
        tld: d.tld,
        niche: d.niche,
        status: d.status,
        site_url: d.site_url,
        gsc_verified: d.gsc_verified,
        engine_id: d.engine_id,
        keywords_count: d.keywords_count || 0,
        pages_count: d.pages_count || 0,
        citations_count: d.citations_count || 0,
        backlinks_count: d.backlinks_count || backlinks.length || 0,
        best_position: d.best_position || 0,
        page_one_keywords: d.page_one_keywords || 0,
        logs: (d.logs || []).slice(-10),
        stages,
        current_stage: currentStage,
        stage_index: stageIndex,
        progress: Math.round((stageIndex / (STAGE_ORDER.length - 1)) * 100),
      };
    });

    // Summary stats
    const summary = STAGE_ORDER.reduce((acc, stage) => {
      acc[stage] = pipeline.filter(d => d.stages[stage]).length;
      return acc;
    }, {});

    return Response.json({ ok: true, pipeline, summary, total: pipeline.length });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}