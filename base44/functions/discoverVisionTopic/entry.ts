// Discovery engine for the Vision Generator. Takes a user's one-sentence
// vision or a chosen category name, runs a full web discovery using
// InvokeLLM with web search, and returns 6-8 specific angles/approaches/
// sub-topics as multiple-choice options. The user picks one, which then
// triggers strategy generation.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const topic = String(body.topic || "").trim();

    if (!topic) {
      return Response.json({ error: "topic is required" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `A user wants to build something in this space: "${topic}". Do a full web discovery to find the top 7 specific angles, approaches, or sub-topics within this space that would make the best digital product (website, app, SaaS, or platform). For each option provide: name (short, 3-6 words), description (2-3 sentences explaining what it is and how it works), why_it_matters (1-2 sentences on why this is a compelling opportunity right now in ${year}), market_potential (one of: "Low", "Medium", "High", "Very High"), and value_proposition (1 sentence — the core promise to the end user). Rank them by: profitability potential, viral/shareability potential, marketability (ease of customer acquisition), and how buildable they are with AI and automation. Return as JSON.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                why_it_matters: { type: "string" },
                market_potential: { type: "string" },
                value_proposition: { type: "string" },
              },
            },
          },
        },
      },
    });

    const options = (llmRes as any)?.options || [];

    return Response.json({ topic, options });
  } catch (error) {
    console.error("discoverVisionTopic error:", error);
    return Response.json({ error: (error as any)?.message || "Discovery failed" }, { status: 500 });
  }
}