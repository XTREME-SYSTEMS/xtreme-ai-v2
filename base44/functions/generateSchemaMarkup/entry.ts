import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Schema Markup Generator — generates advanced structured data / JSON-LD
// for any page type. Ingested from: Schema.org, Merkle, Surfer SEO.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { page_type, business_name, url, industry, services, location, faqs, reviews, products } = await jsonBody(req);
    if (!page_type) return fail("page_type required", 400);

    const prompt = `You are a structured data / schema markup expert. Generate comprehensive JSON-LD schema markup for the following page.

Page Type: ${page_type}
Business: ${business_name || "N/A"}
URL: ${url || "N/A"}
Industry: ${industry || "local service"}
Services: ${JSON.stringify(services || [])}
Location: ${location || "N/A"}
FAQs: ${JSON.stringify(faqs || [])}
Reviews: ${JSON.stringify(reviews || [])}
Products: ${JSON.stringify(products || [])}

Generate ALL applicable schema types for this page:
- LocalBusiness / ProfessionalService / HomeAndConstructionBusiness
- Service (for each service)
- FAQPage
- Review / AggregateRating
- Product (if applicable)
- BreadcrumbList
- Organization
- WebSite
- WebPage
- ContactPoint
- OpeningHoursSpecification
- GeoCoordinates
- Offer / PriceSpecification

Return JSON with:
1. "schema_objects" — array of complete JSON-LD objects (each a valid schema.org object)
2. "script_tags" — array of <script type="application/ld+json"> tag strings ready to embed
3. "validation_notes" — any notes about schema validity
4. "rich_results" — which Google rich results this schema qualifies for`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        schema_objects: { type: "array", items: { type: "object", additionalProperties: true } },
        script_tags: { type: "array", items: { type: "string" } },
        validation_notes: { type: "array", items: { type: "string" } },
        rich_results: { type: "array", items: { type: "string" } }
      }
    });

    const result = { page_type, url, schema: response };
    await logReceipt(base44, "generateSchemaMarkup", "generate", "success", { page_type, url }, { objects: response?.schema_objects?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to generate schema markup");
  }
}