// Shared pipeline state manager for CloneProject lifecycle.
// Provides idempotent state transitions, checkpoint/resume, and step ordering.
// Import from any backend function: import { ... } from '../../shared/pipelineState.ts';

// Canonical step ordering — a step is "complete" if the project has progressed past it.
export const STEP_ORDER = [
  'queued',
  'scanning',
  'scanned',
  'generating_rebrand',
  'rebrand_ready',
  'approved',
  'provisioning',
  'buying_domain',
  'seo_aeo_optimizing',
  'racing_to_rank',
  'complete',
];

// Map step name to its ordinal index.
export function stepIndex(step) {
  const i = STEP_ORDER.indexOf(step);
  return i === -1 ? 0 : i;
}

// Check if a step is already complete (project has progressed past it).
export function isStepComplete(project, step) {
  return stepIndex(project.current_step) > stepIndex(step);
}

// Check if a step is currently in progress.
export function isStepInProgress(project, step) {
  return project.current_step === step;
}

// Atomic checkpoint update — sets current_step + merges data + appends logs.
// Idempotent: if the project is already past this step, skip the update.
export async function checkpoint(svc, projectId, step, data = {}, logs = []) {
  const project = await svc.entities.CloneProject.get(projectId);
  const existingLogs = project.logs || [];

  // If already past this step, don't regress — just append logs if any
  if (stepIndex(project.current_step) > stepIndex(step)) {
    if (logs.length > 0) {
      await svc.entities.CloneProject.update(projectId, {
        logs: [...existingLogs, ...logs],
      });
    }
    return project;
  }

  const update = {
    current_step: step,
    ...data,
    logs: [...existingLogs, ...logs],
  };

  return svc.entities.CloneProject.update(projectId, update);
}

// Mark a project as failed with structured error capture.
export async function markFailed(svc, projectId, error, context = {}) {
  const project = await svc.entities.CloneProject.get(projectId).catch(() => null);
  if (!project) return;

  const errObj = {
    message: error?.message || String(error),
    context,
    timestamp: new Date().toISOString(),
  };

  await svc.entities.CloneProject.update(projectId, {
    current_step: 'failed',
    status: 'failed',
    error: JSON.stringify(errObj),
    logs: [...(project.logs || []), `[${new Date().toISOString().slice(11, 19)} FAILED] ${errObj.message}`],
  });
}

// Determine which step to resume from based on current state.
// Returns the step name that should be re-run, or null if complete.
export function getResumeStep(project) {
  if (project.current_step === 'complete') return null;
  if (project.current_step === 'failed') return 'provisioning'; // restart from provisioning on recovery
  if (project.status === 'running' && project.current_step === 'provisioning') return 'provisioning';
  return project.current_step;
}

// Check if a project is "stuck" — in running state for too long without progress.
export function isStuck(project, stuckThresholdMs = 30 * 60 * 1000) {
  if (project.status !== 'running') return false;
  if (!project.updated_date) return false;
  const updated = new Date(project.updated_date).getTime();
  return Date.now() - updated > stuckThresholdMs;
}