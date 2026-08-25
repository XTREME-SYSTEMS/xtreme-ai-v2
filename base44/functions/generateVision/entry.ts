// generateVision — generates a comprehensive vision document for a client's
// business/project. The vision defines WHAT we're building and WHY — it's
// the mandatory foundation before any building begins.
//
// Called from the client portal Vision page. Saves the vision to the
// client's ClientProject record.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.43";
import { generateVisionDoc } from "../../shared/visionStrategyGenerators.ts";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { businessName, industry, subIndustry, primaryLocation, services, productDescription, targetAudience, businessType } = body;

    if (!industry && !businessName) {
      return new Response(JSON.stringify({ error: "Industry or business name is required" }), { status: 400 });
    }

    // Load the client's project to get profile data
    const projects = await base44.entities.ClientProject.filter(
      { client_email: user.email }, "-created_date", 1
    );
    const project = projects?.[0];

    // Merge profile data from the project with any explicit params
    const profile = project?.profile || {};
    const params = {
      businessName: businessName || project?.business_name || "",
      industry: industry || project?.industry || "",
      subIndustry: subIndustry || project?.sub_industry || "",
      primaryLocation: primaryLocation || profile.primary_location || "",
      services: services || profile.services || [],
      productDescription: productDescription || profile.product_description || "",
      targetAudience: targetAudience || profile.target_audience || "",
      businessType: businessType || project?.business_type || "local service business",
    };

    const vision = await generateVisionDoc(base44, params);

    // Save to the client's project
    if (project) {
      await base44.entities.ClientProject.update(project.id, { vision });
    } else {
      await base44.entities.ClientProject.create({
        client_email: user.email,
        business_name: params.businessName,
        industry: params.industry,
        sub_industry: params.subIndustry,
        vision,
      });
    }

    return new Response(JSON.stringify({ ok: true, vision }), { status: 200 });
  } catch (e) {
    console.error("generateVision error:", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});