import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
    const body = await req.json();
    let { document_id, title, deal_name, account_name, party_name, party_email, scope, price, terms } = body;

    if (document_id) {
      const docs = await base44.asServiceRole.entities.EsignDocument.filter({ id: document_id });
      const d = docs[0];
      if (d) {
        title = title || d.title;
        deal_name = deal_name || d.deal_name;
        account_name = account_name || d.account_name;
        const s = (d.signers || [])[0] || {};
        party_name = party_name || s.name;
        party_email = party_email || s.email;
      }
    }

    const prompt = `Generate a professional service agreement (contract) as clean HTML article content (use <h2>, <p>, <ul>, <li> — no <html>/<body> wrapper). Title: "${title || "Service Agreement"}". Client/Business: ${account_name || "Client"}. Signer: ${party_name || ""} (${party_email || ""}). Deal/Project: ${deal_name || "Services"}. Scope of work: ${scope || "digital marketing and lead generation services"}. Price: ${price || "as quoted"}. Terms: ${terms || "net 30, standard"}. Include sections: Parties, Scope of Services, Term, Fees & Payment, Responsibilities, Confidentiality, Limitation of Liability, Governing Law, Signatures. Make it professional and enforceable.`;
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: { type: "object", properties: { body: { type: "string" } } },
    });

    if (document_id) {
      await base44.asServiceRole.entities.EsignDocument.update(document_id, { body: res.body });
    }
    return Response.json({ body: res.body });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}