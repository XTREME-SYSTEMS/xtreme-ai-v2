import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateSocial } from "../../shared/autoBuildGenerators.ts";

// Social Media Generator: generates 10 social media brand template images
// PLUS a 30-day content calendar. Uses the shared generator (same logic as
// the Auto Builder) — one source of truth.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const data = await generateSocial(base44, body);
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error("generateSocialMediaPack error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}