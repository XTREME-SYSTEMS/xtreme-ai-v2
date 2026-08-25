// AI-assisted field completion. Takes a field name, the partial text the
// user typed, and a context object with everything they've chosen in prior
// steps (industry, location, business name, vision, strategy, profile,
// prior answers). Returns 5 best-choice suggestions tailored to that
// context. Used by the AiAssistInput component on every fill-in box in the
// Business Generator pipeline.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const field = String(body.field || "").trim();
    const partialText = String(body.partialText || "").trim();
    const context = body.context || {};

    if (!field) return Response.json({ error: "field is required" }, { status: 400 });

    // Build a compact context summary of everything chosen so far.
    const ctxLines: string[] = [];
    if (context.industry) ctxLines.push(`Industry: ${context.industry}`);
    if (context.subIndustry) ctxLines.push(`Sub-industry: ${context.subIndustry}`);
    if (context.businessName) ctxLines.push(`Business name: ${context.businessName}`);
    if (context.location) ctxLines.push(`Location: ${context.location}`);
    if (context.businessStage) ctxLines.push(`Business stage: ${context.businessStage}`);
    if (context.businessType) ctxLines.push(`Business type: ${Array.isArray(context.businessType) ? context.businessType.join(", ") : context.businessType}`);
    if (context.tagline) ctxLines.push(`Tagline: ${context.tagline}`);
    if (context.vision) ctxLines.push(`Vision: ${context.vision}`);
    if (context.strategy) ctxLines.push(`Strategy: ${context.strategy}`);
    if (context.priorAnswers) {
      const pa = context.priorAnswers;
      if (typeof pa === "object" && !Array.isArray(pa)) {
        for (const [k, v] of Object.entries(pa)) {
          if (v && String(v).trim()) ctxLines.push(`${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
        }
      }
    }
    if (context.question) ctxLines.push(`Question being answered: ${context.question}`);
    const contextSummary = ctxLines.join("\n");

    const fieldGuidance: Record<string, string> = {
      businessName: "creative, brandable epoxy/concrete business names (2-4 words, include epoxy/concrete/floors/coatings where natural)",
      industry: "epoxy/concrete industry niches (e.g. epoxy flooring, polished concrete, decorative concrete, epoxy coatings)",
      subIndustry: "specific epoxy/concrete sub-industries or specializations",
      customSubIndustry: "specific epoxy/concrete sub-industries or specializations",
      location: "city, state format for the business's primary service area",
      primaryLocation: "city, state format for the business's primary service area",
      address: "realistic street addresses for the business area",
      zip: "valid 5-digit ZIP codes for the business area",
      phone: "realistic US phone numbers in (XXX) XXX-XXXX format",
      email: "professional email addresses for the business (info@, contact@, etc.)",
      website: "realistic website URLs for the business (lowercase, no spaces)",
      tagline: "short, punchy marketing taglines (3-8 words) for an epoxy/concrete business",
      keywords: "relevant keyword themes for an epoxy/concrete business (e.g. metallic, garage, commercial, fast install)",
      vision: "one-sentence vision statements for an epoxy/concrete business",
      answer: "a concise, specific answer to the industry question asked",
    };

    const guidance = fieldGuidance[field] || "relevant suggestions for this field";

    const prompt = `You are an expert business strategist for the epoxy flooring and concrete contracting industry.
The user is filling out a form field: "${field}".
They typed so far: "${partialText || "(nothing yet)"}".

Everything they've chosen in prior steps:
${contextSummary || "(no prior context — this is the first step)"}

Generate 5 of the BEST suggestions for this field. Each suggestion should be:
- ${guidance}
- Tailored to the prior context above (industry, location, business name, vision, strategy, etc.)
- Distinct from each other (different angles, not variations of the same idea)
- Realistic and professional

Return as a JSON object with a "suggestions" array of strings. Each string is one complete suggestion ready to drop into the field.`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    });

    const suggestions = (llmRes as any)?.suggestions || [];
    return Response.json({ field, suggestions });
  } catch (error) {
    console.error("aiAssistField error:", error);
    return Response.json({ error: (error as any)?.message || "AI assist failed" }, { status: 500 });
  }
}