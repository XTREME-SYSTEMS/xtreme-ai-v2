import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// AI-powered domain acquisition intelligence system.
// Scans Google SERPs, analyzes competition weakness, predicts dollar ROI for each domain.
// This is the "no one else does this" engine: full SERP X-Ray + revenue prediction.

const HIGH_VALUE_NICHES = [
  { service: "roofing", lead_value: 500, cpc: 35 },
  { service: "hvac", lead_value: 300, cpc: 25 },
  { service: "plumbing", lead_value: 200, cpc: 20 },
  { service: "epoxy flooring", lead_value: 400, cpc: 15 },
  { service: "water damage restoration", lead_value: 800, cpc: 40 },
  { service: "mold remediation", lead_value: 600, cpc: 30 },
  { service: "solar installation", lead_value: 700, cpc: 35 },
  { service: "pest control", lead_value: 150, cpc: 15 },
  { service: "tree removal", lead_value: 300, cpc: 12 },
  { service: "fencing", lead_value: 250, cpc: 10 },
  { service: "concrete", lead_value: 300, cpc: 12 },
  { service: "electrician", lead_value: 200, cpc: 18 },
  { service: "garage door repair", lead_value: 200, cpc: 15 },
  { service: "foundation repair", lead_value: 1000, cpc: 45 },
  { service: "junk removal", lead_value: 150, cpc: 10 },
  { service: "moving company", lead_value: 300, cpc: 20 },
  { service: "cleaning services", lead_value: 100, cpc: 8 },
  { service: "landscaping", lead_value: 150, cpc: 8 },
  { service: "chiropractor", lead_value: 300, cpc: 15 },
  { service: "dentist", lead_value: 400, cpc: 20 },
  { service: "med spa", lead_value: 500, cpc: 25 },
  { service: "personal injury lawyer", lead_value: 2000, cpc: 80 },
  { service: "dui lawyer", lead_value: 1500, cpc: 60 },
  { service: "divorce lawyer", lead_value: 1000, cpc: 50 },
  { service: "bankruptcy lawyer", lead_value: 800, cpc: 40 },
];

function generateDomains(service) {
  const slug = service.replace(/\s+/g, '');
  return [
    { domain: `${slug}nearme.com`, type: 'nearme' },
    { domain: `${slug}nearyou.com`, type: 'nearyou' },
    { domain: `${slug}nearme.org`, type: 'nearme' },
    { domain: `${slug}nearyou.org`, type: 'nearyou' },
    { domain: `emergency${slug}nearme.com`, type: 'nearme' },
    { domain: `${slug}contractorsnearme.com`, type: 'nearme' },
    { domain: `${slug}servicesnearme.com`, type: 'nearme' },
    { domain: `${slug}prosnearyou.com`, type: 'nearyou' },
  ];
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const requestedNiches = body.niches;
    const niches = requestedNiches && requestedNiches.length > 0
      ? HIGH_VALUE_NICHES.filter(n => requestedNiches.includes(n.service))
      : HIGH_VALUE_NICHES.slice(0, 10); // Default: first 10 to avoid timeout

    const results = [];

    for (const niche of niches) {
      const domains = generateDomains(niche.service);

      const prompt = `You are a domain acquisition expert analyzing whether to buy domains for local SEO domination.

Search phrase: "${niche.service} near me"
Lead value: $${niche.lead_value} per lead
CPC: $${niche.cpc}

Domain candidates: ${domains.map(d => d.domain).join(', ')}

Search Google for "${niche.service} near me" and analyze the actual SERP results. For each domain candidate, assess:

1. Monthly search volume for "${niche.service} near me" (estimate based on what you find)
2. SERP weakness: Are the top 10 results beatable? (weak = directories, thin content, Yelp pages with under 500 words; strong = major brands, high DA, comprehensive content)
3. Rankability score 0-100 for each domain (how easy to rank #1 with this exact-match domain)
4. Estimated monthly leads if ranked #1 (search_volume × 0.30 CTR for #1 position × 0.05 conversion rate)
5. ROI score 0-100 (combination of search volume, lead value, rankability, and SERP weakness)
6. Top 3 competitors currently ranking
7. Content gap: what are the top results missing?

Return JSON with this exact structure:
{
  "search_volume": number,
  "serp_weakness_score": number (0-100, higher = weaker competition),
  "top_competitors": ["domain1", "domain2", "domain3"],
  "content_gap": "string describing what top results are missing",
  "domains": [
    {
      "domain": "the domain",
      "rankability_score": number (0-100),
      "estimated_monthly_leads": number,
      "roi_score": number (0-100),
      "reasoning": "1-2 sentences explaining the score"
    }
  ]
}`;

      try {
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: "object",
            properties: {
              search_volume: { type: "number" },
              serp_weakness_score: { type: "number" },
              top_competitors: { type: "array", items: { type: "string" } },
              content_gap: { type: "string" },
              domains: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    domain: { type: "string" },
                    rankability_score: { type: "number" },
                    estimated_monthly_leads: { type: "number" },
                    roi_score: { type: "number" },
                    reasoning: { type: "string" }
                  }
                }
              }
            }
          }
        });

        for (const d of analysis.domains) {
          const estimatedRevenue = Math.round((d.estimated_monthly_leads || 0) * niche.lead_value);
          const priority = d.roi_score >= 75 ? 'buy_now' : d.roi_score >= 55 ? 'strong_buy' : d.roi_score >= 35 ? 'consider' : 'pass';
          const domainType = d.domain.includes('nearyou') ? 'nearyou' : 'nearme';

          const record = {
            niche: niche.service,
            search_phrase: `${niche.service} near me`,
            monthly_search_volume: analysis.search_volume,
            cpc: niche.cpc,
            lead_value: niche.lead_value,
            serp_weakness_score: analysis.serp_weakness_score,
            rankability_score: d.rankability_score,
            roi_score: d.roi_score,
            estimated_monthly_leads: d.estimated_monthly_leads,
            estimated_monthly_revenue: estimatedRevenue,
            competition_analysis: d.reasoning,
            top_competitors: analysis.top_competitors,
            content_gap: analysis.content_gap,
            domain_type: domainType,
            acquisition_priority: priority,
            buy_url: `https://www.namecheap.com/domains/registration/results/?domain=${d.domain}`,
            checked_at: new Date().toISOString(),
            score: d.roi_score,
          };

          // Check if already exists
          const existing = await svc.entities.DomainCandidate.filter({ domain: d.domain }, null, 1);
          if (existing && existing.length > 0) {
            await svc.entities.DomainCandidate.update(existing[0].id, record);
          } else {
            await base44.entities.DomainCandidate.create({
              domain: d.domain,
              ...record,
            });
          }
        }

        results.push({
          niche: niche.service,
          search_volume: analysis.search_volume,
          serp_weakness: analysis.serp_weakness_score,
          domains_analyzed: analysis.domains.length,
          top_domain: analysis.domains.sort((a, b) => b.roi_score - a.roi_score)[0]?.domain,
        });
      } catch (e) {
        results.push({ niche: niche.service, error: e.message });
      }
    }

    return Response.json({
      ok: true,
      niches_processed: niches.length,
      results,
    });
  } catch (error) {
    console.error('discoverHighValueDomains error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}