import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from "base44:runtime";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
    const body = await req.json();
    const { document_id } = body;
    const docs = await base44.asServiceRole.entities.EsignDocument.filter({ id: document_id });
    const doc = docs[0];
    if (!doc) return Response.json({ error: "Document not found" }, { status: 404 });

    const appUrl = secrets.get("WIX_CHECKOUT_APP_URL") || `https://${req.headers.get("host") || ""}`;
    const link = `${appUrl}/sign/${doc.share_token}`;
    let emailed = false;
    const signers = doc.signers || [];
    for (const s of signers) {
      if (!s.email) continue;
      try {
        await base44.integrations.Core.SendEmail({
          to: s.email,
          subject: `Document for signature: ${doc.title}`,
          body: `Hello ${s.name || ""},\n\nYou have a document ready to sign: ${doc.title}.\n\nOpen and sign it here:\n${link}\n\nThank you.`,
        });
        emailed = true;
      } catch (e) {
        // signer may not be a registered app user — link is still returned for manual share
      }
    }
    await base44.asServiceRole.entities.EsignDocument.update(document_id, { status: "sent" });
    return Response.json({ link, emailed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}