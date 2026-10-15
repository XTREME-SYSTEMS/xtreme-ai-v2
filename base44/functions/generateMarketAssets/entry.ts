import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// AI Site Factory — generates the full SEO + content kit for a market record.
// Takes market_id (+ optional job_type), loads the Market, calls InvokeLLM with web
// search to produce unique meta, FAQ, JSON-LD (LocalBusiness + FAQPage + Service),
// and cost/location/how-it-works content scoped to the market's city/state/brand,
// then upserts the result into MarketSeo and records a GenerationJob. Admin-only.

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { market_id, job_type } = body || {};
    if (!market_id) return Response.json({ error: "market_id required" }, { status: 400 });
    const jt = job_type || "seo";

    const market = await base44.asServiceRole.entities.Market.get(market_id);
    if (!market) return Response.json({ error: "Market not found" }, { status: 404 });

    const job = await base44.asServiceRole.entities.GenerationJob.create({
      market_id, job_type: jt, status: "running", started_at: new Date().toISOString(),
    });

    try {
      const brand = market.public_business_name || market.brand_name || "Epoxy Garage Floor Estimate";
      const city = market.city;
      const state = market.state;
      const phone = market.phone || "";
      const area = market.service_area_description || `${city}, ${state}`;
      const rating = market.google_rating || 4.9;
      const reviews = market.google_review_count || 0;
      const slug = market.slug || slugify(`${state}-${city}`);

      const schema = {
        type: "object",
        properties: {
          meta_title: { type: "string" },
          meta_description: { type: "string" },
          og_title: { type: "string" },
          og_description: { type: "string" },
          faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
          cost_page_content: { type: "string" },
          location_page_content: { type: "string" },
          how_it_works_content: { type: "string" },
          json_ld_localbusiness: { type: "object" },
          json_ld_faq: { type: "object" },
          json_ld_service: { type: "object" },
        },
      };

      const prompt = `You are an elite local SEO + AEO content architect for garage floor coating / epoxy flooring lead-gen sites. Generate the complete SEO + content kit for a new market.

Market: ${brand} — ${city}, ${state}.
Phone: ${phone}. Service area: ${area}. Google rating: ${rating}/5 (${reviews} reviews).
Slug: ${slug}.

Produce:
- meta_title: unique, keyword-fronted, includes "${city}, ${state}" and "garage floor coating cost/estimate", under 60 chars.
- meta_description: keyword-rich, click-optimized, includes city + state, under 155 chars.
- og_title / og_description: compelling social share copy.
- faq: 8-12 Q&A pairs (cost ranges, lifespan, install time, prep, flake vs metallic, warranty, garage size, curing). Answers 2-3 sentences, factual, cite-worthy, market-specific.
- cost_page_content: 4-6 paragraphs of original, specific cost/pricing transparency content for ${city}, ${state} (price per sq ft, 1/2/3-car garage ranges, what drives cost).
- location_page_content: 3-5 paragraphs about serving ${city} and ${area} (neighborhoods, climate considerations, local trust).
- how_it_works_content: 4-6 step process for getting an estimate + installation.
- json_ld_localbusiness: Schema.org LocalBusiness with name="${brand}", address (addressLocality="${city}", addressRegion="${state}"), telephone="${phone}", openingHours, aggregateRating (ratingValue=${rating}, reviewCount=${reviews}), areaServed.
- json_ld_faq: Schema.org FAQPage with the same faq entries.
- json_ld_service: Schema.org Service (name, serviceType "Garage Floor Coating", areaServed, provider, offers priceRange "$$").

Write for humans first, search second. Return JSON only.`;

      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt, add_context_from_internet: true, response_json_schema: schema, model: "gemini_3_flash",
      });

      const jsonLd = {
        localbusiness: res.json_ld_localbusiness,
        faq: res.json_ld_faq,
        service: res.json_ld_service,
      };

      const existing = await base44.asServiceRole.entities.MarketSeo.filter({ market_id });
      const payload = {
        market_id,
        meta_title: res.meta_title,
        meta_description: res.meta_description,
        canonical_url: `https://${market.domain || (slug + ".leadgennearyou.com")}/`,
        og_title: res.og_title,
        og_description: res.og_description,
        json_ld: jsonLd,
        faq: res.faq || [],
        cost_page_content: res.cost_page_content,
        location_page_content: res.location_page_content,
        how_it_works_content: res.how_it_works_content,
        status: "ready",
        error: "",
      };
      let seo;
      if (existing.length > 0) {
        seo = await base44.asServiceRole.entities.MarketSeo.update(existing[0].id, payload);
      } else {
        seo = await base44.asServiceRole.entities.MarketSeo.create(payload);
      }

      await base44.asServiceRole.entities.GenerationJob.update(job.id, {
        status: "done", finished_at: new Date().toISOString(),
        result_summary: `Generated ${(res.faq || []).length} FAQs + JSON-LD + content`,
      });

      return Response.json({ ok: true, market_id, seo_id: seo.id, faq_count: (res.faq || []).length });
    } catch (innerError) {
      await base44.asServiceRole.entities.GenerationJob.update(job.id, {
        status: "failed", finished_at: new Date().toISOString(), error: String(innerError.message || innerError),
      });
      return Response.json({ error: String(innerError.message || innerError) }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}