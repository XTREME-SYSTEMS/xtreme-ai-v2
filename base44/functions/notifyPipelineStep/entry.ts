import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from "base44:runtime";
import { notifyStepCompleted, STEP_LABELS } from '../../shared/pipelineNotifications.ts';

// Called by the frontend after a client completes a pipeline step. Sends a
// "step completed" email to the client + all admins, and stubs SMS. Creates a
// Receipt for audit trail. Runs as service role so it can list admin users.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { stepKey, stepLabel, clientEmail, businessName } = body;

    if (!stepKey) {
      return Response.json({ error: "stepKey required" }, { status: 400 });
    }

    const label = stepLabel || STEP_LABELS[stepKey] || stepKey;
    const appUrl =
      secrets.get("WIX_CHECKOUT_APP_URL") ||
      req.headers.get("x-base44-app-url") ||
      `https://${req.headers.get("host") || ""}`;

    await notifyStepCompleted(base44, {
      clientEmail: clientEmail || "",
      stepKey,
      stepLabel: label,
      appUrl,
      businessName: businessName || "",
    });

    // Audit trail
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "notifyPipelineStep",
        action: `Step completed: ${label}`,
        entity_type: "User",
        entity_id: clientEmail || "",
        status: "success",
        evidence: "Email sent to client + admins. SMS stubbed.",
      });
    } catch (e) {
      console.error("notifyPipelineStep: receipt failed", e?.message || e);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("notifyPipelineStep error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}