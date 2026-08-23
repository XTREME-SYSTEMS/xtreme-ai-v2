import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateWebsite } from "../../shared/autoBuildGenerators.ts";

// Generates rich, location-aware website copy for a client's site using
// real web context about their area. Uses the shared generator (same logic
// as the Auto Builder) — one source of truth.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const content = await generateWebsite(base44, body);
    return Response.json({ ok: true, content });
  } catch (error) {
    console.error("generateWebsiteContent error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}