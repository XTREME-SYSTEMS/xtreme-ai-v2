import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Auto-generates a service agreement (EsignDocument) for a client when they
// reach the signatures step and don't have one yet. Uses the client's
// business profile data to personalize the contract. Idempotent — if a
// draft contract already exists for the client, it returns that instead.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const clientEmail = user.email;

    // Check if the client already has a draft/sent EsignDocument
    const existing = await base44.asServiceRole.entities.EsignDocument.filter(
      { status: { $in: ["draft", "sent", "viewed"] } },
      "-created_date",
      50
    );
    const mine = (existing || []).filter((d) =>
      (d.signers || []).some((s) => s.email?.toLowerCase() === clientEmail.toLowerCase())
    );

    if (mine.length > 0) {
      return Response.json({ ok: true, documentId: mine[0].id, alreadyExisted: true });
    }

    // Build contract from the user's profile data
    const profile = user.epoxyProfile || {};
    const businessName = profile.businessName || user.full_name || "Client";
    const businessStage = profile.businessStage || "new";
    const industry = profile.industry || "";
    const enhancements = user.enhancements || [];
    const enhancementsTotal = user.enhancementsTotal || 0;

    const scope = businessStage === "rebrand"
      ? `Complete brand refresh and website redesign for ${businessName}, including new logo, brand identity, website design, social media kit, and video concepts.`
      : businessStage === "scale"
      ? `Full digital growth package for ${businessName}, including brand identity, website design, social media marketing, SEO optimization, and lead generation infrastructure.`
      : `Complete new business launch package for ${businessName}, including brand identity creation, website design and development, social media kit, video content, and local SEO setup.`;

    const enhancementNote = enhancements.length > 0
      ? `\n\nAdditional enhancements selected: ${enhancements.length} item(s) totaling $${enhancementsTotal}.`
      : "";

    const prompt = `Generate a professional service agreement (contract) as clean HTML article content (use <h2>, <p>, <ul>, <li> — no <html>/<body> wrapper). 

Title: "Service Agreement"
Client/Business: ${businessName}
Signer: ${user.full_name || businessName} (${clientEmail})
Project: ${businessStage === "rebrand" ? "Brand Refresh & Website Redesign" : businessStage === "scale" ? "Digital Growth Package" : "New Business Launch Package"}
Scope of work: ${scope}${enhancementNote}
Price: As quoted in selected package and enhancements
Terms: 50% deposit due at signing, balance due upon project completion. Net 15.

Include these sections:
1. Parties (Lead Gen Near You and ${businessName})
2. Scope of Services (based on the project description above)
3. Project Timeline (standard 2-week build, or 3 business days if rush delivery selected)
4. Fees & Payment (deposit structure, enhancement costs)
5. Client Responsibilities (providing content, photos, timely feedback)
6. Revision Policy (unlimited revisions during build phase, 30-day post-launch support)
7. Intellectual Property (client owns final deliverables upon full payment)
8. Confidentiality
9. Limitation of Liability
10. Cancellation & Refund Policy
11. Governing Law
12. Signatures

Make it professional, enforceable, and easy to read. Use clear headings and bullet points where appropriate.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_opus_4_8",
      response_json_schema: { type: "object", properties: { body: { type: "string" } } },
    });

    // Create the EsignDocument
    const doc = await base44.asServiceRole.entities.EsignDocument.create({
      title: `Service Agreement — ${businessName}`,
      body: res.body,
      account_name: businessName,
      deal_name: businessStage === "rebrand" ? "Brand Refresh" : businessStage === "scale" ? "Growth Package" : "Launch Package",
      status: "sent",
      signers: [{
        name: user.full_name || businessName,
        email: clientEmail,
        signed: false,
      }],
      share_token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      owner_name: "Lead Gen Near You",
    });

    return Response.json({ ok: true, documentId: doc.id, alreadyExisted: false });
  } catch (error) {
    console.error("autoGenerateClientContract error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}