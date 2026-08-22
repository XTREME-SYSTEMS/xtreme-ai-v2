import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from "base44:runtime";

// Sends an email notification to the client when an approval is created
// in the pending state. Called by the "Approval Notification" workflow.
// SendEmail reaches registered app users; the client must have a portal account.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { approval_id } = body;
    if (!approval_id) return Response.json({ error: "approval_id required" }, { status: 400 });

    let approval;
    try {
      const approvals = await base44.asServiceRole.entities.Approval.filter({ id: approval_id });
      approval = approvals[0];
    } catch (e) {
      return Response.json({ error: "Approval not found" }, { status: 404 });
    }
    if (!approval) return Response.json({ error: "Approval not found" }, { status: 404 });
    if (approval.status !== "pending") return Response.json({ ok: true, skipped: "not pending" });
    if (!approval.client_email) return Response.json({ ok: true, skipped: "no client_email" });

    const appUrl = secrets.get("WIX_CHECKOUT_APP_URL") || `https://${req.headers.get("host") || ""}`;
    const link = `${appUrl}/approvals`;
    const step = approval.pipeline_step ? ` (${approval.pipeline_step})` : "";

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: approval.client_email,
        subject: `Action needed: ${approval.requested_action || "New approval"}${step}`,
        body: `Hello,\n\nA new step in your build needs your approval:\n\n${approval.requested_action || ""}\n\nReview and approve it here:\n${link}\n\nThank you,\nLead Gen Near You`,
      });
      return Response.json({ ok: true, emailed: true });
    } catch (e) {
      // client_email may not be a registered user — can't deliver. Log and move on.
      return Response.json({ ok: true, emailed: false, error: e.message });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}