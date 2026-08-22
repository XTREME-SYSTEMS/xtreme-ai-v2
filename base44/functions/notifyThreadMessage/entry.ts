import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getAdminEmails } from '../../shared/pipelineNotifications.ts';

// G4 — Sends email notifications when a new message is added to a RevisionThread.
// - If the sender is "client", emails all admins so they know to check the thread.
// - If the sender is "admin", emails the client so they know there's a reply.
// Called from useRevisionThreads.sendMessage (client) and AdminRevisionThreads (admin).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { message, sender, clientEmail, stepLabel, threadId } = body;

    if (!message || !sender) {
      return Response.json({ error: "message and sender required" }, { status: 400 });
    }

    const appUrl =
      req.headers.get("x-base44-app-url") ||
      Deno.env.get("WIX_CHECKOUT_APP_URL") ||
      `https://${req.headers.get("host") || ""}`;

    const label = stepLabel || "your project";
    const preview = String(message).slice(0, 200);

    if (sender === "client") {
      // Client sent a message — notify all admins
      const adminEmails = await getAdminEmails(base44);
      for (const adminEmail of adminEmails) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: adminEmail,
            subject: `New revision message: ${label}`,
            body:
              `Client ${clientEmail || "(unknown)"} sent a new message in a revision thread.\n\n` +
              `Message: ${preview}\n\n` +
              `Review & reply: ${appUrl}/approvals`,
          });
        } catch (e) {
          console.error("notifyThreadMessage: admin email failed", adminEmail, e?.message || e);
        }
      }
    } else if (sender === "admin" && clientEmail) {
      // Admin sent a message — notify the client
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: clientEmail,
          subject: `New message from our team: ${label}`,
          body:
            `Our team sent you a reply regarding your revision request for "${label}".\n\n` +
            `Message: ${preview}\n\n` +
            `View & reply: ${appUrl}/my-package`,
        });
      } catch (e) {
        console.error("notifyThreadMessage: client email failed", clientEmail, e?.message || e);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("notifyThreadMessage error:", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}