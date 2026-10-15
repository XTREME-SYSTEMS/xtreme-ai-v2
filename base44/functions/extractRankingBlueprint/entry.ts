import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Analyzes a competitor site and extracts a detailed ranking blueprint.
// Identifies exactly what makes the site rank: content structure, schema, topics,
// trust signals, and gaps we can exploit to beat them.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const blueprintId = req.body?.blueprint_id;
    const url = req.body?.url;

    let blueprint;
    if (blueprintId) {
      blueprint = await svc.entities.SerpBlueprint.get(blueprintId);
    } else if (url) {
      const existing = await svc.entities.SerpBlueprint.filter({ competitor_url: url }, '-created_date', 1);
      blueprint = existing?.[0];
    }

    if (!blueprint) {
      return Response.json({ error: 'Blueprint not found. Provide blueprint_id or url.' }, { status: 400 });
    }

    const competitorUrl = blueprint.competitor_url;
    const keyword = blueprint.keyword;
    const niche = blueprint.niche || '';

    // Use InvokeLLM with web search to deeply analyze the competitor site
    const prompt = `Analyze the website at ${competitorUrl} which ranks #${blueprint.serp_position} on Google for "${keyword}".

Visit the page and extract a detailed SEO ranking blueprint:

1. CONTENT STRUCTURE:
   - Estimated word count
   - How is the content organized? (sections, heading hierarchy)
   - What topics does it cover?
   - What entities/people/places/brands are mentioned?
   - Is there an FAQ section?
   - Is there video content?
   - Are there tables or data visualizations?
   - How fresh/current does the content appear?

2. META DATA:
   - Meta title
   - Meta description
   - URL structure

3. TECHNICAL:
   - What schema markup types are likely used? (Organization, LocalBusiness, FAQ, Article, Breadcrumb, etc.)
   - Approximate number of internal links
   - Approximate number of external/outbound links
   - Number of images

4. TRUST SIGNALS:
   - What trust signals are present? (reviews, testimonials, certifications, guarantees, awards, years in business, etc.)

5. COMPETITIVE ANALYSIS:
   - What are this site's KEY STRENGTHS that help it rank?
   - What CONTENT GAPS does it have? (what topics/keywords are they missing that we could target?)
   - What would it take to BEAT this site in rankings? Be specific and actionable.

Return a comprehensive JSON blueprint.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          word_count: { type: "number" },
          content_structure: { type: "string" },
          schema_types: { type: "array", items: { type: "string" } },
          meta_title: { type: "string" },
          meta_description: { type: "string" },
          heading_structure: { type: "string" },
          internal_links: { type: "number" },
          external_links: { type: "number" },
          images_count: { type: "number" },
          topics_covered: { type: "array", items: { type: "string" } },
          entities_mentioned: { type: "array", items: { type: "string" } },
          faq_present: { type: "boolean" },
          video_present: { type: "boolean" },
          table_present: { type: "boolean" },
          content_freshness: { type: "string" },
          trust_signals: { type: "array", items: { type: "string" } },
          key_strengths: { type: "array", items: { type: "string" } },
          content_gaps: { type: "array", items: { type: "string" } },
          recommendations: { type: "string" }
        }
      }
    });

    // Update the blueprint with the extracted data
    const updated = await svc.entities.SerpBlueprint.update(blueprint.id, {
      blueprint: result,
      status: 'analyzed',
    });

    return Response.json({
      ok: true,
      blueprint_id: blueprint.id,
      competitor: blueprint.competitor_domain,
      keyword: blueprint.keyword,
      blueprint: result,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}