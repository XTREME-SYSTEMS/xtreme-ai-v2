import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Programmatic SEO/AEO page generator. Produces a fully optimized, keyword-rich,
// indexable landing page (service x city x intent) with FAQ-as-open-text and
// Schema.org JSON-LD (Service + FAQPage), stored as a SeoPage for the /seo/:slug route.
// Admin-only: this publishes public marketing content.

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { service, city, state, intent } = body || {};
    if (!service || !city) return Response.json({ error: "service and city are required" }, { status: 400 });
    const st = state || "FL";
    const targetKeyword = `${service} in ${city} ${st}`;
    const slug = `${slugify(service)}-${slugify(city)}`;

    const schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        meta_description: { type: "string" },
        h1: { type: "string" },
        intro: { type: "string" },
        sections: { type: "array", items: { type: "object", properties: { heading: { type: "string" }, body: { type: "string" } } } },
        faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
        json_ld_service: { type: "object" },
        json_ld_faq: { type: "object" },
      },
    };

    const prompt = `You are an elite SEO and AEO (Answer Engine Optimization) content architect. Write a fully optimized, indexable landing page targeting the keyword "${targetKeyword}" (intent: ${intent || "commercial / local service"}). Requirements:
- title: compelling, keyword-fronted, under 60 chars.
- meta_description: keyword-rich, click-optimized, under 155 chars.
- h1: keyword-fronted, under 70 chars.
- intro: 2-3 sentences containing the keyword and city, conversational, trust-building.
- sections: 5-7 sections, each with a keyword-rich heading and 2-4 paragraphs of original, specific, helpful content. Cover: services offered, why local matters, cost/pricing transparency, process, what to look for, and a CTA section. Naturally weave "${service}", "${city}", "${st}", and related phrases (near me, best, affordable, emergency, quotes, estimates, reviews).
- faq: 6-8 question/answer pairs answering real search questions (cost, timing, how to choose, emergency, free estimates, financing). Answers 2-3 sentences, factual, cite-worthy.
- json_ld_service: a Schema.org Service object (name, serviceType, areaServed as PostalAddress, provider as LocalBusiness with name + address, offers with priceRange).
- json_ld_faq: a Schema.org FAQPage object with the same faq entries.
Do not stuff keywords unnaturally. Write for humans first, search second. Return JSON only.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: schema,
      model: "gemini_3_flash",
    });

    const jsonLd = JSON.stringify([res.json_ld_service, res.json_ld_faq].filter(Boolean));
    const page = await base44.asServiceRole.entities.SeoPage.create({
      slug, service, city, state: st, intent: intent || "local service",
      target_keyword: targetKeyword,
      title: res.title, meta_description: res.meta_description, h1: res.h1, intro: res.intro,
      sections: res.sections || [], faq: res.faq || [], json_ld: jsonLd, status: "published",
    });

    return Response.json({ slug, url: `/seo/${slug}`, page_id: page.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}