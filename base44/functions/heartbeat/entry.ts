import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { dispatch } from '../../shared/generation.ts';

// 5-Minute Heartbeat — processes due GenerationJob queue entries.
// Dispatches each job by job_type to the shared generation engine, which runs the
// AI work, persists results, enqueues the next phase, and writes a receipt.
// Queue mechanics: idempotency, max retries, exponential backoff, dead-letter queue.
// Production locks: never bypasses gates for domain purchase, DNS, deploy, paid media, messaging, payments, secrets.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const now = new Date();
    const nowIso = now.toISOString();

    // Find queued jobs that are due (next_attempt_at is null or in the past)
    const queuedJobs = await sr.entities.GenerationJob.filter({ status: "queued" }, "-created_date", 50);

    let processed = 0;
    let completed = 0;
    let failed = 0;
    let deadLettered = 0;
    const maxAttempts = 3;

    for (const job of queuedJobs) {
      // Skip jobs not yet due
      if (job.next_attempt_at && new Date(job.next_attempt_at) > now) continue;

      processed++;
      const attempt = (job.attempt_count || 0) + 1;

      try {
        // Mark as running
        await sr.entities.GenerationJob.update(job.id, { status: "running", attempt_count: attempt });

        // Execute the actual generation work for this job_type
        const result = await dispatch(job, base44);

        // Mark complete and store a trimmed output summary
        await sr.entities.GenerationJob.update(job.id, {
          status: "complete",
          error: "",
          output_ref: JSON.stringify(result).slice(0, 2000),
        });
        completed++;
      } catch (e) {
        const errMsg = String(e).slice(0, 500);

        if (attempt >= maxAttempts) {
          // Dead-letter after max retries
          await sr.entities.GenerationJob.update(job.id, { status: "dead_letter", error: errMsg });
          deadLettered++;
          await sr.entities.Receipt.create({
            agent_or_workflow: "5min_heartbeat",
            action: `process_${job.job_type || "job"}`,
            entity_type: "GenerationJob",
            entity_id: job.id,
            status: "escalated",
            warnings: `Dead-lettered after ${attempt} attempts: ${errMsg}`,
          });
        } else {
          // Exponential backoff: 2^attempt minutes (2, 4, 8)
          const backoffMinutes = Math.pow(2, attempt);
          const nextAttempt = new Date(Date.now() + backoffMinutes * 60000).toISOString();
          await sr.entities.GenerationJob.update(job.id, {
            status: "queued",
            attempt_count: attempt,
            next_attempt_at: nextAttempt,
            error: errMsg,
          });
          failed++;
          await sr.entities.Receipt.create({
            agent_or_workflow: "5min_heartbeat",
            action: `process_${job.job_type || "job"}`,
            entity_type: "GenerationJob",
            entity_id: job.id,
            status: "failed",
            warnings: `Attempt ${attempt} failed, retrying at ${nextAttempt}: ${errMsg}`,
          });
        }
      }
    }

    return Response.json({
      processed,
      completed,
      failed,
      deadLettered,
      timestamp: nowIso,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}