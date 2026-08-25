// generateStrategy — generates a comprehensive strategy document for a
// client's business/project, building on the approved vision. The strategy
// defines HOW we get there — the plan, risks, resources, and roadmap.
//
// Called from the client portal Strategy page. Requires an approved vision
// document. Saves the strategy to the client's ClientProject record.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.43";
import { generateStrategyDoc } from "../../shared/visionStrategyGenerators.ts";

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

    // Load the client's project to get the vision and profile data
    const projects = await base44.entities.ClientProject.filter(
      { client_email: user.email }, "-created_date", 1
    );
    const project = projects?.[0];

    if (!project?.vision) {
      return new Response(JSON.stringify({ error: "Vision document is required before generating strategy. Generate and approve your vision first." }), { status: 400 });
    }

    const profile = project.profile || {};
    const params = {
      businessName: body.businessName || project.business_name || "",
      industry: body.industry || project.industry || "",
      subIndustry: body.subIndustry || project.sub_industry || "",
      primaryLocation: body.primaryLocation || profile.primary_location || "",
      services: body.services || profile.services || [],
      productDescription: body.productDescription || profile.product_description || "",
      targetAudience: body.targetAudience || profile.target_audience || "",
      businessType: body.businessType || project.business_type || "local service business",
      vision: project.vision,
    };

    const strategy = await generateStrategyDoc(base44, params);

    // Save to the client's project
    await base44.entities.ClientProject.update(project.id, { strategy });

    return new Response(JSON.stringify({ ok: true, strategy }), { status: 200 });
  } catch (e) {
    console.error("generateStrategy error:", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});