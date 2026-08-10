import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public e-sign portal: fetch a document by share token, or record a signature.
// No auth gate — the share_token is the access secret.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, token, signature } = body;

    const docs = await base44.asServiceRole.entities.EsignDocument.filter({ share_token: token });
    const doc = docs[0];
    if (!doc) return Response.json({ error: "Document not found" }, { status: 404 });

    if (action === "get") {
      if (doc.status === "draft" || doc.status === "sent") {
        await base44.asServiceRole.entities.EsignDocument.update(doc.id, { status: "viewed" });
      }
      return Response.json({
        doc: { id: doc.id, title: doc.title, body: doc.body, signers: doc.signers, status: doc.status, account_name: doc.account_name, deal_name: doc.deal_name },
      });
    }
    if (action === "sign") {
      const signers = (doc.signers || []).map((s) => ({ ...s, signed: true, signed_at: new Date().toISOString(), signature }));
      await base44.asServiceRole.entities.EsignDocument.update(doc.id, { status: "signed", signers, signed_pdf_url: signature });
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}