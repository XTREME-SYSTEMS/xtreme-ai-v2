import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateContent } from "../../shared/autoBuildGenerators.ts";

// Content Generator: generates 10 distinct content/tone templates for the
// client's website messaging. Uses the shared generator (same logic as the
// Auto Builder) — one source of truth.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const result = await generateContent(base44, body);
    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error("generateContentTemplates error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}