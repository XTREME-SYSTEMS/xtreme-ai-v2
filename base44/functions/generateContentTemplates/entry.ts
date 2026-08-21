import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Content Generator: scrapes the client's market (location, industry,
// competitors, pricing, existing website, social presence) via web search and
// generates 10 distinct content/tone templates for their website messaging.
// Industry-aware: uses the client's actual industry, subIndustry, businessType,
// and financial intelligence instead of hardcoded "epoxy contractor".
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const {
      businessName, services, primaryLocation, website, differentiators,
      yearsInBusiness, phone, email,
      industry, subIndustry, businessType, financialIntelligence, industryAnswers,
    } = body;

    const biz = businessName || "your business";
    const loc = primaryLocation || "your area";
    const ind = industry || "epoxy flooring contractor";
    const subInd = subIndustry || "";
    const bizType = businessType || "local service business";
    const svc = (services || []).join(", ") || "professional services";
    const diff = (differentiators || []).join(", ");
    const years = yearsInBusiness || "";
    const site = website || "";

    // Build financial intelligence context if available
    let finContext = "";
    if (financialIntelligence) {
      const fi = financialIntelligence;
      const parts = [];
      if (fi.competitorPricing?.length) {
        parts.push(`Competitor pricing: ${fi.competitorPricing.map(c => `${c.name}: ${c.price || c.range || "N/A"}`).join("; ")}`);
      }
      if (fi.averagePrice) parts.push(`Average market price: ${fi.averagePrice}`);
      if (fi.marketInsights) parts.push(`Market insights: ${fi.marketInsights}`);
      if (fi.recommendedPricing) parts.push(`Recommended pricing strategy: ${fi.recommendedPricing}`);
      if (parts.length) finContext = `\n\nFINANCIAL INTELLIGENCE:\n${parts.join("\n")}`;
    }

    // Build industry answers context if available
    let answersContext = "";
    if (industryAnswers && typeof industryAnswers === "object" && Object.keys(industryAnswers).length > 0) {
      answersContext = `\n\nCLIENT-SPECIFIC ANSWERS:\n${Object.entries(industryAnswers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;
    }

    const prompt = `You are a senior brand strategist and direct-response copywriter for local service businesses. A client needs website messaging for their ${ind} business.

BUSINESS: ${biz}
INDUSTRY: ${ind}${subInd ? ` (${subInd})` : ""}
BUSINESS TYPE: ${bizType}
LOCATION: ${loc}
SERVICES: ${svc}
YEARS IN BUSINESS: ${years}
DIFFERENTIATORS: ${diff}
EXISTING WEBSITE: ${site || "none"}${finContext}${answersContext}

STEP 1 — Research the market. Use real web data about ${loc}: the local ${ind} competition, typical pricing, what customers there care about, and what messaging the top competitors use. Note 3-5 key findings.

STEP 2 — Create 10 DISTINCT content/tone templates. Each must be a genuinely different voice/approach (not just reworded). Each template includes a hero headline, hero subhead, a 2-sentence about summary, and a CTA — all in that tone. Make them specific to the ${ind} industry and ${loc} area.

STEP 3 — Recommend the SINGLE BEST template for this specific business + market. Base it on your research: what will convert best given the local competition, the business's differentiators, and what customers in ${loc} respond to. Give a factual reason and an estimated outcome.

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