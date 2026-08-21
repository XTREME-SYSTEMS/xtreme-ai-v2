import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from "base44:runtime";

// Called by a client from the Welcome (My Package) page when they press
// "Request Revision". Creates an admin-visible Approval record capturing the
// revision note and emails every admin so the team is alerted immediately.
// Runs as service role because the Approval entity is admin-create-only and
// clients must not be able to impersonate admin writes.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { comment, purchaseId, clientEmail } = body;
    if (!comment || !String(comment).trim()) {
      return Response.json({ error: "comment required" }, { status: 400 });
    }

    const note = String(comment).trim();
    const email = clientEmail ? String(clientEmail) : "";

    // 1) Persist the revision request as a pending Approval so it shows up in
    //    the admin's Approvals dashboard immediately.
    let approvalId = null;
    try {
      const created = await base44.asServiceRole.entities.Approval.create({
        entity_type: "Base44Purchase",
        entity_id: purchaseId || "",
        requested_action: "Revise package — client requested changes",
        pipeline_step: "welcome",
        client_email: email,
        risk_level: "yellow",
        status: "pending",
        notes: note,
      });
      approvalId = created?.id || null;
    } catch (e) {
      console.error("submitRevisionRequest: Approval create failed", e?.message || e);
    }

    // 2) Email every admin so the request alerts the team right away.
    let emailed = 0;
    try {
      const users = await base44.asServiceRole.entities.User.list();
      const appUrl = secrets.get("WIX_CHECKOUT_APP_URL") || `https://${req.headers.get("host") || ""}`;
      for (const u of users || []) {
        if (u.role !== "admin" || !u.email) continue;
        try {
          await base44.integrations.Core.SendEmail({
            to: u.email,
            subject: "Revision request from a client",
            body:
              `A client just requested a revision to their package.\n\n` +
              `Client: ${email || "(unknown)"}\n` +
              `Purchase ID: ${purchaseId || "(none)"}\n\n` +
              `Their note:\n${note}\n\n` +
              `Review pending approvals: ${appUrl}/approvals`,
          });
          emailed++;
        } catch (e) {
          console.error("submitRevisionRequest: email to admin failed", u.email, e?.message || e);
        }
      }
    } catch (e) {
      console.error("submitRevisionRequest: admin list failed", e?.message || e);
    }

    return Response.json({ ok: true, approvalId, emailed });
  } catch (error) {
    console.error("submitRevisionRequest error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}