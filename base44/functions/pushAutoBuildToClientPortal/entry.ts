// Push AutoBuild results to a ClientProject — copies all generated assets
// from an AutoBuild record into the client portal's ClientProject entity.
// Admin-only, on-demand (the admin chooses when to push).
//
// If a ClientProject already exists for the client_email, it's updated
// (merged). If not, a new one is created. Only fields that have been
// generated (non-empty) are pushed — so partial builds only push what's
// ready.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    // Admin-only
    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildId = String(body.build_id || "");
    const clientEmail = String(body.client_email || "").trim().toLowerCase();

    if (!buildId || !clientEmail) {
      return new Response(JSON.stringify({ error: "build_id and client_email are required" }), { status: 400 });
    }

    // Load the build
    const builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
    const build = builds?.[0];
    if (!build) {
      return new Response(JSON.stringify({ error: "Build not found" }), { status: 404 });
    }

    // Find existing ClientProject for this email
    const existing = await base44.asServiceRole.entities.ClientProject.filter(
      { client_email: clientEmail },
      "-updated_date",
      1
    );
    const existingProject = existing?.[0];

    // Build the update payload — only push non-empty generated fields
    const updateData: Record<string, any> = {
      client_email: clientEmail,
      business_name: build.business_name || existingProject?.business_name || "",
      industry: build.industry || existingProject?.industry || "",
      sub_industry: build.sub_industry || existingProject?.sub_industry || "",
    };

    // Profile — merge build profile into existing
    if (build.profile) {
      updateData.profile = {
        ...(existingProject?.profile || {}),
        ...build.profile,
        logo_url: build.chosen_logo_url || existingProject?.profile?.logo_url || "",
      };
    }

    // Generated assets — only push if they exist and are non-empty
    if (build.name_options && build.name_options.length > 0) {
      // Store name ideas in profile for reference
      updateData.profile = {
        ...(updateData.profile || existingProject?.profile || {}),
        name_options: build.name_options,
      };
    }
    if (build.content_templates && (Array.isArray(build.content_templates) ? build.content_templates.length > 0 : build.content_templates.templates?.length > 0)) {
      updateData.content_templates = build.content_templates;
      updateData.content_templates_chosen = true;
    }
    if (build.chosen_content_template) updateData.chosen_content_template = build.chosen_content_template;
    if (build.logo_options && build.logo_options.length > 0) updateData.logo_options = build.logo_options;
    if (build.chosen_logo_url) {
      updateData.chosen_logo_url = build.chosen_logo_url;
      updateData.profile = { ...(updateData.profile || {}), logo_url: build.chosen_logo_url };
    }
    if (build.brand_packs && build.brand_packs.length > 0) {
      updateData.brand_packs = build.brand_packs;
      updateData.design_packs_chosen = true;
    }
    if (build.chosen_brand_images && build.chosen_brand_images.length > 0) {
      updateData.chosen_brand_images = build.chosen_brand_images;
    }
    if (build.website_content) {
      updateData.website_content = build.website_content;
    }
    if (build.website_images && build.website_images.length > 0) {
      updateData.website_images = build.website_images;
    }
    if (build.chosen_website_layout) updateData.chosen_website_layout = build.chosen_website_layout;
    if (build.chosen_palette) updateData.chosen_palette = build.chosen_palette;
    if (build.social_media_pack) {
      updateData.social_media_pack = build.social_media_pack;
      updateData.social_media_chosen = true;
    }
    if (build.video_pack) {
      updateData.video_pack = build.video_pack;
      updateData.video_chosen = true;
    }

    // Merge visited steps
    const mergedVisited = [...new Set([
      ...(existingProject?.visited_steps || []),
      ...(build.visited_steps || []),
    ])];
    updateData.visited_steps = mergedVisited;

    // Set status to review if not already launched
    if (!existingProject || existingProject.status === "draft") {
      updateData.status = "review";
    }

    let project;
    if (existingProject) {
      project = await base44.asServiceRole.entities.ClientProject.update(existingProject.id, updateData);
    } else {
      project = await base44.asServiceRole.entities.ClientProject.create(updateData);
    }

    // Log the push
    const logs = [...(build.logs || []), `[${new Date().toISOString()}] Pushed to client portal: ${clientEmail}`].slice(-100);
    await base44.asServiceRole.entities.AutoBuild.update(buildId, { logs });

    return new Response(JSON.stringify({
      success: true,
      project,
      action: existingProject ? "updated" : "created",
      client_email: clientEmail,
    }), { status: 200 });
  } catch (e) {
    console.error("pushAutoBuildToClientPortal error:", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});