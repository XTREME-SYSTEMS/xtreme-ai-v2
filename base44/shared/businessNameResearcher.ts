// businessNameResearcher.ts — Deep business name + URL researcher.
// ------------------------------------------------------------
// Combines AI name generation, Browserbase web scraping (Google search),
// OpenCorporates US state business registry checks, and RDAP domain
// verification to find unique, viral, strong business names with 100%
// confirmed available .com domains.
//
// Pipeline:
// 1. AI generates 15 candidate names (Gemini Flash + web search)
// 2. RDAP verifies domain availability — filters to 100% available only
// 3. Browserbase scrapes Google search results for each available name
//    (verifies real-world uniqueness, extracts result count + top results)
// 4. OpenCorporates API checks US state business registries
// 5. AI re-scores every name using the actual scraped research data
// 6. Returns only 100% available domains with full transparency
//
// Used by both the client portal (recommendBusinessNames) and the
// AutoBuilder (processAutoBuildStep → runNames) — one source of truth.
// ============================================================

import { scrapeUrl } from './browserbaseScrape.ts';

// ── RDAP domain availability check ────────────────────────────────────────

function getRdapUrl(domain: string): string {
  const tld = domain.split('.').pop();
  if (tld === 'com') return `https://rdap.verisign.com/com/v1/domain/${domain}`;
  if (tld === 'org') return `https://rdap.publicinterestregistry.org/rdap/domain/${domain}`;
  if (tld === 'net') return `https://rdap.verisign.com/net/v1/domain/${domain}`;
  return `https://rdap.org/domain/${domain}`;
}

async function checkDomain(domain: string): Promise<{ domain: string; available: boolean | null; status: string }> {
  try {
    const response = await fetch(getRdapUrl(domain), {
      method: 'GET',
      headers: { Accept: 'application/rdap+json' },
      redirect: 'follow',
    });
    if (response.status === 404) return { domain, available: true, status: 'AVAILABLE' };
    if (response.status >= 200 && response.status < 400) return { domain, available: false, status: 'REGISTERED' };
    return { domain, available: null, status: 'UNKNOWN' };
  } catch {
    return { domain, available: null, status: 'UNKNOWN' };
  }
}

// ── Google search scraping (direct fetch first, Browserbase fallback) ────

function parseGoogleResults(html: string, query: string, name: string, method: string) {
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract result count
  const countMatch = text.match(/About\s+([\d,]+)\s+results/) || text.match(/([\d,]+)\s+results/);
  const resultCount = countMatch ? parseInt(countMatch[1].replace(/,/g, '')) : null;

  // Extract result titles from h3 tags
  const titles: string[] = [];
  const h3Matches = html.match(/<h3[^>]*>([^<]+)<\/h3>/g) || [];
  for (const m of h3Matches.slice(0, 8)) {
    const title = m.replace(/<[^>]+>/g, '').trim();
    if (title) titles.push(title);
  }

  // Check if any result is an exact match
  const nameLower = name.toLowerCase();
  const hasExactMatch = titles.some((t) => t.toLowerCase().includes(nameLower));

  let uniqueness: string;
  if (resultCount === null) uniqueness = 'unknown';
  else if (resultCount < 5) uniqueness = 'highly_unique';
  else if (resultCount < 20) uniqueness = 'unique';
  else if (resultCount < 100) uniqueness = 'moderate';
  else uniqueness = 'common';

  return {
    query,
    result_count: resultCount,
    top_results: titles,
    has_exact_match: hasExactMatch,
    uniqueness,
    method,
  };
}

async function researchGoogleUniqueness(name: string, industry: string, location: string) {
  const query = `"${name}" ${industry} ${location || ''}`.trim();
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`;

  // Try direct fetch first (fast) — real browser User-Agent
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const html = await res.text();
      // Check if we got real results (not a CAPTCHA/block page)
      if (html.length > 1000 && !html.toLowerCase().includes('unusual traffic') && !html.toLowerCase().includes('captcha')) {
        return parseGoogleResults(html, query, name, 'fetch');
      }
    }
  } catch { /* fall through to Browserbase */ }

  // Fall back to Browserbase (real browser, handles JS + bot detection)
  try {
    const scraped = await scrapeUrl(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    return parseGoogleResults(scraped.html || '', query, name, scraped.method || 'browserbase');
  } catch (e: any) {
    return { query, error: e?.message || 'scrape failed', uniqueness: 'unknown', method: 'failed' };
  }
}

// ── US state business registry check (OpenCorporates API) ─────────────────

async function checkStateRegistry(name: string, location: string) {
  const stateMatch = location?.match(/\b([A-Z]{2})\b/);
  const stateCode = stateMatch ? stateMatch[1].toLowerCase() : null;

  try {
    const url = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(name)}${stateCode ? `&jurisdiction_code=us_${stateCode}` : ''}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { status: 'unknown', error: `API ${res.status}` };
    const data = await res.json();
    const companies = data?.results?.companies || [];
    const exactMatches = companies.filter((c: any) =>
      c?.company?.name?.toLowerCase() === name.toLowerCase()
    );

    let status: string;
    if (exactMatches.length > 0) status = 'exists';
    else if (companies.length > 0) status = 'likely_available';
    else status = 'available';

    return {
      status,
      total_results: data?.results?.total_count || 0,
      exact_matches: exactMatches.length,
      jurisdiction: stateCode ? `us_${stateCode}` : 'all_us',
      sample_companies: companies.slice(0, 3).map((c: any) => c?.company?.name).filter(Boolean),
    };
  } catch (e: any) {
    return { status: 'unknown', error: e?.message };
  }
}

// ── Main deep research function ───────────────────────────────────────────

export async function researchBusinessNamesDeep(base44: any, params: Record<string, any>) {
  const { industry, location, keywords, businessType, businessName } = params;
  const logs: string[] = [];
  const phases: any[] = [];

  // ── Phase 1: Generate candidates with AI + web search ──
  logs.push(`[Phase 1] Generating 10 candidate names with AI + web search...`);

  const genPrompt = `You are an expert brand strategist and viral naming specialist. Generate 10 highly successful, potentially VIRAL business name suggestions for a ${businessType || "local service business"} in the "${industry}" industry${location ? ` serving ${location}` : ""}${keywords ? ` with keywords/themes: ${keywords}` : ""}${businessName ? `. Current name: "${businessName}" — use as inspiration but generate alternatives too.` : ""}.

For EACH name, use your web search to research:
1. Search Google for "[name] [industry] [location]" to check if a business with this exact name exists
2. Search for "[name] business registration" to check state registries
3. Assess if the .com domain is likely available

Score each name on these 0-100 scales:
- viral_score: memorability, brandability, emotional resonance, shareability
- local_seo_score: how well name+domain supports ranking for "[industry] near [location]"
- searchability_score: how easily customers find/recall this business in Google and AI answers
- brandability_score: potential to build a strong, recognizable brand identity
- domain_strength_score: domain quality (short, no hyphens, .com, easy to spell)
- trademark_safety_score: low risk of trademark conflict (100 = very safe)

Return JSON:
{
  "suggestions": [
    {
      "name": "Business Name",
      "domain": "businessname.com",
      "tagline": "short catchy tagline",
      "viral_score": 85,
      "local_seo_score": 80,
      "searchability_score": 78,
      "brandability_score": 82,
      "domain_strength_score": 90,
      "trademark_safety_score": 88,
      "rationale": "why this name could become viral and successful",
      "target_audience": "who this appeals to",
      "state_registry_status": "likely_available",
      "google_search_status": "unique"
    }
  ]
}

Guidelines: Short (1-3 words), memorable, easy to spell. Evokes trust, speed, quality, or proximity. .com must be short and brandable (no hyphens). Avoid trademarked names. Consider location hints or "near me" phrasing. Each name must be distinct.`;

  const genResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: genPrompt,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              domain: { type: 'string' },
              tagline: { type: 'string' },
              viral_score: { type: 'number' },
              local_seo_score: { type: 'number' },
              searchability_score: { type: 'number' },
              brandability_score: { type: 'number' },
              domain_strength_score: { type: 'number' },
              trademark_safety_score: { type: 'number' },
              rationale: { type: 'string' },
              target_audience: { type: 'string' },
              state_registry_status: { type: 'string' },
              google_search_status: { type: 'string' },
            },
          },
        },
      },
    },
  });

  const candidates: any[] = genResult?.suggestions || [];
  phases.push({ name: 'AI Candidate Generation', count: candidates.length });
  logs.push(`[Phase 1] Generated ${candidates.length} candidates`);

  if (candidates.length === 0) {
    return { suggestions: [], logs, phases, error: 'No candidates generated' };
  }

  // ── Phase 2: Check domain availability via RDAP ──
  logs.push(`[Phase 2] Checking domain availability via RDAP for ${candidates.length} domains...`);
  const domains = candidates.map((c: any) => c.domain).filter(Boolean);
  const domainResults: Record<string, any> = {};
  for (let i = 0; i < domains.length; i += 8) {
    const batch = domains.slice(i, i + 8);
    const results = await Promise.all(batch.map(checkDomain));
    for (const r of results) domainResults[r.domain] = r;
  }
  const availableCount = Object.values(domainResults).filter((r: any) => r.available === true).length;
  phases.push({ name: 'RDAP Domain Check', total: domains.length, available: availableCount });
  logs.push(`[Phase 2] ${availableCount} domains available out of ${domains.length}`);

  // Filter to only 100% available domains
  const availableCandidates = candidates.filter((c: any) => domainResults[c.domain]?.available === true);

  if (availableCandidates.length === 0) {
    return { suggestions: [], logs, phases, error: 'No 100% available domains found. Try different keywords.' };
  }

  // ── Phase 3 + 4: Scrape Google + check state registries IN PARALLEL ──
  logs.push(`[Phase 3+4] Scraping Google + checking US state registries in parallel for ${availableCandidates.length} names...`);
  const [googleResults, registryResults] = await Promise.all([
    Promise.all(availableCandidates.map((c: any) => researchGoogleUniqueness(c.name, industry, location))),
    Promise.all(availableCandidates.map((c: any) => checkStateRegistry(c.name, location))),
  ]);
  availableCandidates.forEach((c: any, i: number) => {
    c.google_research = googleResults[i];
    // Fallback: if OpenCorporates failed (401/unknown), use the LLM's initial assessment
    const regResult = registryResults[i];
    if (regResult?.status === 'unknown' && (c.state_registry_status || c.google_search_status)) {
      c.state_registry = {
        status: c.state_registry_status || 'unknown',
        total_results: 0,
        exact_matches: 0,
        jurisdiction: location?.match(/\b([A-Z]{2})\b/)?.[1]?.toLowerCase() ? `us_${location.match(/\b([A-Z]{2})\b/)[1].toLowerCase()}` : 'all_us',
        sample_companies: [],
        source: 'ai_assessment',
      };
    } else {
      c.state_registry = regResult;
    }
  });
  phases.push({ name: 'Google Uniqueness Scraping', count: availableCandidates.length });
  phases.push({ name: 'State Registry Check', count: availableCandidates.length });
  logs.push(`[Phase 3+4] Research complete`);

  // ── Phase 5: AI re-scoring with all research data ──
  logs.push(`[Phase 5] AI re-scoring with research data...`);
  const researchData = availableCandidates.map((c: any) => ({
    name: c.name,
    domain: c.domain,
    google_uniqueness: c.google_research?.uniqueness,
    google_result_count: c.google_research?.result_count,
    google_has_exact_match: c.google_research?.has_exact_match,
    state_registry_status: c.state_registry?.status,
    state_registry_exact_matches: c.state_registry?.exact_matches,
  }));

  const scorePrompt = `You are an expert brand strategist. Re-score these business names based on REAL research data from web scraping and US state registry checks. Update each score based on the actual findings.

NAMES TO SCORE:
${JSON.stringify(researchData, null, 2)}

For each name, provide updated scores (0-100) based on the research:
- viral_score: memorability, brandability, shareability
- local_seo_score: local search ranking potential
- searchability_score: how easily found in Google/AI
- brandability_score: brand identity potential
- domain_strength_score: domain quality
- trademark_safety_score: trademark conflict risk (100 = safe)
- google_uniqueness_score: based on Google result count (fewer = higher score)
- registry_clearance_score: based on state registry check (no matches = higher score)
- overall_score: weighted composite (0-100)

Also provide an updated rationale that references the actual research findings (Google results, registry status).

Return JSON:
{
  "scores": [
    {
      "name": "Business Name",
      "viral_score": 85,
      "local_seo_score": 80,
      "searchability_score": 78,
      "brandability_score": 82,
      "domain_strength_score": 90,
      "trademark_safety_score": 88,
      "google_uniqueness_score": 92,
      "registry_clearance_score": 95,
      "overall_score": 86,
      "rationale": "updated rationale referencing research findings"
    }
  ]
}`;

  const scoreResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: scorePrompt,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        scores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              viral_score: { type: 'number' },
              local_seo_score: { type: 'number' },
              searchability_score: { type: 'number' },
              brandability_score: { type: 'number' },
              domain_strength_score: { type: 'number' },
              trademark_safety_score: { type: 'number' },
              google_uniqueness_score: { type: 'number' },
              registry_clearance_score: { type: 'number' },
              overall_score: { type: 'number' },
              rationale: { type: 'string' },
            },
          },
        },
      },
    },
  });

  const scoreMap: Record<string, any> = {};
  for (const s of (scoreResult?.scores || [])) {
    scoreMap[s.name?.toLowerCase()] = s;
  }

  // ── Phase 6: Merge and return only 100% available ──
  const final = availableCandidates.map((c: any) => {
    const scores = scoreMap[c.name?.toLowerCase()] || {};
    return {
      ...c,
      ...scores,
      domain_status: 'AVAILABLE',
      domain_available: true,
    };
  }).sort((a: any, b: any) => (b.overall_score || 0) - (a.overall_score || 0));

  phases.push({ name: 'AI Re-scoring', count: final.length });
  logs.push(`[Phase 5] Re-scoring complete — ${final.length} names with 100% available domains`);

  return { suggestions: final, logs, phases };
}