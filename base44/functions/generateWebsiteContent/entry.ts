import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { compileBrief, briefText } from "../../shared/generatorBrief.ts";

// Generates rich, location-aware website copy for a client's site using
// real web context about their area. Industry-aware: uses the client's actual
// industry, subIndustry, businessType, financial intelligence, and industry
// answers instead of hardcoded "epoxy contractor".
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const {
      businessName, services, serviceArea, city, state,
      differentiators, yearsInBusiness, phone, email,
      industry, subIndustry, businessType, financialIntelligence, industryAnswers,
    } = body;

    const biz = businessName || "your business";
    const ind = industry || "epoxy flooring contractor";
    const subInd = subIndustry || "";
    const bizType = businessType || "local service business";
    const loc = [city, state].filter(Boolean).join(", ").trim() || (serviceArea || "your area");
    const svc = Array.isArray(services) && services.length
      ? services.join(", ")
      : "professional services";
    const area = serviceArea || loc;
    const diff = Array.isArray(differentiators) && differentiators.length
      ? differentiators.join("; ")
      : "";

    // Build financial intelligence context
    let finContext = "";
    if (financialIntelligence) {
      const fi = financialIntelligence;
      const parts = [];
      if (fi.competitorPricing?.length) {
        parts.push(`Competitor pricing: ${fi.competitorPricing.map(c => `${c.name}: ${c.price || c.range || "N/A"}`).join("; ")}`);
      }
      if (fi.averagePrice) parts.push(`Average market price: ${fi.averagePrice}`);
      if (fi.marketInsights) parts.push(`Market insights: ${fi.marketInsights}`);
      if (parts.length) finContext = `\n\nFINANCIAL INTELLIGENCE:\n${parts.join("\n")}`;
    }

    // Compile the full structured brief so the copy weaves in the client's
    // signature work, brand personality, visual style, and the specific pain
    // points their customers worry about — not just services + location.
    const brief = compileBrief(body);
    const briefBlock = briefText(brief);

    const prompt = `You are writing the website copy for a local ${ind} business. Make it specific, high-converting, and locally relevant — no generic filler.

CLIENT BRIEF:
${briefBlock}${finContext}

INSTRUCTIONS:
- Weave the client's DIFFERENTIATORS and SIGNATURE WORK into the hero and about sections — don't just list them.
- Address the CUSTOMER PAIN POINTS directly in the FAQ and service descriptions.
- Match the BRAND PERSONALITY in every line of copy.
- Reference the real ${loc} area (surrounding communities, local landmarks, climate, common local needs) so it feels native.

Using real, current information about ${loc} (the real surrounding cities/communities, local landmarks, climate, and common needs there), write website copy that feels native to ${loc}. Reference the actual area and local trust signals where natural. Make all copy specific to the ${ind} industry — use industry-appropriate terminology, pain points, and benefits.

Return JSON with exactly these fields:
- heroHeadline: punchy headline (mention the core service + location)
- heroSubhead: 1-2 sentence subhead
- aboutTitle: about section heading
- aboutBody: 2-4 sentence about paragraph referencing local experience
- services: array of 5-7 objects { title, description } (description 1-2 sentences each)
- faq: array of 6-8 objects { question, answer } (locally relevant, answer 1-2 sentences)
- localArea: 1 paragraph about the service area / nearby communities
- cta: short call-to-action phrase
- metaTitle: <=60 chars
- metaDescription: <=160 chars`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_1_pro",
      response_json_schema: {
        type: "object",
        properties: {
          heroHeadline: { type: "string" },
          heroSubhead: { type: "string" },
          aboutTitle: { type: "string" },
          aboutBody: { type: "string" },
          services: {
            type: "array",
            items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } },
          },
          faq: {
            type: "array",
            items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } },
          },
          localArea: { type: "string" },
          cta: { type: "string" },
          metaTitle: { type: "string" },
          metaDescription: { type: "string" },
        },
      },
    });

    const clean = (v) => {
      if (typeof v === "string") {
        return v
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/https?:\/\/[^\s)]+/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
      }
      if (Array.isArray(v)) return v.map(clean);
      if (v && typeof v === "object") {
        const o = {};
        for (const k of Object.keys(v)) o[k] = clean(v[k]);
        return o;
      }
      return v;
    };
    const content = clean(res);

    return Response.json({ ok: true, content });
  } catch (error) {
    console.error("generateWebsiteContent error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}