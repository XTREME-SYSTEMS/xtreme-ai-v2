import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from "base44:runtime";

// Notifies all admins when a client approves or denies a pipeline step.
// Called from the client Approvals page after the Approval record is updated.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { approval_id, status } = body;
    if (!approval_id) return Response.json({ error: "approval_id required" }, { status: 400 });
    if (!["approved", "rejected"].includes(status)) {
      return Response.json({ error: "status must be approved or rejected" }, { status: 400 });
    }

    let approval;
    try {
      const approvals = await base44.asServiceRole.entities.Approval.filter({ id: approval_id });
      approval = approvals[0];
    } catch (e) {
      return Response.json({ error: "Approval not found" }, { status: 404 });
    }
    if (!approval) return Response.json({ error: "Approval not found" }, { status: 404 });

    // Find all admin users to notify.
    let admins = [];
    try {
      admins = await base44.asServiceRole.entities.User.filter({ role: "admin" }, undefined, 50);
    } catch (e) {
      /* ignore */
    }
    const adminEmails = (admins || []).map((u) => u.email).filter(Boolean);
    if (adminEmails.length === 0) return Response.json({ ok: true, skipped: "no admins" });

    const appUrl = secrets.get("WIX_CHECKOUT_APP_URL") || `https://${req.headers.get("host") || ""}`;
    const link = `${appUrl}/approvals`;
    const step = approval.pipeline_step || "";
    const client = approval.client_email || "a client";
    const verb = status === "approved" ? "approved" : "denied";
    const subject = `Client ${verb}: ${approval.requested_action || "approval"}${step ? ` (${step})` : ""}`;
    const body_text = `Hello,\n\n${client} has ${verb} the following pipeline step:\n\n${approval.requested_action || ""}\n${step ? `Step: ${step}\n` : ""}${approval.notes ? `Comment: ${approval.notes}\n` : ""}\nReview in the Command Center:\n${link}\n\nLead Gen Near You`;

    const results = await Promise.all(
      adminEmails.map((email) =>
        base44.integrations.Core.SendEmail({ to: email, subject, body: body_text })
          .then(() => ({ email, ok: true }))
          .catch((e) => ({ email, ok: false, error: e.message }))
      )
    );
    return Response.json({ ok: true, notified: results.filter((r) => r.ok).length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}