// AI-powered 3D walkthrough generator. Takes uploaded images of a space,
// uses InvokeLLM with vision to analyze each image, and creates a
// walkthrough plan with labeled viewpoints in the optimal viewing order.
// Creates a WalkthroughProject entity with a share token for public viewing.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);

  let body: any = {};
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { title, description, images, clientEmail, projectId } = body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return Response.json({ error: "At least one image is required" }, { status: 400 });
  }

  try {
    // Use AI with vision to analyze the uploaded images and create a walkthrough plan
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a professional 3D walkthrough designer. Analyze these ${images.length} uploaded images of a space and create an immersive walkthrough plan.

For each image:
1. Identify what space/room it shows (e.g., "Living Room", "Kitchen", "Master Bedroom", "Exterior Front", "Backyard")
2. Give it a short, descriptive label
3. Write a 1-2 sentence description of what the viewer should focus on
4. Note any key features or selling points visible

Order the viewpoints in the natural flow a visitor would walk through the space (e.g., exterior → entry → living areas → bedrooms → outdoor).

Return JSON with:
{
  "title": "suggested title for the walkthrough (e.g., 'Modern Home Virtual Tour')",
  "description": "2-3 sentence description of the overall space",
  "viewpoints": [
    {
      "imageIndex": 0,
      "label": "Front Exterior",
      "description": "Curb appeal with landscaped front yard and modern facade",
      "focusPoints": "Modern architecture, landscaped entryway"
    }
  ]
}`,
      file_urls: images,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          viewpoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                imageIndex: { type: "number" },
                label: { type: "string" },
                description: { type: "string" },
                focusPoints: { type: "string" },
              },
            },
          },
        },
      },
    });

    // Build viewpoints with image URLs
    const viewpoints = (result?.viewpoints || []).map((v: any, i: number) => ({
      imageIndex: v.imageIndex ?? i,
      imageUrl: images[v.imageIndex] || images[i],
      label: v.label || `Viewpoint ${i + 1}`,
      description: v.description || "",
      focusPoints: v.focusPoints || "",
    }));

    // If AI didn't return viewpoints for all images, fill in the rest
    for (let i = viewpoints.length; i < images.length; i++) {
      viewpoints.push({
        imageIndex: i,
        imageUrl: images[i],
        label: `Viewpoint ${i + 1}`,
        description: "",
        focusPoints: "",
      });
    }

    const shareToken = crypto.randomUUID();
    const finalTitle = title || result?.title || "3D Walkthrough";
    const finalDescription = description || result?.description || "";

    let project;
    if (projectId) {
      // Update existing project
      await base44.entities.WalkthroughProject.update(projectId, {
        title: finalTitle,
        description: finalDescription,
        images,
        viewpoints,
        status: "ready",
        ai_analysis: result?.description || "",
        share_token: shareToken,
      });
      project = { id: projectId, share_token: shareToken };
    } else {
      // Create new project
      project = await base44.entities.WalkthroughProject.create({
        title: finalTitle,
        client_email: clientEmail || "",
        description: finalDescription,
        images,
        viewpoints,
        status: "ready",
        ai_analysis: result?.description || "",
        share_token: shareToken,
      });
    }

    return Response.json({
      ok: true,
      projectId: project.id,
      shareToken,
      title: finalTitle,
      description: finalDescription,
      viewpoints,
    });
  } catch (e) {
    console.error("generateWalkthrough error:", e?.message || e);
    return Response.json({ error: e?.message || "Failed to generate walkthrough" }, { status: 500 });
  }
}