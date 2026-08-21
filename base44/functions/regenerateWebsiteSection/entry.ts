import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Regenerates a single content section (hero / about / services / faq) of the
// client's website copy via LLM, merging the result back into the saved
// content. Lets the client fix just the part they don't like without a full
// re-generation. `feedback` carries their per-section comment so the rewrite
// can address it directly.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { section, content, profile, feedback } = body;
    const p = profile || {};
    const c = content || {};
    const biz = p.businessName || "your epoxy business";
    const loc = p.primaryLocation || "your area";
    const svc = (p.services || []).join(", ") || "epoxy flooring, polished concrete";
    const diff = (p.differentiators || []).join(", ");
    const years = p.yearsInBusiness || "";
    const fb = feedback ? ` Client feedback to address: ${feedback}` : "";

    let prompt, schema;
    if (section === "hero") {
      prompt = `Rewrite ONLY the hero section for a local epoxy contractor website. Business: ${biz}. Location: ${loc}. Core services: ${svc}.${fb} Keep it punchy and locally relevant. Return JSON { heroHeadline, heroSubhead }.`;
      schema = { type: "object", properties: { heroHeadline: { type: "string" }, heroSubhead: { type: "string" } } };
    } else if (section === "about") {
      prompt = `Rewrite ONLY the about section. Business: ${biz}. Location: ${loc}. Services: ${svc}. Years in business: ${years}. Differentiators: ${diff}.${fb} Return JSON { aboutTitle, aboutBody, localArea }.`;
      schema = { type: "object", properties: { aboutTitle: { type: "string" }, aboutBody: { type: "string" }, localArea: { type: "string" } } };
    } else if (section === "services") {
      prompt = `Rewrite ONLY the services section. Business: ${biz}. Location: ${loc}. Services offered: ${svc}.${fb} Return JSON { services: array of 5-7 objects { title, description (1-2 sentences) } }.`;
      schema = { type: "object", properties: { services: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } } } } };
    } else if (section === "faq") {
      prompt = `Rewrite ONLY the FAQ section. Business: ${biz}. Location: ${loc}. Services: ${svc}.${fb} Return JSON { faq: array of 6-8 objects { question, answer (1-2 sentences) } }.`;
      schema = { type: "object", properties: { faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } } } };
    } else {
      return Response.json({ error: "unsupported section" }, { status: 400 });
    }

    const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    return Response.json({ ok: true, section, updates: res });
  } catch (error) {
    console.error("regenerateWebsiteSection error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}