import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Content Generator: scrapes the client's market (location, industry,
// competitors, pricing, existing website, social presence) via web search and
// generates 10 distinct content/tone templates for their website messaging.
// Each template is a different "voice" (e.g. authoritative, friendly, premium,
// urgent). The system recommends the best one based on the market analysis,
// with a factual reason and an estimated outcome.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { businessName, services, primaryLocation, website, differentiators, yearsInBusiness, phone, email } = body;

    const biz = businessName || "your epoxy business";
    const loc = primaryLocation || "your area";
    const svc = (services || []).join(", ") || "epoxy flooring, polished concrete";
    const diff = (differentiators || []).join(", ");
    const years = yearsInBusiness || "";
    const site = website || "";

    const prompt = `You are a senior brand strategist and direct-response copywriter for local service businesses. A client needs website messaging for their epoxy contractor business.

BUSINESS: ${biz}
LOCATION: ${loc}
SERVICES: ${svc}
YEARS IN BUSINESS: ${years}
DIFFERENTIATORS: ${diff}
EXISTING WEBSITE: ${site || "none"}

STEP 1 — Research the market. Use real web data about ${loc}: the local epoxy/concrete coating competition, typical pricing, what customers there care about, and what messaging the top competitors use. Note 3-5 key findings.

STEP 2 — Create 10 DISTINCT content/tone templates. Each must be a genuinely different voice/approach (not just reworded). Examples of tones: "Trusted Local Expert", "Premium & High-End", "Fast & Friendly", "Tough & Durable", "Family-Run & Personal", "Results-Driven & Bold", "Educational & Helpful", "Urgent & Action-Oriented", "Luxury & Exclusive", "Community-Rooted". Each template includes a hero headline, hero subhead, a 2-sentence about summary, and a CTA — all in that tone.

STEP 3 — Recommend the SINGLE BEST template for this specific business + market. Base it on your research: what will convert best given the local competition, the business's differentiators, and what customers in ${loc} respond to. Give a factual reason and an estimated outcome (e.g. "expected 15-25% more lead form submissions because…").

Return JSON:
{
  marketFindings: string (3-5 key findings about the local market),
  templates: [ { id, name, tone, heroHeadline, heroSubhead, aboutSummary, cta, whyRecommended, estimatedOutcome } ] (10 items),
  recommendedIndex: number (0-9, the index of the best template),
  recommendationReason: string (factual reason for the recommendation)
}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_1_pro",
      response_json_schema: {
        type: "object",
        properties: {
          marketFindings: { type: "string" },
          templates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                tone: { type: "string" },
                heroHeadline: { type: "string" },
                heroSubhead: { type: "string" },
                aboutSummary: { type: "string" },
                cta: { type: "string" },
                whyRecommended: { type: "string" },
                estimatedOutcome: { type: "string" },
              },
            },
          },
          recommendedIndex: { type: "number" },
          recommendationReason: { type: "string" },
        },
      },
    });

    // Clean any leaked citation links from text fields.
    const clean = (v) => {
      if (typeof v === "string") return v.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/https?:\/\/[^\s)]+/g, "").replace(/\s{2,}/g, " ").trim();
      if (Array.isArray(v)) return v.map(clean);
      if (v && typeof v === "object") { const o = {}; for (const k of Object.keys(v)) o[k] = clean(v[k]); return o; }
      return v;
    };

    return Response.json({ ok: true, data: clean(res) });
  } catch (error) {
    console.error("generateContentTemplates error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}