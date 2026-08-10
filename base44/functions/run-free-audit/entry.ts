import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Free AI Optimization Audit funnel — captures the lead, runs a real AI audit of the
// submitted website (leaks, SEO, AEO, conversion, performance, mobile, trust, lead capture),
// persists scores + full report, and returns the report to the page for on-screen delivery.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { website, name, email, phone } = body || {};
    if (!website) return Response.json({ error: "website required" }, { status: 400 });

    const url = website.match(/^https?:\/\//i) ? website : `https://${website}`;

    // Capture the lead
    const auditReq = await base44.asServiceRole.entities.AuditRequest.create({
      website: url,
      name: name || "",
      email: email || "",
      phone: phone || "",
      status: "new",
      source: "free_audit_funnel",
    });

    const schema = {
      type: "object",
      properties: {
        overall_score: { type: "number" },
        scores: {
          type: "object",
          properties: {
            seo: { type: "number" },
            aeo: { type: "number" },
            conversion: { type: "number" },
            performance: { type: "number" },
            mobile: { type: "number" },
            trust: { type: "number" },
            brand: { type: "number" },
            lead_capture: { type: "number" }
          }
        },
        summary: { type: "string" },
        leaks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
              finding: { type: "string" },
              recommendation: { type: "string" },
              impact: { type: "string" }
            }
          }
        },
        opportunities: { type: "array", items: { type: "string" } },
        estimated_leads_lost: { type: "string" }
      }
    };

    const prompt = `You are an expert lead-generation and growth auditor. Audit the website ${url} for its ability to attract, capture, and convert leads. Analyze: SEO (on-page, local, technical), AEO (answer engine optimization / AI search visibility on Google AI Overviews, ChatGPT, Perplexity), conversion rate optimization, site performance & speed, mobile experience, trust & credibility signals, brand presence, and lead capture mechanisms (forms, CTAs, chat, click-to-call, contact options). Give a 0-100 score for each area and an overall_score 0-100. Identify the top LEAKS — specific places this business is losing leads (e.g., missing or weak CTAs, slow load, no lead form, poor mobile UX, no structured data, weak local SEO / Google Business Profile, no AI-search visibility, no trust signals, no lead magnet). For each leak: category, severity (critical/high/medium/low), the specific finding, a concrete recommendation to fix it, and the impact fixing it would have. Also list the top opportunities and a plain-English estimate of leads or revenue likely being lost per month. Be specific, actionable, and grounded in what you can observe about this site. Return JSON only.`;

    const report = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: schema,
      model: "gemini_3_flash",
    });

    const scores = report.scores || {};
    await base44.asServiceRole.entities.AuditRequest.update(auditReq.id, {
      overall_score: report.overall_score,
      seo_score: scores.seo,
      aeo_score: scores.aeo,
      conversion_score: scores.conversion,
      performance_score: scores.performance,
      mobile_score: scores.mobile,
      trust_score: scores.trust,
      report: JSON.stringify(report),
      status: "completed",
    });

    return Response.json({ ...report, audit_id: auditReq.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}