// discoverSourcesRecursive — The recursive source discovery engine.
// Uses web search (InvokeLLM with add_context_from_internet) to find new
// sources, then uses the cloud browser to verify each URL is accessible
// and classify it. Creates SourceNode records in the source graph with
// parent links, discovery depth, and category classification.
//
// This is the core differentiator — it makes the system NOT a simple
// keyword scraper. It recursively discovers new domains, directories,
// forums, bid boards, permit portals, and communities from existing
// sources and from web search.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { scrapePage, isEngineConfigured } from '../../shared/cloudBrowserScrape.ts';
import { generateSearchQueries, DEFAULT_GEOGRAPHIES } from '../../shared/searchDimensions.ts';

const SOURCE_CATEGORIES = {
  'facebook_group': 'social', 'craigslist': 'marketplace', 'reddit': 'forum',
  'building_dept': 'permit', 'company_directory': 'directory', 'google_maps': 'map',
  'yelp': 'review', 'google_search': 'search_engine', 'bing_search': 'search_engine',
  'nextdoor': 'social', 'linkedin': 'social', 'x_twitter': 'social',
  'instagram': 'social', 'tiktok': 'social', 'youtube': 'video',
  'pinterest': 'social', 'quora': 'qa', 'discord': 'forum',
  'meetup': 'forum', 'alignable': 'directory', 'forum': 'forum',
  'bid_board': 'bid_board', 'plan_room': 'plan_room', 'procurement_portal': 'procurement',
  'property_record': 'property', 'permit_portal': 'permit', 'zoning_portal': 'zoning',
  'public_notice': 'public_notice', 'cre_listing': 'cre', 'foreclosure': 'foreclosure',
  'news': 'news', 'association': 'association', 'chamber': 'association', 'custom': 'directory',
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let user;
    try { user = await base44.auth.me(); } catch {}
    const svc = base44.asServiceRole;
    const {
      client_email, max_sources = 20, max_depth = 2, verify_urls = true,
      seed_queries = true, triggered_by = 'manual',
    } = body;

    const ownerEmail = client_email || user?.email;
    if (!ownerEmail) {
      return Response.json({ error: 'No client_email or authenticated user' }, { status: 400 });
    }

    const engineReady = await isEngineConfigured();
    const discovered = [];
    const errors = [];

    // Step 1: Generate discovery queries (SERVICE × INTENT × GEOGRAPHY + source-discovery terms)
    const discoveryQueries = seed_queries ? generateDiscoveryQueries() : [];
    const queriesToRun = discoveryQueries.slice(0, 10); // cap per run

    for (const queryObj of queriesToRun) {
      try {
        // Use InvokeLLM with web search to find new sources
        const llmRes = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a source discovery AI for a concrete/epoxy flooring contractor. Find websites, forums, Facebook groups, directories, bid boards, permit portals, and communities where potential customers or referral partners can be found.

Search query: "${queryObj.query}"

For each source you find, return:
- name: the site/community name
- url: the full URL
- source_type: one of [facebook_group, craigslist, reddit, building_dept, company_directory, google_maps, yelp, google_search, bing_search, nextdoor, linkedin, x_twitter, instagram, tiktok, youtube, pinterest, quora, discord, meetup, alignable, forum, bid_board, plan_room, procurement_portal, property_record, permit_portal, zoning_portal, public_notice, cre_listing, foreclosure, news, association, chamber]
- category: one of [social, marketplace, forum, directory, search_engine, map, review, bid_board, plan_room, procurement, permit, property, zoning, public_notice, cre, foreclosure, news, association, video, qa]
- geo_coverage: city/state/region/national/global
- service_relevance: which services this source is relevant to
- estimated_yield: low/medium/high (how many relevant posts/leads per week)
- why: one sentence explaining why this source is worth adding

Find 5-10 sources. Return JSON: {"sources": [...]}. Only return real, accessible URLs.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              sources: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    url: { type: 'string' },
                    source_type: { type: 'string' },
                    category: { type: 'string' },
                    geo_coverage: { type: 'string' },
                    service_relevance: { type: 'array', items: { type: 'string' } },
                    estimated_yield: { type: 'string' },
                    why: { type: 'string' },
                  },
                },
              },
            },
          },
        });

        const sources = llmRes?.sources || [];

        for (const src of sources) {
          if (!src.url || !src.source_type) continue;
          // Normalize URL
          let url = src.url.trim();
          if (!url.startsWith('http')) url = 'https://' + url;

          // Check for duplicates in SourceNode graph
          try {
            const existing = await svc.entities.SourceNode.filter(
              { client_email: ownerEmail, url },
              '-created_date',
              1
            );
            if (existing.length > 0) continue; // already in graph
          } catch { /* ignore filter errors */ }

          // Verify URL is accessible (optional, uses cloud browser)
          let verified = false;
          if (verify_urls && engineReady) {
            try {
              const page = await scrapePage(url, { waitMs: 2000, screenshot: false });
              verified = !!(page.text || page.html);
            } catch {
              verified = false;
            }
          } else if (!verify_urls) {
            verified = true; // skip verification
          }

          // Create SourceNode in the graph
          const sourceNode = await svc.entities.SourceNode.create({
            client_email: ownerEmail,
            source_type: src.source_type,
            category: src.category || SOURCE_CATEGORIES[src.source_type] || 'directory',
            name: src.name,
            url,
            geo_coverage: src.geo_coverage || 'unknown',
            service_relevance: src.service_relevance || [],
            parent_source_id: null, // top-level discovery
            discovery_depth: 0,
            discovered_via: 'web_search',
            quality_score: src.estimated_yield === 'high' ? 75 : src.estimated_yield === 'medium' ? 50 : 30,
            active: true,
            verified,
            discovered_at: new Date().toISOString(),
          });
          discovered.push({
            id: sourceNode.id, name: src.name, url, source_type: src.source_type,
            verified, estimated_yield: src.estimated_yield,
          });

          if (discovered.length >= max_sources) break;
        }
      } catch (queryErr) {
        errors.push({ query: queryObj.query, error: queryErr?.message || 'query failed' });
      }

      if (discovered.length >= max_sources) break;
    }

    // Step 2: Recursive discovery — for each newly discovered source, find
    // linked sources (directories, member lists, local chapters). Depth-limited.
    if (max_depth > 0 && engineReady && discovered.length > 0) {
      for (const source of discovered.slice(0, 5)) { // recurse on top 5
        if (source.discovery_depth >= max_depth) continue;
        try {
          const recursiveSources = await discoverLinkedSources(base44, svc, source, ownerEmail, max_depth);
          discovered.push(...recursiveSources);
        } catch (recurseErr) {
          errors.push({ source: source.url, error: 'recursive discovery failed' });
        }
      }
    }

    return Response.json({
      ok: true,
      queries_run: queriesToRun.length,
      sources_discovered: discovered.length,
      discovered,
      errors,
    });
  } catch (error) {
    console.error('discoverSourcesRecursive error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}

// Generate source-discovery queries (different from lead-discovery queries)
function generateDiscoveryQueries() {
  const queries = [];
  const services = ['epoxy flooring', 'concrete polishing', 'concrete resurfacing', 'garage floor coating', 'polished concrete'];
  const geo = DEFAULT_GEOGRAPHIES.slice(0, 5);
  const sourceTerms = [
    'forum', 'facebook group', 'community', 'directory', 'association',
    'bid board', 'plan room', 'permit portal', 'contractor directory',
    'homeowner forum', 'remodeling forum', 'DIY forum',
  ];

  for (const service of services) {
    for (const g of geo) {
      for (const term of sourceTerms) {
        queries.push({ query: `${service} ${term} ${g}`, dimension: 'source_discovery' });
      }
    }
  }
  return queries.sort(() => Math.random() - 0.5);
}

// Recursive: scrape a source, extract outbound links, classify them
async function discoverLinkedSources(base44, svc, source, ownerEmail, maxDepth) {
  const discovered = [];
  try {
    const page = await scrapePage(source.url, { waitMs: 3000, screenshot: false });
    const html = page.html || '';
    if (!html) return discovered;

    // Extract outbound links and classify with AI
    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a source discovery AI. The following is HTML from ${source.name} (${source.url}).

Extract outbound links that lead to:
1. Directories or member lists
2. Local chapters or regional pages
3. Related forums or communities
4. Bid pages, project pages, or permit pages
5. Partner/vendor directories
6. Adjacent trade organizations

For each link, return:
- name: link text or page name
- url: the full URL
- source_type: one of the standard source types
- category: one of the standard categories
- why: why this linked source is worth adding to the source graph

Return up to 5 links. JSON: {"links": [...]}. Ignore social media share buttons, ads, and unrelated external links.`,
      response_json_schema: {
        type: 'object',
        properties: {
          links: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                url: { type: 'string' },
                source_type: { type: 'string' },
                category: { type: 'string' },
                why: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const links = llmRes?.links || [];
    for (const link of links) {
      if (!link.url) continue;
      try {
        const existing = await svc.entities.SourceNode.filter(
          { client_email: ownerEmail, url: link.url },
          '-created_date',
          1
        );
        if (existing.length > 0) continue;
      } catch {}

      try {
        const node = await svc.entities.SourceNode.create({
          client_email: ownerEmail,
          source_type: link.source_type || source.source_type,
          category: link.category || source.category,
          name: link.name || 'Discovered link',
          url: link.url,
          geo_coverage: source.geo_coverage,
          service_relevance: source.service_relevance || [],
          parent_source_id: source.id,
          discovery_depth: (source.discovery_depth || 0) + 1,
          discovered_via: 'link_follow',
          quality_score: 40,
          active: true,
          verified: false,
          discovered_at: new Date().toISOString(),
        });
        discovered.push({
          id: node.id, name: link.name, url: link.url,
          source_type: link.source_type, discovery_depth: node.discovery_depth,
        });
      } catch (createErr) {
        // skip
      }
    }
  } catch (err) {
    // best-effort
  }
  return discovered;
}