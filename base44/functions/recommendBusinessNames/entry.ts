// AI-powered business name + domain recommender. Uses the shared generator
// (same logic as the Auto Builder) — one source of truth.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { generateNames } from "../../shared/autoBuildGenerators.ts";

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);

  let body: any = {};
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { industry, location, keywords, businessType, businessName } = body;
  if (!industry) {
    return Response.json({ error: "Industry is required" }, { status: 400 });
  }

  try {
    const suggestions = await generateNames(base44, { industry, location, keywords, businessType, businessName });
    return Response.json({ ok: true, suggestions });
  } catch (e) {
    console.error("recommendBusinessNames error:", e?.message || e);
    return Response.json({ error: e?.message || "Failed to generate suggestions" }, { status: 500 });
  }
}