import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from "base44:runtime";
import {
  notifyRevisionRequested,
  applyRevisionCascade,
  STEP_LABELS,
} from '../../shared/pipelineNotifications.ts';

// Called by a client from any pipeline step when they press "Request Revision".
// 1. Creates an admin-visible Approval record capturing the revision note.
// 2. Applies the revision cascade: clears the revised step's saved data AND all
//    downstream dependent steps' data on the user profile (e.g. revising the
//    logo invalidates brand mockups + website design).
// 3. Emails the client + all admins about the revision (and which steps cascade).
// 4. Stubs SMS.
// Runs as service role because Approval is admin-create-only and the cascade
// must update the user profile server-side.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { comment, purchaseId, clientEmail, pipelineStep } = body;
    if (!comment || !String(comment).trim()) {
      return Response.json({ error: "comment required" }, { status: 400 });
    }

    const note = String(comment).trim();
    const email = clientEmail ? String(clientEmail) : "";
    const stepKey = pipelineStep || "welcome";
    const stepLabel = STEP_LABELS[stepKey] || stepKey;
    const appUrl =
      secrets.get("WIX_CHECKOUT_APP_URL") ||
      req.headers.get("x-base44-app-url") ||
      `https://${req.headers.get("host") || ""}`;

    // 1) Persist the revision request as a pending Approval so it shows up in
    //    the admin's Approvals dashboard immediately.
    let approvalId = null;
    try {
      const created = await base44.asServiceRole.entities.Approval.create({
        entity_type: "Base44Purchase",
        entity_id: purchaseId || "",
        requested_action: `Revise ${stepLabel} — client requested changes`,
        pipeline_step: stepKey,
        client_email: email,
        risk_level: "yellow",
        status: "pending",
        notes: note,
      });
      approvalId = created?.id || null;
    } catch (e) {
      console.error("submitRevisionRequest: Approval create failed", e?.message || e);
    }

    // 2) Apply the revision cascade: clear the revised step + downstream steps'
    //    saved data so the client must redo them.
    let cascadedSteps: string[] = [];
    try {
      cascadedSteps = await applyRevisionCascade(base44, stepKey, email);
    } catch (e) {
      console.error("submitRevisionRequest: cascade failed", e?.message || e);
    }

    // 3) Email the client + all admins about the revision (including cascade).
    try {
      await notifyRevisionRequested(base44, {
        clientEmail: email,
        stepKey,
        stepLabel,
        comment: note,
        appUrl,
        cascadedSteps,
      });
    } catch (e) {
      console.error("submitRevisionRequest: notification failed", e?.message || e);
    }

    // 4) Audit trail
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "submitRevisionRequest",
        action: `Revision requested: ${stepLabel}`,
        entity_type: "User",
        entity_id: email,
        status: "escalated",
        evidence: `Note: ${note.slice(0, 200)}${cascadedSteps.length ? ` | Cascaded: ${cascadedSteps.join(", ")}` : ""}`,
      });
    } catch (e) {
      console.error("submitRevisionRequest: receipt failed", e?.message || e);
    }

    // 5) D6 — Create a RevisionThread for two-way messaging
    let threadId = null;
    try {
      const thread = await base44.asServiceRole.entities.RevisionThread.create({
        client_email: email,
        step_key: stepKey,
        step_label: stepLabel,
        subject: `Revision: ${stepLabel}`,
        status: "open",
        messages: [{
          sender: "client",
          sender_email: email,
          body: note,
          sent_at: new Date().toISOString(),
        }],
        last_message_at: new Date().toISOString(),
        client_unread_count: 0,
        admin_unread_count: 1,
      });
      threadId = thread?.id || null;
    } catch (e) {
      console.error("submitRevisionRequest: thread create failed", e?.message || e);
    }

    return Response.json({ ok: true, approvalId, threadId, cascadedSteps });
  } catch (error) {
    console.error("submitRevisionRequest error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}