import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { compileBrief, briefText } from "../../shared/generatorBrief.ts";

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

    // Compile the full structured brief from onboarding answers so the
    // copy reflects the client's visual style, brand personality, signature
    // work, and customer pain points — not just services + location.
    const brief = compileBrief(body);
    const briefBlock = briefText(brief);

    const prompt = `You are a senior brand strategist and viral-marketing copywriter for local service businesses. A client needs website messaging for their ${ind} business.

CLIENT BRIEF:
${briefBlock}
EXISTING WEBSITE: ${site || "none"}${finContext}

STEP 1 — Research the market. Use real web data about ${loc}: the local ${ind} competition, typical pricing, what customers there care about, and what messaging the top competitors use. Note 3-5 key findings.

STEP 2 — Create exactly 10 DISTINCT content/tone templates. Each must be a genuinely different voice/approach (not just reworded) — e.g. direct/benefit-driven, local-proud, premium/luxury, urgent/problem-solver, story-driven, data-driven, contrarian, community-focused, aspirational, humorous. Each template includes a hero headline, hero subhead, a 2-sentence about summary, and a CTA — all in that tone. Make them specific to the ${ind} industry and ${loc} area.

STEP 3 — Score each template's VIRAL POTENTIAL (0-100) — how likely this messaging is to get shared, talked about, and remembered in the local ${ind} market — and its CONVERSION POTENTIAL (0-100) — how likely it is to turn visitors into leads. Consider emotional hook, specificity, local relevance, differentiation from competitors, and shareability.

STEP 4 — Recommend the SINGLE BEST template — the one most likely to go viral AND convert best for this specific business + market. Base it on your research: the local competition, the business's differentiators, and what customers in ${loc} respond to. Give a factual reason and an estimated outcome.

Return JSON:
{
  marketFindings: string (3-5 key findings about the local market),
  templates: [ { id, name, tone, heroHeadline, heroSubhead, aboutSummary, cta, whyRecommended, estimatedOutcome, viralScore, conversionScore } ] (exactly 10 items),
  recommendedIndex: number (0-9, the index of the best template — highest combined viral + conversion potential),
  recommendationReason: string (factual reason for the recommendation, referencing viral + conversion scores)
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
                viralScore: { type: "number" },
                conversionScore: { type: "number" },
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

    let result = clean(res);

    // Ensure exactly 10 templates; guard against missing fields and bad index.
    if (result && Array.isArray(result.templates)) {
      result.templates = result.templates.slice(0, 10).map((t, i) => ({
        id: t.id || `tpl-${String(i + 1).padStart(2, "0")}`,
        name: t.name || `Tone ${i + 1}`,
        tone: t.tone || "",
        heroHeadline: t.heroHeadline || "",
        heroSubhead: t.heroSubhead || "",
        aboutSummary: t.aboutSummary || "",
        cta: t.cta || "",
        whyRecommended: t.whyRecommended || "",
        estimatedOutcome: t.estimatedOutcome || "",
        viralScore: typeof t.viralScore === "number" ? t.viralScore : 0,
        conversionScore: typeof t.conversionScore === "number" ? t.conversionScore : 0,
      }));
      if (typeof result.recommendedIndex !== "number" || result.recommendedIndex < 0 || result.recommendedIndex >= result.templates.length) {
        let best = 0, bestScore = -1;
        result.templates.forEach((t, i) => {
          const score = (t.viralScore || 0) + (t.conversionScore || 0);
          if (score > bestScore) { bestScore = score; best = i; }
        });
        result.recommendedIndex = best;
      }
    }

    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error("generateContentTemplates error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}