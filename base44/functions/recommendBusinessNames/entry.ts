// AI-powered business name + domain recommender. Uses InvokeLLM with web
// search (gemini_3_flash) to generate names, check Google for existing
// businesses, check state registries, and score viral potential. Then
// verifies .com availability in real-time via RDAP.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// RDAP domain check — inlined from checkDomainAvailability (can't invoke
// another function from within a function reliably).
function getRdapUrl(domain: string): string {
  const tld = domain.split(".").pop();
  if (tld === "com") return `https://rdap.verisign.com/com/v1/domain/${domain}`;
  if (tld === "org") return `https://rdap.publicinterestregistry.org/rdap/domain/${domain}`;
  if (tld === "net") return `https://rdap.verisign.net/net/v1/domain/${domain}`;
  return `https://rdap.org/domain/${domain}`;
}

async function checkDomain(domain: string) {
  try {
    const response = await fetch(getRdapUrl(domain), {
      method: "GET",
      headers: { Accept: "application/rdap+json" },
      redirect: "follow",
    });
    if (response.status === 404) return { domain, available: true, status: "AVAILABLE" };
    if (response.status >= 200 && response.status < 400) return { domain, available: false, status: "REGISTERED" };
    return { domain, available: null, status: "UNKNOWN" };
  } catch {
    return { domain, available: null, status: "UNKNOWN" };
  }
}

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);

  let body: any = {};
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { industry, location, keywords, businessType } = body;
  if (!industry) {
    return Response.json({ error: "Industry is required" }, { status: 400 });
  }

  const prompt = `You are an expert brand strategist and domain investor. Generate 10 highly successful, potentially VIRAL business name suggestions for a ${businessType || "local service business"} in the "${industry}" industry${location ? ` serving ${location}` : ""}${keywords ? ` with these keywords/themes: ${keywords}` : ""}.

For EACH name, use your web search to:
1. Search Google for "[name] [industry] [location]" to see if a business with this exact name already exists
2. Search for "[name] business registration [state]" to check state business registries
3. Check if the .com domain is likely available

Score each name's viral potential (0-100) based on: memorability, brandability, emotional resonance, uniqueness, and shareability.

Return JSON with this structure:
{
  "suggestions": [
    {
      "name": "Business Name",
      "domain": "businessname.com",
      "tagline": "short catchy tagline",
      "viral_score": 85,
      "state_registry_status": "likely_available",
      "google_search_status": "unique",
      "state_registry_notes": "what you found when searching state registries",
      "google_search_notes": "what you found when searching Google",
      "rationale": "why this name could become viral and highly successful",
      "target_audience": "who this name appeals to"
    }
  ]
}

Guidelines for highly successful names:
- Short (1-3 words), memorable, easy to spell and pronounce
- Evokes trust, speed, quality, or proximity for local businesses
- Has viral potential — catchy, shareable, could become a household name
- The .com domain should be short and brandable (no hyphens)
- Avoid trademarked names or names too similar to existing big brands
- For local service businesses, consider names with location hints or "near me" phrasing
- Prioritize names that sound premium and could command higher prices
- Each name must be distinct from the others in the list`;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                domain: { type: "string" },
                tagline: { type: "string" },
                viral_score: { type: "number" },
                state_registry_status: { type: "string" },
                google_search_status: { type: "string" },
                state_registry_notes: { type: "string" },
                google_search_notes: { type: "string" },
                rationale: { type: "string" },
                target_audience: { type: "string" },
              },
            },
          },
        },
      },
    });

    const suggestions: any[] = result?.suggestions || [];

    // Verify .com availability via RDAP in real-time
    const domains = suggestions.map((s: any) => s.domain).filter((d: string) => d);
    const availabilityMap: Record<string, string> = {};

    for (let i = 0; i < domains.length; i += 8) {
      const batch = domains.slice(i, i + 8);
      const results = await Promise.all(batch.map(checkDomain));
      for (const r of results) {
        availabilityMap[r.domain] = r.status;
      }
    }

    // Merge RDAP availability into suggestions and sort by viral score
    const enriched = suggestions
      .map((s: any) => ({
        ...s,
        domain_status: availabilityMap[s.domain] || "UNKNOWN",
        domain_available: availabilityMap[s.domain] === "AVAILABLE",
      }))
      .sort((a: any, b: any) => (b.viral_score || 0) - (a.viral_score || 0));

    return Response.json({ ok: true, suggestions: enriched });
  } catch (e) {
    console.error("recommendBusinessNames error:", e?.message || e);
    return Response.json({ error: e?.message || "Failed to generate suggestions" }, { status: 500 });
  }
}