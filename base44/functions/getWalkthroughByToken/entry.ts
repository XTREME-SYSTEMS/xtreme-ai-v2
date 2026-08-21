// Public walkthrough fetcher. Returns a published walkthrough by its share
// token, bypassing RLS via asServiceRole so unauthenticated clients can view.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);

  let body: any = {};
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { shareToken } = body;
  if (!shareToken) {
    return Response.json({ error: "Share token required" }, { status: 400 });
  }

  try {
    const projects = await base44.asServiceRole.entities.WalkthroughProject.filter({
      share_token: shareToken,
    });
    const project = projects?.[0];

    if (!project) {
      return Response.json({ error: "Walkthrough not found" }, { status: 404 });
    }

    if (!project.published) {
      return Response.json({ error: "This walkthrough is not yet published" }, { status: 403 });
    }

    return Response.json({
      ok: true,
      title: project.title,
      description: project.description,
      viewpoints: project.viewpoints || [],
      images: project.images || [],
    });
  } catch (e) {
    console.error("getWalkthroughByToken error:", e?.message || e);
    return Response.json({ error: "Failed to load walkthrough" }, { status: 500 });
  }
}