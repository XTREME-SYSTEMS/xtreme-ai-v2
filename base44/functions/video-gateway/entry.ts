import OpenAI from "npm:openai@6.45.0";

// video-gateway — AI video generation via the Base44 AI Gateway.
// Supports multi-image input, 15-30 second clips, and async polling.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = (await import("npm:@base44/sdk@0.8.52")).createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Sign in to generate videos." }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection();
    const videos = new OpenAI({ baseURL, apiKey: token, defaultHeaders: headers }).videos;

    if (action === "estimate") {
      const estimate = await videos.create({ ...body.request, dry_run: true });
      return Response.json({ estimated_credits: estimate.usage?.base44_credits || 0 });
    }

    if (action === "create") {
      const { request, job_id } = body;
      if (!request?.prompt || !request.prompt.trim()) {
        return Response.json({ error: "A text prompt is required." }, { status: 400 });
      }
      const video = await videos.create(request, { maxRetries: 0 });
      if (job_id) {
        await base44.entities.VideoJob.update(job_id, {
          gateway_video_id: video.id,
          status: video.status || "queued",
        });
      }
      return Response.json({ video_id: video.id, status: video.status || "queued" }, { status: 202 });
    }

    if (action === "retrieve") {
      const { videoId, job_id } = body;
      if (!videoId) return Response.json({ error: "videoId required" }, { status: 400 });
      const video = await videos.retrieve(videoId);
      if (job_id) {
        const update: any = { status: video.status || "in_progress" };
        if (video.status === "complete" && video.url) update.video_url = video.url;
        if (video.status === "failed") update.error = video.error?.message || "Generation failed";
        await base44.entities.VideoJob.update(job_id, update);
      }
      return Response.json(video);
    }

    return Response.json({ error: "Invalid action. Use estimate, create, or retrieve." }, { status: 400 });
  } catch (error) {
    console.error("video-gateway error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}