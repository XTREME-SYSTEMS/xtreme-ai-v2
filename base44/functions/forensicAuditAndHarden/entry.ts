import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

// Deep Forensic Audit & Auto-Harden — audits the AutoBuilder pipeline,
// identifies hardening actions, and applies auto-fixes.
// Called manually from the Pipeline Overview page ("Forensic Audit" button).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    // Gather AutoBuilder system snapshot
    const [builds, openAlerts, openOpts, failedJobs, recentHealth] = await Promise.all([
      base44.asServiceRole.entities.AutoBuild.list('-created_date', 100),
      base44.asServiceRole.entities.SystemAlert.filter({ status: 'open' }, '-created_date', 20).catch(() => []),
      base44.asServiceRole.entities.SystemOptimization.filter({ status: 'open' }, '-created_date', 20).catch(() => []),
      base44.asServiceRole.entities.GenerationJob.filter({ status: 'failed' }, '-created_date', 20).catch(() => []),
      base44.asServiceRole.entities.SystemHealthScore.list('-created_date', 1).catch(() => []),
    ]);

    const allBuilds = (builds || []) as any[];
    const total = allBuilds.length;
    const complete = allBuilds.filter(b => b.status === 'complete').length;
    const failed = allBuilds.filter(b => b.status === 'failed').length;
    const running = allBuilds.filter(b => b.status === 'running').length;
    const queued = allBuilds.filter(b => b.status === 'queued').length;
    const paused = allBuilds.filter(b => b.status === 'paused').length;

    // Check for stuck builds (running > 30 min with no update)
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
    const stuck = allBuilds.filter(b =>
      b.status === 'running' &&
      b.updated_date &&
      new Date(b.updated_date).getTime() < thirtyMinAgo
    );

    const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;
    const failureRate = total > 0 ? Math.round((failed / total) * 100) : 0;
    const previousHealth = ((recentHealth as any[])?.[0]?.overall_score) || 0;

    const snapshot = {
      builds: { total, complete, failed, running, queued, paused, completionRate, failureRate, stuck: stuck.length },
      alerts: (openAlerts as any[])?.length || 0,
      open_optimizations: (openOpts as any[])?.length || 0,
      failed_jobs: (failedJobs as any[])?.length || 0,
      previous_health: previousHealth,
    };

    // Run the forensic audit via LLM
    const auditPrompt = `You are the autonomous forensic auditor for the Xtreme AI Pipeline — an autonomous growth factory that discovers ideas, builds websites/apps, deploys them, and runs SEO/marketing engines.

CURRENT SYSTEM SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

Audit across these dimensions (0-100 each):
- completeness: Are all pipeline steps functional? Are builds completing?
- correctness: Are builds succeeding? Are there error patterns?
- integration: Do the pipeline stages connect? Are there broken handoffs?
- security: Are admin guards in place? Are secrets handled correctly?
- performance: Are builds processing efficiently? Are there stuck builds?
- autonomy: Can the system run without manual intervention?

Return JSON with: overall_score, completeness_score, correctness_score, integration_score, security_score, performance_score, autonomy_score, critical_findings (array of strings), hardening_actions (array of {area, action, priority}), recommendation (string).`;

    const auditRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: auditPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          completeness_score: { type: "number" },
          correctness_score: { type: "number" },
          integration_score: { type: "number" },
          security_score: { type: "number" },
          performance_score: { type: "number" },
          autonomy_score: { type: "number" },
          critical_findings: { type: "array", items: { type: "string" } },
          hardening_actions: { type: "array", items: { type: "object" } },
          recommendation: { type: "string" }
        }
      }
    });

    const a = typeof auditRes === 'object' ? auditRes : JSON.parse(auditRes as string);

    // Persist the system health score
    await base44.asServiceRole.entities.SystemHealthScore.create({
      overall_score: a.overall_score || 0,
      completeness_score: a.completeness_score || 0,
      correctness_score: a.correctness_score || 0,
      integration_score: a.integration_score || 0,
      security_score: a.security_score || 0,
      performance_score: a.performance_score || 0,
      autonomy_score: a.autonomy_score || 0,
      qa_pass_rate: completionRate,
      phases_passed: complete,
      phases_total: total,
      open_repair_tasks: (openAlerts as any[])?.length || 0,
      trend: (a.overall_score || 0) >= previousHealth ? 'improving' : 'declining',
      last_audited_at: new Date().toISOString(),
      active_remediation: (a.hardening_actions || []).slice(0, 3).map((h: any) => h.action || h.area).join('; ')
    });

    // Create SystemOptimization findings for hardening actions
    for (const action of (a.hardening_actions || []).slice(0, 10)) {
      try {
        await base44.asServiceRole.entities.SystemOptimization.create({
          category: 'hardening',
          severity: (action as any).priority || 'medium',
          area: (action as any).area || 'system',
          title: String((action as any).action || '').slice(0, 200),
          description: String((action as any).action || ''),
          recommended_action: 'harden',
          status: 'open',
          scan_id: `audit_${Date.now()}`,
        });
      } catch {}
    }

    // Auto-recover stuck builds
    for (const build of stuck) {
      try {
        await base44.asServiceRole.entities.AutoBuild.update(build.id, {
          status: 'paused',
          error: 'Recovered from stuck state by forensic audit',
        });
      } catch {}
    }

    return Response.json({
      ok: true,
      overall_score: a.overall_score || 0,
      critical_findings: a.critical_findings || [],
      hardening_actions: a.hardening_actions || [],
      recommendation: a.recommendation || '',
      stuck_builds_recovered: stuck.length,
    });
  } catch (error: any) {
    console.error('forensicAuditAndHarden error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}