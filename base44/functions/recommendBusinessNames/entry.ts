// AI-powered business name + domain recommender. Fast optimized pipeline:
// AI generates 15 candidates (Gemini Flash), RDAP verifies all .com domains
// in parallel, OpenCorporates checks US state registries, deterministic
// scoring (no second LLM call). Only returns 100% available .com domains.
// Accepts `seed` (int) and `exclude` (string[]) for fast regeneration.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { generateNamesWithResearch } from "../../shared/autoBuildGenerators.ts";

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);

  let body: any = {};
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { industry, location, keywords, businessType, businessName, seed, exclude } = body;
  if (!industry) {
    return Response.json({ error: "Industry is required" }, { status: 400 });
  }

  try {
    const result = await generateNamesWithResearch(base44, { industry, location, keywords, businessType, businessName, seed, exclude });
    return Response.json({ ok: true, suggestions: result.suggestions, logs: result.logs, phases: result.phases });
  } catch (e) {
    console.error("recommendBusinessNames error:", e?.message || e);
    return Response.json({ error: e?.message || "Failed to generate suggestions" }, { status: 500 });
  }
}