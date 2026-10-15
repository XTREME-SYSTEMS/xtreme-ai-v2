import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// SEO Launch Pad — AI fills the entire Google ranking kit for a market:
// Google Business Profile listing, Search Console property + verification meta,
// GA4 tag, sitemap.xml, robots.txt, local citation list, and an ordered launch
// checklist. Deterministic parts (sitemap, robots, GA snippet) are built in code;
// AI fills GBP + citations + checklist. Upserts into SeoLaunchKit. Admin-only.

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const { market_id } = body || {};
    if (!market_id) return Response.json({ error: "market_id required" }, { status: 400 });

    const market = await base44.asServiceRole.entities.Market.get(market_id);
    if (!market) return Response.json({ error: "Market not found" }, { status: 404 });

    const seoList = await base44.asServiceRole.entities.MarketSeo.filter({ market_id });
    const seo = seoList[0] || null;
    const domain = market.domain || `${market.slug || slugify(market.state + "-" + market.city)}.leadgennearyou.com`;
    const brand = market.public_business_name || market.brand_name || "Epoxy Garage Floor Estimate";
    const city = market.city, state = market.state;
    const phone = market.phone || "";

    // Deterministic technical assets
    const pages = ["", "/cost", "/location", "/how-it-works", "/faq", "/contact"];
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + pages.map(p => `  <url>\n    <loc>https://${domain}${p}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${p === "" ? "1.0" : "0.8"}</priority>\n  </url>`).join("\n") + `\n</urlset>`;
    const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml`;
    const gaId = "G-XXXXXXXXXX";
    const gaSnippet = `<!-- Google Analytics (GA4) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', '${gaId}');\n</script>`;
    const gscMeta = `<meta name="google-site-verification" content="PASTE_VERIFICATION_CODE_FROM_SEARCH_CONSOLE" />`;

    // AI fills GBP listing + citations + checklist
    const schema = {
      type: "object",
      properties: {
        gbp_name: { type: "string" },
        gbp_category: { type: "string" },
        gbp_description: { type: "string" },
        gbp_services: { type: "array", items: { type: "string" } },
        gbp_hours: { type: "string" },
        gbp_service_area: { type: "string" },
        citation_list: { type: "array", items: { type: "object", properties: { directory: { type: "string" }, url: { type: "string" }, status: { type: "string" } } } },
        launch_checklist: { type: "array", items: { type: "object", properties: { task: { type: "string" }, done: { type: "boolean" } } } },
      },
    };

    const prompt = `You are a local SEO launch specialist for garage floor coating / epoxy flooring lead-gen sites. Generate the complete Google ranking launch kit for this market.

Market: ${brand} — ${city}, ${state}.
Phone: ${phone}. Domain: ${domain}.
Service area: ${market.service_area_description || city + ", " + state}.

Produce:
- gbp_name: Google Business Profile business name (brand + city, natural, no keyword stuffing).
- gbp_category: the best primary GBP category (e.g. "Flooring contractor", "Concrete contractor").
- gbp_description: 250-750 char GBP description — keyword-rich, local, trust-building, with a CTA. Mention ${city}, ${state}, garage floor coating/epoxy, free estimates.
- gbp_services: 5-10 service names to list on GBP.
- gbp_hours: typical operating hours (e.g. "Mon-Sat 7am-7pm, Sun closed").
- gbp_service_area: cities/regions to list as service area on GBP.
- citation_list: 12-16 local directory citations to build (Google Business Profile, Bing Places, Yelp, Angi, HomeAdvisor, BBB, Facebook, Apple Maps, Yellow Pages, MapQuest, Manta, Houzz, Porch, Thumbtack, Nextdoor). Each: directory name, the URL to claim/create it, status "pending".
- launch_checklist: 14-20 ordered launch tasks (verify GSC property, submit sitemap, create GBP, add GA tag, build citations, generate content, internal linking, schema markup, etc.). Each: task string, done false.

Return JSON only.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt, add_context_from_internet: true, response_json_schema: schema, model: "gemini_3_flash",
    });

    const payload = {
      market_id,
      gbp_name: res.gbp_name,
      gbp_category: res.gbp_category,
      gbp_description: res.gbp_description,
      gbp_services: res.gbp_services || [],
      gbp_hours: res.gbp_hours,
      gbp_service_area: res.gbp_service_area,
      gsc_property_url: `https://${domain}/`,
      gsc_verification_meta: gscMeta,
      sitemap_url: `https://${domain}/sitemap.xml`,
      sitemap_xml: sitemapXml,
      robots_txt: robotsTxt,
      ga_measurement_id: gaId,
      ga_tag_snippet: gaSnippet,
      citation_list: res.citation_list || [],
      launch_checklist: res.launch_checklist || [],
      status: "ready",
      error: "",
    };

    const existing = await base44.asServiceRole.entities.SeoLaunchKit.filter({ market_id });
    let kit;
    if (existing.length > 0) kit = await base44.asServiceRole.entities.SeoLaunchKit.update(existing[0].id, payload);
    else kit = await base44.asServiceRole.entities.SeoLaunchKit.create(payload);

    return Response.json({ ok: true, market_id, kit_id: kit.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}