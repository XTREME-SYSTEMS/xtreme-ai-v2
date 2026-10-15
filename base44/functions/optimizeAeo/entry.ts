import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// AEO + AI-search optimizer. Takes a page's content + target keyword + location
// and returns content shaped to be quoted by AI search engines (Google AI
// Overviews, ChatGPT, Perplexity, etc.): a concise answer block (40-60 words),
// a "People Also Ask" FAQ set, recommended schema.org JSON-LD (FAQPage,
// Service, HowTo as fits), and entity/topic suggestions to strengthen
// topical authority. This runs as a post-generation enhancement pass.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { content, keyword, location, businessName, industry, services } = body;
    const c = content || {};
    const kw = keyword || "";
    const loc = location || "";
    const biz = businessName || "";
    const ind = industry || "";
    const svc = (services || []).join(", ");

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an AEO (Answer Engine Optimization) and AI-search specialist. Optimize the page below so AI search engines (Google AI Overviews, ChatGPT, Perplexity) quote it directly and cite it as a source.

BUSINESS: ${biz}
INDUSTRY: ${ind}
LOCATION: ${loc}
SERVICES: ${svc || "n/a"}
TARGET KEYWORD: ${kw || "n/a"}

PAGE CONTENT:
${JSON.stringify(c).slice(0, 8000)}

Produce:
1. answerBlock — a single concise, self-contained answer (40-60 words) to the implicit question "${kw ? kw + " near " + loc : "best " + ind + " near " + loc}". Must be quotable as-is, factual, include the business name and location, no fluff.
2. peopleAlsoAsk — 6 real questions a customer would ask (phrased naturally), each with a 1-2 sentence answer that an AI could quote.
3. schema — a JSON-LD object array with the most relevant of: FAQPage, Service, LocalBusiness, HowTo. Use realistic values from the business. Return as a JSON array of objects (each a full JSON-LD node), NOT a string.
4. entities — 8-12 entities/topics to weave into the page to strengthen topical authority (e.g. specific materials, techniques, local landmarks, related services).
5. contentGaps — 3-5 specific content additions that would make this page more likely to be cited by AI search.

Return JSON:
{
  "answerBlock": string,
  "peopleAlsoAsk": [ { "question": string, "answer": string } ],
  "schema": [ object ],
  "entities": [ string ],
  "contentGaps": [ string ]
}`,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          answerBlock: { type: "string" },
          peopleAlsoAsk: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
          schema: { type: "array" },
          entities: { type: "array", items: { type: "string" } },
          contentGaps: { type: "array", items: { type: "string" } },
        },
      },
    });

    return Response.json({ ok: true, ...(res || {}) });
  } catch (error) {
    console.error("optimizeAeo error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}