import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

// Persistent Coding Supervisor
// Runs from the existing 5-minute heartbeat. It advances only "coding_packet"
// GenerationJobs and produces validated DRAFT PATCH BUNDLES. It never deploys,
// merges, changes secrets, mutates DNS, spends money, or performs destructive work.

const SAFE_ACTION_CLASSES = new Set(["read", "draft", "sandbox", "branch_write"]);
const PROTECTED_ACTIONS = new Set([
  "production_deploy",
  "protected_branch_merge",
  "schema_change",
  "rls_change",
  "secret_change",
  "dns_change",
  "spend",
  "payment",
  "external_message",
  "public_publish",
  "permission_escalation",
  "destructive_delete",
  "irreversible_migration",
]);

function parseJson(value: unknown, fallback: any = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch { return fallback; }
}

function asText(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2);
}

function clampText(value: unknown, max = 120000) {
  const text = asText(value);
  return text.length > max ? text.slice(0, max) + "\n...[TRUNCATED]" : text;
}

async function writeReceipt(sr: any, data: any) {
  try {
    await sr.entities.Receipt.create({
      agent_or_workflow: "persistent_coding_supervisor",
      entity_type: "GenerationJob",
      ...data,
    });
  } catch {
    // Receipts are best-effort here; the job record remains authoritative.
  }
}

async function requestApproval(sr: any, job: any, requestedAction: string, reason: string) {
  try {
    const existing = await sr.entities.Approval.filter({
      entity_type: "GenerationJob",
      entity_id: job.id,
      status: "pending",
    }, "-created_date", 1).catch(() => []);
    if ((existing || []).length > 0) return existing[0];

    return await sr.entities.Approval.create({
      entity_type: "GenerationJob",
      entity_id: job.id,
      requested_action: requestedAction,
      risk_level: "red",
      status: "pending",
      notes: reason,
    });
  } catch {
    return null;
  }
}

function normalizePlanStep(payload: any) {
  const steps = Array.isArray(payload.plan_steps) ? payload.plan_steps : [];
  const index = Math.max(0, Number(payload.step_index || 0));
  const raw = steps[index];
  if (raw && typeof raw === "object") {
    return {
      index,
      total: steps.length,
      title: raw.title || raw.name || `Step ${index + 1}`,
      objective: raw.objective || raw.description || payload.objective || "",
      acceptance_criteria: raw.acceptance_criteria || payload.acceptance_criteria || [],
    };
  }
  if (typeof raw === "string") {
    return {
      index,
      total: steps.length,
      title: `Step ${index + 1}`,
      objective: raw,
      acceptance_criteria: payload.acceptance_criteria || [],
    };
  }
  return {
    index,
    total: steps.length || 1,
    title: payload.step_title || "Current packet",
    objective: payload.objective || "",
    acceptance_criteria: payload.acceptance_criteria || [],
  };
}

export default async function(req: Request) {
  const base44 = createClientFromRequest(req);
  const sr = base44.asServiceRole;
  const now = new Date();
  const nowIso = now.toISOString();

  try {
    // Single-flight behavior: only one coding packet per heartbeat.
    // Reclaim stale coding packets left "running" for more than 20 minutes.
    const staleCutoff = new Date(Date.now() - 20 * 60 * 1000);
    const running = await sr.entities.GenerationJob.filter({
      status: "running",
      job_type: "coding_packet",
    }, "-updated_date", 10).catch(() => []);

    for (const job of running || []) {
      const touched = job.updated_date ? new Date(job.updated_date) : null;
      if (!touched || touched < staleCutoff) {
        await sr.entities.GenerationJob.update(job.id, {
          status: "queued",
          error: "persistent supervisor reclaimed stale coding lease",
          next_attempt_at: nowIso,
        }).catch(() => {});
        await writeReceipt(sr, {
          action: "reclaim_stale_coding_packet",
          entity_id: job.id,
          status: "failed",
          warnings: "Stale coding packet was returned to the queue.",
        });
      }
    }

    const queued = await sr.entities.GenerationJob.filter({
      status: "queued",
      job_type: "coding_packet",
    }, "created_date", 20).catch(() => []);

    const job = (queued || []).find((j: any) =>
      !j.next_attempt_at || new Date(j.next_attempt_at) <= now
    );

    if (!job) {
      return Response.json({
        ok: true,
        processed: 0,
        state: "idle",
        message: "No due coding_packet jobs.",
        timestamp: nowIso,
      });
    }

    const payload = parseJson(job.input_ref, {});
    const actionClass = String(payload.action_class || "draft").toLowerCase();
    const requestedProtected = Array.isArray(payload.requested_actions)
      ? payload.requested_actions.filter((x: any) => PROTECTED_ACTIONS.has(String(x)))
      : [];

    if (!SAFE_ACTION_CLASSES.has(actionClass) || requestedProtected.length > 0) {
      const requestedAction = requestedProtected[0] || actionClass || "protected_action";
      const reason = `Packet requires protected action: ${requestedAction}. Autonomous execution stopped at approval gate.`;
      await requestApproval(sr, job, requestedAction, reason);
      await sr.entities.GenerationJob.update(job.id, {
        status: "complete",
        finished_at: nowIso,
        result_summary: "BLOCKED_APPROVAL",
        error: reason,
      });
      await writeReceipt(sr, {
        action: "coding_packet_approval_gate",
        entity_id: job.id,
        status: "escalated",
        warnings: reason,
      });
      return Response.json({
        ok: true,
        processed: 1,
        state: "blocked_approval",
        job_id: job.id,
        requested_action: requestedAction,
      });
    }

    const attempt = Number(job.attempt_count || 0) + 1;
    const maxAttempts = Math.min(Math.max(Number(payload.max_attempts || 3), 1), 5);
    const step = normalizePlanStep(payload);
    const chainDepth = Math.max(0, Number(payload.chain_depth || 0));
    const maxChainDepth = Math.min(Math.max(Number(payload.max_chain_depth || 25), 1), 100);

    await sr.entities.GenerationJob.update(job.id, {
      status: "running",
      attempt_count: attempt,
      started_at: job.started_at || nowIso,
      error: "",
    });

    const sourceContext = clampText(payload.source_context || payload.context || "", 16000);
    const priorFeedback = clampText(payload.validation_feedback || "", 8000);
    const allowedPaths = Array.isArray(payload.allowed_paths) ? payload.allowed_paths : [];
    const forbiddenPaths = Array.isArray(payload.forbidden_paths) ? payload.forbidden_paths : [];

    const codingPrompt = `
You are the Strategic Minds persistent coding worker.

MISSION:
Continue one bounded coding work packet while the human operator is away.

NON-NEGOTIABLE BOUNDARIES:
- Output a DRAFT PATCH BUNDLE only. Do not claim files were applied.
- Do not deploy, merge protected branches, change secrets/env vars, change DNS,
  alter production databases/RLS, spend money, send external messages, publish,
  delete canonical assets, escalate permissions, or perform irreversible migration.
- Never emit secret values.
- Do not self-certify.
- Prefer the smallest patch that satisfies the current step.
- No placeholders, TODO-only files, or fake test results.
- Maximum 8 files in this packet. Keep the packet bounded and reviewable.

PROJECT: ${payload.project_id || payload.project || "Strategic Minds"}
ROOT PACKET: ${payload.root_packet_id || job.id}
CHAIN DEPTH: ${chainDepth}/${maxChainDepth}
CURRENT STEP: ${step.index + 1}/${step.total} — ${step.title}
OBJECTIVE:
${step.objective || payload.objective || "Continue the approved plan."}

ACCEPTANCE CRITERIA:
${JSON.stringify(step.acceptance_criteria || [], null, 2)}

ALLOWED PATHS:
${JSON.stringify(allowedPaths, null, 2)}

FORBIDDEN PATHS:
${JSON.stringify(forbiddenPaths, null, 2)}

SOURCE CONTEXT:
${sourceContext}

PRIOR VALIDATION FEEDBACK:
${priorFeedback || "None"}

Return a bounded implementation bundle. If the next required action is protected,
set requires_protected_action=true instead of attempting it.
`;

    const generated = await sr.integrations.Core.InvokeLLM({
      prompt: codingPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          files: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                content: { type: "string" },
                purpose: { type: "string" }
              }
            }
          },
          tests: { type: "array", items: { type: "string" } },
          assumptions: { type: "array", items: { type: "string" } },
          next_action: { type: "string" },
          requires_protected_action: { type: "boolean" },
          protected_action: { type: "string" }
        }
      }
    });

    const generatedObj = parseJson(generated, { raw: asText(generated) });

    if (generatedObj.requires_protected_action === true) {
      const requestedAction = String(generatedObj.protected_action || "protected_action");
      const reason = `Coding worker reached protected gate: ${requestedAction}`;
      await requestApproval(sr, job, requestedAction, reason);
      await sr.entities.GenerationJob.update(job.id, {
        status: "complete",
        finished_at: new Date().toISOString(),
        result_summary: "BLOCKED_APPROVAL",
        output_ref: clampText(generatedObj),
        error: reason,
      });
      await writeReceipt(sr, {
        action: "coding_packet_generated_protected_gate",
        entity_id: job.id,
        status: "escalated",
        warnings: reason,
      });
      return Response.json({
        ok: true,
        processed: 1,
        state: "blocked_approval",
        job_id: job.id,
        requested_action: requestedAction,
      });
    }

    const validationPrompt = `
You are an independent Strategic Minds coding validator.
You did not generate this patch.

Validate the DRAFT PATCH BUNDLE against the work packet.
Do not assume tests ran unless the bundle contains actual evidence; proposed test
commands are not test results. Reject secret exposure, protected actions, destructive
behavior, missing dependencies, invalid imports, incomplete code, path violations,
and changes outside scope.

OBJECTIVE:
${step.objective || payload.objective || ""}

ACCEPTANCE CRITERIA:
${JSON.stringify(step.acceptance_criteria || [], null, 2)}

ALLOWED PATHS:
${JSON.stringify(allowedPaths, null, 2)}

FORBIDDEN PATHS:
${JSON.stringify(forbiddenPaths, null, 2)}

PATCH BUNDLE:
${clampText(generatedObj, 80000)}

Return PASS only when this is a coherent draft patch ready for sandbox application
and testing. A PASS here does NOT mean deployed, production-ready, or runtime-tested.
`;

    const validation = await sr.integrations.Core.InvokeLLM({
      prompt: validationPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          passed: { type: "boolean" },
          score: { type: "number" },
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string" },
                category: { type: "string" },
                detail: { type: "string" },
                file_path: { type: "string" }
              }
            }
          },
          repair_instructions: { type: "array", items: { type: "string" } },
          protected_action_detected: { type: "boolean" },
          protected_action: { type: "string" }
        }
      }
    });

    const validationObj = parseJson(validation, { passed: false, score: 0 });
    const bundle = {
      packet_type: "validated_draft_patch",
      generated: generatedObj,
      validation: validationObj,
      provenance: {
        job_id: job.id,
        generated_at: new Date().toISOString(),
        action_class: actionClass,
        chain_depth: chainDepth,
        step_index: step.index,
      },
      state_claim: "DRAFT_ONLY_NOT_APPLIED_TO_REPOSITORY",
    };

    if (validationObj.protected_action_detected === true) {
      const requestedAction = String(validationObj.protected_action || "protected_action");
      const reason = `Independent validator detected protected action: ${requestedAction}`;
      await requestApproval(sr, job, requestedAction, reason);
      await sr.entities.GenerationJob.update(job.id, {
        status: "complete",
        finished_at: new Date().toISOString(),
        result_summary: "BLOCKED_APPROVAL",
        output_ref: clampText(bundle),
        error: reason,
      });
      await writeReceipt(sr, {
        action: "coding_packet_validator_protected_gate",
        entity_id: job.id,
        status: "escalated",
        warnings: reason,
      });
      return Response.json({
        ok: true,
        processed: 1,
        state: "blocked_approval",
        job_id: job.id,
        requested_action: requestedAction,
      });
    }

    if (validationObj.passed !== true) {
      const feedback = JSON.stringify({
        findings: validationObj.findings || [],
        repair_instructions: validationObj.repair_instructions || [],
      }).slice(0, 12000);

      if (attempt >= maxAttempts) {
        await sr.entities.GenerationJob.update(job.id, {
          status: "dead_letter",
          finished_at: new Date().toISOString(),
          result_summary: `VALIDATION_FAILED score=${validationObj.score || 0}`,
          output_ref: clampText(bundle),
          error: feedback.slice(0, 500),
        });
        await writeReceipt(sr, {
          action: "coding_packet_dead_letter",
          entity_id: job.id,
          status: "escalated",
          warnings: `Validation failed after ${attempt} attempts.`,
        });
        return Response.json({
          ok: false,
          processed: 1,
          state: "dead_letter",
          job_id: job.id,
          score: validationObj.score || 0,
        });
      }

      const retryPayload = {
        ...payload,
        validation_feedback: feedback,
      };
      const backoffMinutes = Math.pow(2, attempt);
      const nextAttempt = new Date(Date.now() + backoffMinutes * 60000).toISOString();

      await sr.entities.GenerationJob.update(job.id, {
        status: "queued",
        input_ref: JSON.stringify(retryPayload),
        output_ref: clampText(bundle),
        result_summary: `REPAIR_REQUIRED score=${validationObj.score || 0}`,
        next_attempt_at: nextAttempt,
        error: feedback.slice(0, 500),
      });
      await writeReceipt(sr, {
        action: "coding_packet_validation_retry",
        entity_id: job.id,
        status: "failed",
        warnings: `Draft failed validation; retry scheduled for ${nextAttempt}.`,
      });
      return Response.json({
        ok: true,
        processed: 1,
        state: "repair_queued",
        job_id: job.id,
        attempt,
        next_attempt_at: nextAttempt,
        score: validationObj.score || 0,
      });
    }

    await sr.entities.GenerationJob.update(job.id, {
      status: "complete",
      finished_at: new Date().toISOString(),
      result_summary: `VALIDATED_DRAFT score=${validationObj.score || 0}`,
      output_ref: clampText(bundle),
      error: "",
    });

    await writeReceipt(sr, {
      action: "coding_packet_validated_draft",
      entity_id: job.id,
      status: "success",
      notes: "Generated and independently validated a draft patch bundle. No repository or production mutation was performed.",
    });

    // Deterministic continuation: enqueue the next pre-approved plan step only.
    const steps = Array.isArray(payload.plan_steps) ? payload.plan_steps : [];
    const nextIndex = step.index + 1;
    let nextJobId = null;

    if (
      payload.auto_continue !== false &&
      steps.length > nextIndex &&
      chainDepth + 1 < maxChainDepth
    ) {
      const rootPacket = String(payload.root_packet_id || job.id);
      const nextKey = `${job.idempotency_key || rootPacket}:step:${nextIndex}`;
      const duplicates = await sr.entities.GenerationJob.filter({
        idempotency_key: nextKey,
      }, "-created_date", 1).catch(() => []);

      if ((duplicates || []).length === 0) {
        const nextPayload = {
          ...payload,
          root_packet_id: rootPacket,
          step_index: nextIndex,
          chain_depth: chainDepth + 1,
          validation_feedback: "",
        };
        const created = await sr.entities.GenerationJob.create({
          job_type: "coding_packet",
          generator_id: "persistent_coding_supervisor",
          idempotency_key: nextKey,
          status: "queued",
          input_ref: JSON.stringify(nextPayload),
          attempt_count: 0,
          next_attempt_at: new Date().toISOString(),
          description: `Autonomous coding step ${nextIndex + 1}/${steps.length}: ${String(steps[nextIndex]?.title || steps[nextIndex]).slice(0, 180)}`,
        });
        nextJobId = created?.id || null;
      }
    }

    return Response.json({
      ok: true,
      processed: 1,
      state: nextJobId ? "validated_and_continued" : "validated_draft_ready",
      job_id: job.id,
      next_job_id: nextJobId,
      score: validationObj.score || 0,
      claim: "DRAFT_ONLY_NOT_APPLIED_TO_REPOSITORY",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return Response.json({
      ok: false,
      error: error?.message || String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
