import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Pipeline Health Monitor — returns real-time health metrics for the clone pipeline.
// Called by the dashboard to surface system status, stuck projects, and success rates.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Fetch all recent projects (up to 200)
    const projects = await svc.entities.CloneProject.list('-created_date', 200).catch(() => []);

    const now = Date.now();
    const STUCK_THRESHOLD = 30 * 60 * 1000; // 30 min

    const metrics = {
      total: projects.length,
      by_status: { queued: 0, running: 0, awaiting_approval: 0, complete: 0, failed: 0 },
      by_step: {},
      stuck: [],
      failed_recent: [],
      success_rate: 0,
      avg_validation_score: 0,
      provisioned_count: 0,
      last_completed: null,
    };

    let scoreSum = 0;
    let scoreCount = 0;
    let completedCount = 0;

    for (const p of projects) {
      // Count by status
      metrics.by_status[p.status] = (metrics.by_status[p.status] || 0) + 1;

      // Count by step
      metrics.by_step[p.current_step] = (metrics.by_step[p.current_step] || 0) + 1;

      // Check if stuck
      if (p.status === 'running' && p.updated_date) {
        const updated = new Date(p.updated_date).getTime();
        if (now - updated > STUCK_THRESHOLD) {
          metrics.stuck.push({
            id: p.id,
            name: p.selected_name || p.target_url,
            current_step: p.current_step,
            last_updated: p.updated_date,
            minutes_stuck: Math.round((now - updated) / 60000),
          });
        }
      }

      // Track failed (last 24h)
      if (p.status === 'failed') {
        metrics.failed_recent.push({
          id: p.id,
          name: p.selected_name || p.target_url,
          current_step: p.current_step,
          error: p.error,
        });
      }

      // Track completed
      if (p.status === 'complete') {
        completedCount++;
        if (p.validation_score) {
          scoreSum += p.validation_score;
          scoreCount++;
        }
        if (p.provisioning?.vercel?.url) metrics.provisioned_count++;
        if (!metrics.last_completed || (p.updated_date > metrics.last_completed)) {
          metrics.last_completed = p.updated_date;
        }
      }
    }

    metrics.success_rate = projects.length > 0
      ? Math.round((completedCount / projects.length) * 100)
      : 0;
    metrics.avg_validation_score = scoreCount > 0
      ? Math.round(scoreSum / scoreCount)
      : 0;

    // Cap arrays to prevent huge responses
    metrics.stuck = metrics.stuck.slice(0, 10);
    metrics.failed_recent = metrics.failed_recent.slice(0, 10);

    return Response.json({ ok: true, ...metrics });
  } catch (error) {
    console.error('[pipelineHealth]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}