import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { SERVICE_CATALOG_DATA } from "../../shared/serviceCatalogData.ts";

// Seeds the ServiceCatalogEntry entity with all products, their features,
// and rich line-item details (description, what-you-get, how-it-works,
// SEO value, AEO value) generated via LLM.
//
// Admin-only: requires base44.auth.me() with role === 'admin'.
// Idempotent: updates existing entries by product_id.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const results = { processed: 0, created: 0, updated: 0, errors: [] };

    // Process each product
    for (const product of SERVICE_CATALOG_DATA) {
      try {
        // Generate rich line-item details via LLM — one call per product
        const featuresWithDetails = await generateFeatureDetails(base44, product);

        // Check if entry already exists
        const existing = await base44.asServiceRole.entities.ServiceCatalogEntry.filter(
          { product_id: product.product_id },
          "-updated_date",
          1
        );

        const record = {
          product_id: product.product_id,
          name: product.name,
          category: product.category,
          tagline: product.tagline,
          description: product.description,
          price: product.price,
          price_label: product.price_label,
          delivery_time: product.delivery_time,
          features: featuresWithDetails,
          deliverables: product.deliverables,
          seo_metadata: product.seo_metadata,
          aeo_metadata: product.aeo_metadata,
          organizational_metadata: product.organizational_metadata,
          statistics: product.statistics,
          active: true,
        };

        if (existing && existing.length > 0) {
          await base44.asServiceRole.entities.ServiceCatalogEntry.update(existing[0].id, record);
          results.updated++;
        } else {
          await base44.asServiceRole.entities.ServiceCatalogEntry.create(record);
          results.created++;
        }
        results.processed++;
      } catch (e) {
        results.errors.push({ product_id: product.product_id, error: e.message });
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Generate rich line-item details for a product's features using LLM.
// Sends all features in one call and gets back structured details for each.
async function generateFeatureDetails(base44, product) {
  const featuresList = product.features.map((f, i) => `${i + 1}. ${f}`).join("\n");

  const prompt = `You are a product catalog expert. For each line item below, generate a rich, detailed description.

  Product: ${product.name}
  Category: ${product.category}
  Description: ${product.description}

  Line items (in order):
  ${featuresList}

  For EACH line item IN ORDER, provide:
  1. "description" — a full 2-3 sentence explanation of what this item is and what the client gets
  2. "what_you_get" — an array of 3-6 bullet points listing specific deliverables
  3. "how_it_works" — 1-2 sentences explaining the process
  4. "seo_value" — 1 sentence explaining the SEO value (or "N/A — [item type] item" if not SEO-related)
  5. "aeo_value" — 1 sentence explaining the AEO (AI Search Engine Optimization) value (or "N/A — [item type] item" if not AEO-related)
  6. "category" — one of: onboarding, branding, website, seo, aeo, content, social, video, app, reporting, free

  Return a JSON object with an "items" array — one entry per line item, IN THE SAME ORDER as listed above. Each entry is an object with the 6 fields.`;

  try {
  const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              what_you_get: { type: "array", items: { type: "string" } },
              how_it_works: { type: "string" },
              seo_value: { type: "string" },
              aeo_value: { type: "string" },
              category: { type: "string" }
            }
          }
        }
      }
    }
  });

  // Build the features array with details — match by index (order preserved)
  const items = (response && response.items) || [];
  return product.features.map((text, i) => {
    const detail = items[i] || {};
    return {
      text,
      detail: detail.description || "",
      what_you_get: detail.what_you_get || [],
      how_it_works: detail.how_it_works || "",
      seo_value: detail.seo_value || "",
      aeo_value: detail.aeo_value || "",
      category: detail.category || "",
    };
  });
  } catch (e) {
    // If LLM fails, store features with text only — frontend will use local matching
    return product.features.map((text) => ({
      text,
      detail: "",
      what_you_get: [],
      how_it_works: "",
      seo_value: "",
      aeo_value: "",
      category: "",
    }));
  }
}