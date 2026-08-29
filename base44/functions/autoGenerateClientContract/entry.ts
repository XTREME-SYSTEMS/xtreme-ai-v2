import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getAdminEmails } from '../../shared/pipelineNotifications.ts';

// Auto-generates a service agreement (EsignDocument) for a client when they
// reach the signatures step and don't have one yet. Uses the client's
// business profile data to personalize the contract. Idempotent — if a
// draft contract already exists for the client, it returns that instead.
//
// The contract is created with status "sent" so the client can review and
// sign it immediately on the Signatures page. The client's actual decisions
// from every step are folded into the body so the agreement reflects exactly
// what they chose. Admins are notified by email and can review the signed
// agreement from the E-Sign Documents page.
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

    const appUrl =
      req.headers.get("x-base44-app-url") ||
      Deno.env.get("WIX_CHECKOUT_APP_URL") ||
      `https://${req.headers.get("host") || ""}`;

    // Build contract from the user's profile data
    const profile = user.epoxyProfile || {};
    const businessName = profile.businessName || user.full_name || "Client";
    const businessStage = profile.businessStage || "new";
    const industry = profile.industry || "";
    const enhancements = user.enhancements || [];
    const enhancementsTotal = user.enhancementsTotal || 0;
    const plan = user.plan || "package";

    // Fetch the full service catalog entry so the contract lists every
    // service and feature included in the client's purchased package.
    let packageFeatures = [];
    let packageName = plan;
    try {
      const catalog = await base44.asServiceRole.entities.ServiceCatalogEntry.filter(
        { product_id: plan }, "-created_date", 1
      );
      if (catalog && catalog.length > 0) {
        const entry = catalog[0];
        packageName = entry.name || plan;
        packageFeatures = (entry.features || []).map((f) => f.text || f);
      }
    } catch (e) {
      console.error("autoGenerateClientContract: catalog fetch failed", e?.message || e);
    }

    // Pull the client's creative decisions from their ClientProject so the
    // contract reflects exactly what they chose at each portal step.
    let project = null;
    try {
      const projects = await base44.asServiceRole.entities.ClientProject.filter(
        { client_email: clientEmail }, "-created_date", 1
      );
      project = projects?.[0] || null;
    } catch (e) {
      console.error("autoGenerateClientContract: project fetch failed", e?.message || e);
    }

    const decisionsLines = [];
    decisionsLines.push(`Business: ${businessName} (${industry})`);
    if (profile.businessStage) decisionsLines.push(`Stage: ${profile.businessStage}`);
    if (profile.primaryLocation) decisionsLines.push(`Location: ${profile.primaryLocation}`);
    if (profile.businessType) {
      const bt = Array.isArray(profile.businessType) ? profile.businessType.join(", ") : profile.businessType;
      if (bt) decisionsLines.push(`Customer base: ${bt}`);
    }
    if (profile.radius) decisionsLines.push(`Service radius: ${profile.radius}`);
    if (profile.yearsInBusiness) decisionsLines.push(`Years in business: ${profile.yearsInBusiness}`);
    const ia = profile.industryAnswers || {};
    for (const [k, v] of Object.entries(ia)) {
      if (!v || (Array.isArray(v) && v.length === 0)) continue;
      decisionsLines.push(`- ${k.replace(/_/g, " ")}: ${Array.isArray(v) ? v.join(", ") : v}`);
    }
    if (project) {
      if (project.chosen_content_template) decisionsLines.push(`Content tone: ${project.chosen_content_template}`);
      if (project.chosen_logo_url) decisionsLines.push(`Logo: chosen`);
      const bi = (project.chosen_brand_images || []).length;
      if (bi) decisionsLines.push(`Brand mockups chosen: ${bi}`);
      if (project.chosen_website_layout) decisionsLines.push(`Website layout: ${project.chosen_website_layout}`);
      if (project.chosen_palette) decisionsLines.push(`Color palette: ${project.chosen_palette}`);
      if (project.social_media_chosen) decisionsLines.push(`Social media kit: approved`);
      if (project.video_chosen) decisionsLines.push(`Video concepts: approved`);
    }
    const ownerPhotos = (profile.ownerPhotos || []).length;
    const teamPhotos = (profile.teamPhotos || []).length;
    const workPhotos = (profile.workPhotos || profile.galleryUrls || []).length;
    const otherPhotos = (profile.otherPhotos || []).length;
    if (ownerPhotos || teamPhotos || workPhotos || otherPhotos) {
      decisionsLines.push(`Photos provided — owner: ${ownerPhotos}, team: ${teamPhotos}, work: ${workPhotos}, other: ${otherPhotos}`);
    }
    if (enhancements.length) decisionsLines.push(`Enhancements: ${enhancements.join(", ")} (total $${enhancementsTotal})`);
    const decisionsSummary = decisionsLines.join("\n");

    const scope = businessStage === "rebrand"
      ? `Complete brand refresh and website redesign for ${businessName}, including new logo, brand identity, website design, social media kit, and video concepts.`
      : businessStage === "scale"
      ? `Full digital growth package for ${businessName}, including brand identity, website design, social media marketing, SEO optimization, and lead generation infrastructure.`
      : `Complete new business launch package for ${businessName}, including brand identity creation, website design and development, social media kit, video content, and local SEO setup.`;

    const enhancementNote = enhancements.length > 0
      ? `\n\nAdditional enhancements selected: ${enhancements.length} item(s) totaling $${enhancementsTotal}.`
      : "";

    const packageFeaturesHtml = packageFeatures.length > 0
      ? `\nPackage: ${packageName}\nIncluded services:\n${packageFeatures.map((f) => `- ${f}`).join("\n")}\n`
      : `\nPackage: ${packageName}\n`;

    const prompt = `Generate a professional service agreement (contract) as clean HTML article content (use <h2>, <p>, <ul>, <li> — no <html>/<body> wrapper). 

Title: "Service Agreement"
Client/Business: ${businessName}
Signer: ${user.full_name || businessName} (${clientEmail})
Project: ${businessStage === "rebrand" ? "Brand Refresh & Website Redesign" : businessStage === "scale" ? "Digital Growth Package" : "New Business Launch Package"}
Scope of work: ${scope}${enhancementNote}
Price: As quoted in selected package and enhancements
Terms: 50% deposit due at signing, balance due upon project completion. Net 15.

Package & included services (incorporate ALL of these into a "Package & Services" section as a bulleted list so the client can see everything included):
${packageFeaturesHtml}

Client decisions & specifications (incorporate these into a "Project Specifications" section as a bulleted review of exactly what the client chose at each step):
${decisionsSummary}

Include these sections:
1. Parties (Lead Gen Near You and ${businessName})
2. Package & Services (list EVERY included service from the package features above as bullets)
3. Scope of Services (based on the project description above)
4. Project Specifications (list every item from the client decisions summary above as bullets so the client can review their choices)
5. Enhancements & Add-ons (list each enhancement by name with its price, then the total)
6. Project Timeline (standard 2-week build, or 3 business days if rush delivery selected)
7. Fees & Payment (deposit structure, enhancement costs, total enhancement amount: $${enhancementsTotal})
8. Client Responsibilities (providing content, photos, timely feedback)
9. Revision Policy (unlimited revisions during build phase, 30-day post-launch support)
10. Intellectual Property (client owns final deliverables upon full payment)
11. Confidentiality
12. Limitation of Liability
13. Cancellation & Refund Policy
14. Governing Law
15. Signatures

Make it professional, enforceable, and easy to read. Use clear headings and bullet points where appropriate.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_opus_4_8",
      response_json_schema: { type: "object", properties: { body: { type: "string" } } },
    });

    // Create as "sent" so the client can review and sign immediately
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

    // G6 — Notify admins that a contract needs review
    try {
      const adminEmails = await getAdminEmails(base44);
      for (const adminEmail of adminEmails) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: adminEmail,
            subject: `Contract sent to client: ${businessName}`,
            body:
              `A service agreement was auto-generated and sent to ${businessName} (${clientEmail}) for signature.\n\n` +
              `It includes the client's chosen options from every step. You can review the signed agreement from the E-Sign Documents page.\n\n` +
              `Review: ${appUrl}/esign/documents`,
          });
        } catch (e) {
          console.error("autoGenerateClientContract: admin email failed", adminEmail, e?.message || e);
        }
      }
    } catch {}

    return Response.json({ ok: true, documentId: doc.id, alreadyExisted: false });
  } catch (error) {
    console.error("autoGenerateClientContract error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}