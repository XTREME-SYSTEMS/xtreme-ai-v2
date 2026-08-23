import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateVideo } from "../../shared/autoBuildGenerators.ts";

// Video Generator: generates 10 video concept cards — each with a thumbnail
// image, a title, a short description, and a production script. Uses the
// shared generator (same logic as the Auto Builder) — one source of truth.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const concepts = await generateVideo(base44, body);
    return Response.json({ ok: true, data: { concepts } });
  } catch (error) {
    console.error("generateVideoPack error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}