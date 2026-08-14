import { base44 } from "@/api/base44Client";

// Match an Approval record to a universal pipeline step. Uses the explicit
// `pipeline_step` key when present (exact match), falling back to label
// substring matching for legacy approvals that predate the field.
export function stepMatches(step, approval) {
  if (approval.pipeline_step) return approval.pipeline_step === step.key;
  const hay = `${approval.requested_action || ""} ${approval.notes || ""} ${approval.entity_type || ""}`.toLowerCase();
  return hay.includes(step.label.toLowerCase());
}

// Log a client-portal action to the Receipt entity so it appears in the
// client's Activity feed. Best-effort — never throws to the caller.
export async function logReceipt({ action, entityType, entityId, status, notes }) {
  try {
    await base44.entities.Receipt.create({
      agent_or_workflow: "client-portal",
      action,
      entity_type: entityType || "",
      entity_id: entityId || "",
      status: status || "success",
      evidence: notes || "",
    });
  } catch (e) {
    /* best effort */
  }
}