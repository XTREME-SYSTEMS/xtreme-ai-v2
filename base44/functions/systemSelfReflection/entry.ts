import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

// systemSelfReflection — Scans the entire system for failures, gaps, and
// optimization opportunities. Creates SystemOptimization records for each
// finding with a recommended action and endpoint to apply the fix.
//
// Scans:
// 1. Failed AutoBuilds (status=failed)
// 2. Open/escalated SystemAlerts
// 3. Failed/dead-letter GenerationJobs
// 4. Failed DiscoveryRuns
// 5. Stuck builds (running with no recent activity)
// 6. LLM-powered system-wide optimization analysis
//
// Manual trigger now; autonomous-ready for workflow scheduling later.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const scanId = `scan_${Date.now()}`;
    const findings: any[] = [];
    const now = Date.now();

    // ── 1. Failed AutoBuilds ──────────────────────────────────────────
    try {
      const failedBuilds = await base44.asServiceRole.entities.AutoBuild.filter({ status: 'failed' }, '-created_date', 50);
      for (const build of failedBuilds) {
        findings.push({
          category: 'failure',
          severity: 'high',
          area: 'builds',
          title: `Failed build: ${build.business_name || 'unknown'}`,
          description: `AutoBuild "${build.business_name}" failed at step ${build.current_step}. Error: ${(build.error || 'unknown').slice(0, 300)}`,
          recommended_action: 'heal',
          action_endpoint: 'selfHealBuild',
          action_payload: JSON.stringify({ buildId: build.id, alertType: 'build_failure' }),
          evidence: JSON.stringify({ build_id: build.id, step: build.current_step, error: build.error }),
          scan_id: scanId,
          status: 'open',
        });
      }
    } catch (e) { console.error('Failed to scan builds', e?.message); }

    // ── 2. Open/Escalated SystemAlerts ─────────────────────────────────
    try {
      const openAlerts = await base44.asServiceRole.entities.SystemAlert.filter({ status: 'open' }, '-created_date', 50);
      const escalatedAlerts = await base44.asServiceRole.entities.SystemAlert.filter({ status: 'escalated' }, '-created_date', 50);
      for (const alert of [...openAlerts, ...escalatedAlerts]) {
        findings.push({
          category: alert.alert_type === 'post_deploy_check_failure' ? 'failure' : 'gap',
          severity: alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'high' : 'medium',
          area: 'alerts',
          title: `${(alert.alert_type || 'alert').replace(/_/g, ' ')}: ${(alert.message || '').slice(0, 80)}`,
          description: alert.message || '',
          recommended_action: alert.alert_type === 'post_deploy_check_failure' ? 'heal' : 'fix',
          action_endpoint: 'selfHealBuild',
          action_payload: JSON.stringify({ alertId: alert.id, alertType: alert.alert_type, buildId: alert.build_id }),
          evidence: alert.context || '',
          scan_id: scanId,
          status: 'open',
        });
      }
    } catch (e) { console.error('Failed to scan alerts', e?.message); }

    // ── 3. Failed/Dead-letter GenerationJobs ───────────────────────────
    try {
      const failedJobs = await base44.asServiceRole.entities.GenerationJob.filter({ status: 'failed' }, '-created_date', 50);
      for (const job of failedJobs) {
        findings.push({
          category: 'failure',
          severity: 'medium',
          area: 'generation',
          title: `Failed job: ${job.job_type}`,
          description: `Generation job "${job.job_type}" (generator: ${job.generator_id || 'unknown'}) failed after ${job.attempt_count || 0} attempts. Error: ${(job.error || 'unknown').slice(0, 200)}`,
          recommended_action: 'fix',
          action_endpoint: 'heartbeat',
          action_payload: JSON.stringify({ retryJobId: job.id }),
          evidence: JSON.stringify({ job_id: job.id, job_type: job.job_type, error: job.error }),
          scan_id: scanId,
          status: 'open',
        });
      }

      const deadLetterJobs = await base44.asServiceRole.entities.GenerationJob.filter({ status: 'dead_letter' }, '-created_date', 50);
      for (const job of deadLetterJobs) {
        findings.push({
          category: 'failure',
          severity: 'high',
          area: 'generation',
          title: `Dead-letter job: ${job.job_type}`,
          description: `Job "${job.job_type}" moved to dead letter after ${job.attempt_count || 0} attempts. Error: ${(job.error || 'unknown').slice(0, 200)}`,
          recommended_action: 'fix',
          action_endpoint: 'heartbeat',
          action_payload: JSON.stringify({ retryJobId: job.id }),
          evidence: JSON.stringify({ job_id: job.id, job_type: job.job_type, error: job.error }),
          scan_id: scanId,
          status: 'open',
        });
      }
    } catch (e) { console.error('Failed to scan jobs', e?.message); }

    // ── 4. Failed DiscoveryRuns ────────────────────────────────────────
    try {
      const failedRuns = await base44.asServiceRole.entities.DiscoveryRun.filter({ status: 'failed' }, '-created_date', 20);
      for (const run of failedRuns) {
        findings.push({
          category: 'failure',
          severity: 'medium',
          area: 'discovery',
          title: `Failed discovery: ${run.run_type}`,
          description: `Discovery run (${run.run_type}) failed. Error: ${(run.error || 'unknown').slice(0, 200)}`,
          recommended_action: 'fix',
          action_endpoint: 'runDiscoveryScrape',
          action_payload: JSON.stringify({ runType: run.run_type, industry: run.industry }),
          evidence: JSON.stringify({ run_id: run.id, error: run.error }),
          scan_id: scanId,
          status: 'open',
        });
      }
    } catch (e) { console.error('Failed to scan discovery runs', e?.message); }

    // ── 5. Stuck AutoBuilds (running with no recent log activity) ───────
    try {
      const runningBuilds = await base44.asServiceRole.entities.AutoBuild.filter({ status: 'running' }, '-created_date', 50);
      for (const build of runningBuilds) {
        const logs: string[] = build.logs || [];
        const lastLog = logs[logs.length - 1] || '';
        // Try to parse timestamp from log entry format: [2026-08-23T17:40:00.000Z]
        const match = lastLog.match(/\[([^\]]+)\]/);
        const lastLogTime = match ? new Date(match[1]).getTime() : new Date(build.updated_date || build.created_date).getTime();
        const stuckHours = (now - lastLogTime) / (1000 * 60 * 60);
        if (stuckHours > 2) {
          findings.push({
            category: 'gap',
            severity: 'high',
            area: 'builds',
            title: `Stuck build: ${build.business_name || 'unknown'}`,
            description: `AutoBuild "${build.business_name}" has been at step ${build.current_step} for ${Math.round(stuckHours)} hours with no log activity.`,
            recommended_action: 'heal',
            action_endpoint: 'recoverStuckAutoBuilds',
            action_payload: JSON.stringify({ buildId: build.id }),
            evidence: JSON.stringify({ build_id: build.id, stuck_hours: Math.round(stuckHours) }),
            scan_id: scanId,
            status: 'open',
          });
        }
      }
    } catch (e) { console.error('Failed to scan stuck builds', e?.message); }

    // ── 6. LLM-powered optimization analysis ────────────────────────────
    let llmFindings: any[] = [];
    try {
      const systemSummary = {
        failedBuilds: findings.filter(f => f.area === 'builds' && f.category === 'failure').length,
        openAlerts: findings.filter(f => f.area === 'alerts').length,
        failedJobs: findings.filter(f => f.area === 'generation').length,
        failedRuns: findings.filter(f => f.area === 'discovery').length,
        stuckBuilds: findings.filter(f => f.title?.startsWith('Stuck build')).length,
      };

      const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a system optimization AI analyzing a marketing automation platform. Based on this system health summary, identify 3-5 high-impact optimization, enhancement, or hardening opportunities. Focus on SYSTEMIC improvements, not individual failures.

System Health Summary:
${JSON.stringify(systemSummary, null, 2)}

For each finding, provide:
- category: "optimization" | "enhancement" | "hardening"
- severity: "critical" | "high" | "medium" | "low"
- area: the system area (e.g., "builds", "alerts", "generation", "discovery", "seo", "deploy")
- title: short title (max 80 chars)
- description: detailed description (2-3 sentences explaining the opportunity)
- recommended_action: "optimize" | "enhance" | "harden"
- action_endpoint: a backend function name (e.g., "forensicAuditAndHarden", "recursiveHardenSystem", "pushAllToMax", "computeSystemScore")

Return a JSON object with an "optimizations" array.`,
        response_json_schema: {
          type: "object",
          properties: {
            optimizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  severity: { type: "string" },
                  area: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  recommended_action: { type: "string" },
                  action_endpoint: { type: "string" },
                }
              }
            }
          }
        }
      });

      const parsed = typeof llmRes === 'object' ? llmRes : JSON.parse(llmRes);
      llmFindings = (parsed.optimizations || []).map((o: any) => ({
        category: o.category || 'optimization',
        severity: o.severity || 'medium',
        area: o.area || 'system',
        title: o.title || 'System optimization',
        description: o.description || '',
        recommended_action: o.recommended_action || 'optimize',
        action_endpoint: o.action_endpoint || 'computeSystemScore',
        action_payload: JSON.stringify({}),
        evidence: 'LLM-identified system optimization opportunity',
        scan_id: scanId,
        status: 'open',
      }));
    } catch (e) {
      console.error('LLM optimization analysis failed', e?.message || e);
    }

    // ── Deduplicate: don't re-create findings that are already open ────
    const allNewFindings = [...findings, ...llmFindings];
    let existingOpen: any[] = [];
    try {
      existingOpen = await base44.asServiceRole.entities.SystemOptimization.filter({ status: 'open' }, '-created_date', 200);
    } catch {}
    const existingKeys = new Set(existingOpen.map((f: any) => `${f.category}:${f.title}`));
    const newFindings = allNewFindings.filter(f => !existingKeys.has(`${f.category}:${f.title}`));

    // ── Create all new findings ────────────────────────────────────────
    let created = 0;
    if (newFindings.length > 0) {
      try {
        const result = await base44.asServiceRole.entities.SystemOptimization.bulkCreate(newFindings);
        created = newFindings.length;
      } catch (e) {
        // Fallback: create one at a time
        for (const f of newFindings) {
          try {
            await base44.asServiceRole.entities.SystemOptimization.create(f);
            created++;
          } catch {}
        }
      }
    }

    // ── Record a Receipt ───────────────────────────────────────────────
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: 'systemSelfReflection',
        action: 'system_scan',
        entity_type: 'SystemOptimization',
        entity_id: scanId,
        inputs: JSON.stringify({ scanId }).slice(0, 4000),
        outputs: JSON.stringify({ total_findings: allNewFindings.length, new_findings: created, deduplicated: allNewFindings.length - created }).slice(0, 4000),
        status: 'success',
        evidence: `System self-reflection scan: ${allNewFindings.length} findings (${created} new, ${allNewFindings.length - created} already tracked)`,
      });
    } catch {}

    return Response.json({
      ok: true,
      scan_id: scanId,
      total_findings: allNewFindings.length,
      new_findings: created,
      deduplicated: allNewFindings.length - created,
      breakdown: {
        failures: findings.filter(f => f.category === 'failure').length,
        gaps: findings.filter(f => f.category === 'gap').length,
        optimizations: llmFindings.filter(f => f.category === 'optimization').length,
        enhancements: llmFindings.filter(f => f.category === 'enhancement').length,
        hardening: llmFindings.filter(f => f.category === 'hardening').length,
      },
    });
  } catch (error) {
    console.error('systemSelfReflection error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}