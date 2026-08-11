import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isStuck, getResumeStep, markFailed } from '../../shared/pipelineState.ts';

// Autonomous Pipeline Recovery — runs on a schedule (every 15 min via workflow).
// Scans for stuck/failed CloneProjects and recovers them by re-running the
// appropriate step. This makes the pipeline self-healing: if any step crashes
// or times out, the recovery loop picks it back up automatically.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Find all projects that are in "running" status (potentially stuck)
    // or in "failed" status (candidates for retry).
    const runningProjects = await svc.entities.CloneProject.filter(
      { status: 'running' },
      '-updated_date',
      50
    ).catch(() => []);

    const failedProjects = await svc.entities.CloneProject.filter(
      { status: 'failed', current_step: { $ne: 'complete' } },
      '-updated_date',
      20
    ).catch(() => []);

    const results = { scanned: runningProjects.length + failedProjects.length, recovered: 0, markedFailed: 0, skipped: 0, details: [] };

    // ---- Process running (potentially stuck) projects ----
    for (const project of runningProjects) {
      if (!isStuck(project)) {
        results.skipped++;
        continue;
      }

      const resumeStep = getResumeStep(project);
      if (!resumeStep) {
        results.skipped++;
        continue;
      }

      try {
        // Re-run the appropriate step based on current_step
        if (resumeStep === 'provisioning') {
          await base44.functions.invoke('provisionApprovedClone', { project_id: project.id });
          results.recovered++;
          results.details.push({ project_id: project.id, action: 're-provisioned', step: resumeStep });
        } else if (resumeStep === 'scanning' || resumeStep === 'scanned') {
          await base44.functions.invoke('legalScanClone', { project_id: project.id });
          results.recovered++;
          results.details.push({ project_id: project.id, action: 're-scanned', step: resumeStep });
        } else if (resumeStep === 'generating_rebrand' || resumeStep === 'rebrand_ready') {
          await base44.functions.invoke('generateRebrandPackage', { project_id: project.id });
          results.recovered++;
          results.details.push({ project_id: project.id, action: 're-generated-rebrand', step: resumeStep });
        } else {
          results.skipped++;
        }
      } catch (err) {
        // If recovery itself fails, mark as failed so we don't loop forever
        await markFailed(svc, project.id, err, { recoveryAttempt: true, resumeStep });
        results.markedFailed++;
        results.details.push({ project_id: project.id, action: 'recovery-failed', error: err.message });
      }
    }

    // ---- Retry failed projects (up to 3 retries based on log count) ----
    for (const project of failedProjects) {
      const failureCount = (project.logs || []).filter(l => l.includes('FAILED')).length;
      if (failureCount >= 3) {
        results.skipped++;
        continue; // Don't retry projects that have failed 3+ times
      }

      const resumeStep = getResumeStep(project);
      if (!resumeStep) {
        results.skipped++;
        continue;
      }

      try {
        if (resumeStep === 'provisioning') {
          await base44.functions.invoke('provisionApprovedClone', { project_id: project.id });
          results.recovered++;
          results.details.push({ project_id: project.id, action: 'retry-provision', attempt: failureCount + 1 });
        } else if (resumeStep === 'scanning' || resumeStep === 'scanned') {
          await base44.functions.invoke('legalScanClone', { project_id: project.id });
          results.recovered++;
          results.details.push({ project_id: project.id, action: 'retry-scan', attempt: failureCount + 1 });
        } else if (resumeStep === 'generating_rebrand' || resumeStep === 'rebrand_ready') {
          await base44.functions.invoke('generateRebrandPackage', { project_id: project.id });
          results.recovered++;
          results.details.push({ project_id: project.id, action: 'retry-rebrand', attempt: failureCount + 1 });
        }
      } catch (err) {
        await markFailed(svc, project.id, err, { retryAttempt: failureCount + 1 });
        results.markedFailed++;
        results.details.push({ project_id: project.id, action: 'retry-failed', error: err.message });
      }
    }

    return Response.json({ ok: true, ...results });
  } catch (error) {
    console.error('[recoverStuckProjects]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}