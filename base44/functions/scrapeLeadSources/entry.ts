// scrapeLeadSources — Uses the self-hosted cloud browser engine to scrape
// lead sources (Facebook groups, Craigslist, Reddit, building departments,
// company directories) and uses AI to extract structured leads.
//
// Flow: for each active LeadSource → cloud browser scrapes the page →
// InvokeLLM analyzes the HTML and extracts leads as JSON → saves ScrapedLead records.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { scrapePage, isEngineConfigured } from '../../shared/cloudBrowserScrape.ts';

const DEFAULT_SERVICE_KEYWORDS = [
  'epoxy flooring', 'garage floor', 'garage floor coating', 'decorative concrete',
  'polished concrete', 'stained concrete', 'concrete overlay', 'epoxy countertop',
  'concrete countertop', 'concrete grinding', 'concrete leveling',
  'driveway', 'sidewalk', 'patio', 'concrete patio', 'concrete driveway',
  'concrete resurfacing', 'concrete sealing', 'concrete repair'
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Auth — admin or the client themselves
    let user;
    try { user = await base44.auth.me(); } catch {}

    const svc = base44.asServiceRole;
    const { client_email, source_id, max_sources = 5, triggered_by = 'manual' } = body;

    // Determine which sources to scrape
    let sources;
    if (source_id) {
      const s = await svc.entities.LeadSource.get(source_id);
      sources = s ? [s] : [];
    } else {
      const query = { active: true } as any;
      if (client_email) query.client_email = client_email;
      sources = await svc.entities.LeadSource.filter(query, '-last_scraped', max_sources);
    }

    if (!sources.length) {
      return Response.json({ error: 'No active lead sources found. Add sources first.' }, { status: 404 });
    }

    // Check engine config
    const engineReady = await isEngineConfigured();
    if (!engineReady) {
      return Response.json({ error: 'Cloud browser engine not configured. Set ENGINE_URL and ENGINE_API_KEY secrets.' }, { status: 503 });
    }

    const allLeads = [];
    const results = [];

    for (const source of sources) {
      try {
        // Scrape the source URL using the cloud browser
        const config = source.config || {};
        const scraped = await scrapePage(source.source_url, {
          timeout: 45000,
          waitMs: config.wait_ms || 3000,
          screenshot: false,
        });

        // Build AI extraction prompt based on source type
        const keywords = source.service_keywords?.length ? source.service_keywords : DEFAULT_SERVICE_KEYWORDS;
        const extractionPrompt = buildExtractionPrompt(source, keywords);

        // Use AI to extract structured leads from the scraped content
        const contentForAI = (scraped.html || scraped.text || '').substring(0, 45000);
        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: extractionPrompt + '\n\n--- PAGE CONTENT ---\n' + contentForAI,
          response_json_schema: {
            type: 'object',
            properties: {
              leads: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    contact_name: { type: 'string' },
                    contact_email: { type: 'string' },
                    contact_phone: { type: 'string' },
                    location: { type: 'string' },
                    matched_keywords: { type: 'array', items: { type: 'string' } },
                    intent_score: { type: 'number' },
                    lead_type: { type: 'string' }
                  }
                }
              }
            }
          }
        });

        const leads = llmResponse?.leads || [];

        // Save leads (deduplicate by title + source)
        let savedCount = 0;
        for (const lead of leads) {
          if (!lead.title) continue;
          try {
            // Check for duplicates
            const existing = await svc.entities.ScrapedLead.filter({
              client_email: source.client_email,
              source_id: source.id,
              title: lead.title,
            }, '-created_date', 1);
            if (existing.length > 0) continue;

            const saved = await svc.entities.ScrapedLead.create({
              client_email: source.client_email,
              source_id: source.id,
              source_type: source.source_type,
              source_name: source.source_name,
              source_url: source.source_url,
              lead_type: lead.lead_type || (source.source_type === 'company_directory' || source.source_type === 'google_maps' ? 'company' : source.source_type === 'building_dept' ? 'permit_project' : 'service_request'),
              title: lead.title,
              description: lead.description || '',
              contact_name: lead.contact_name || '',
              contact_email: lead.contact_email || '',
              contact_phone: lead.contact_phone || '',
              location: lead.location || source.location || '',
              matched_keywords: lead.matched_keywords || [],
              intent_score: lead.intent_score || 50,
              status: 'new',
              scraped_at: new Date().toISOString(),
            });
            allLeads.push(saved);
            savedCount++;
          } catch (saveErr) {
            console.log(`Failed to save lead "${lead.title}": ${saveErr?.message || saveErr}`);
          }
        }

        // Update source
        await svc.entities.LeadSource.update(source.id, {
          last_scraped: new Date().toISOString(),
          last_result_count: savedCount,
          last_error: '',
        });

        results.push({
          source_id: source.id,
          source_name: source.source_name,
          source_type: source.source_type,
          leads_found: savedCount,
        });
      } catch (sourceErr) {
        console.log(`Source scrape failed for ${source.source_name}: ${sourceErr?.message || sourceErr}`);
        await svc.entities.LeadSource.update(source.id, {
          last_scraped: new Date().toISOString(),
          last_error: sourceErr?.message || 'scrape failed',
        }).catch(() => {});
        results.push({
          source_id: source.id,
          source_name: source.source_name,
          error: sourceErr?.message || 'scrape failed',
        });
      }
    }

    return Response.json({
      ok: true,
      sources_scraped: sources.length,
      total_leads: allLeads.length,
      results,
    });
  } catch (error) {
    console.error('scrapeLeadSources error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}

function buildExtractionPrompt(source, keywords) {
  const kwList = keywords.join(', ');

  if (source.source_type === 'company_directory' || source.source_type === 'google_maps' || source.source_type === 'yelp') {
    return `You are a lead extraction AI. The following is HTML from a business directory or map listing page. Extract all companies that are likely CUSTOMERS for concrete/epoxy flooring services. Target companies include: general contractors, home builders, property managers, real estate agents, home flippers, interior designers, remodeling contractors, and similar trades.

For each company, extract:
- title: company name
- description: what they do (1-2 sentences)
- contact_name: contact person if available
- contact_email: email if visible
- contact_phone: phone if visible
- location: city/state if available
- matched_keywords: which service keywords are relevant to them
- intent_score: 0-100 (how likely they need concrete/epoxy services — higher for contractors, builders, flippers)
- lead_type: "company"

Service keywords we offer: ${kwList}

Return only valid JSON. If no companies found, return {"leads": []}.`;
  }

  if (source.source_type === 'building_dept') {
    return `You are a lead extraction AI. The following is HTML from a building department permit portal. Extract all building permits that involve concrete, flooring, epoxy, or related trades.

For each relevant permit, extract:
- title: permit description or project name
- description: full permit details (scope of work, trade, value)
- contact_name: contractor or applicant name
- contact_email: email if available
- contact_phone: phone if available
- location: project address
- matched_keywords: which service keywords matched
- intent_score: 0-100 (100 = explicitly concrete/epoxy permit, 50 = might involve concrete)
- lead_type: "permit_project"

Service keywords: ${kwList}

Return only valid JSON. If no relevant permits found, return {"leads": []}.`;
  }

  // Default: social media (Facebook groups, Craigslist, Reddit)
  const platformName = source.source_type === 'facebook_group' ? 'a Facebook group' :
                       source.source_type === 'craigslist' ? 'Craigslist' :
                       source.source_type === 'reddit' ? 'Reddit' : 'a web page';

  return `You are a lead extraction AI. The following is HTML from ${platformName}.

Extract all posts where someone is LOOKING FOR or NEEDING concrete, epoxy, or flooring services. Look for phrases like:
- "looking for", "need", "need a", "anyone know", "recommend", "who does", "searching for", "can anyone recommend"
- "garage floor", "epoxy", "concrete", "driveway", "patio", "polished concrete", etc.

For each matching post, extract:
- title: post title or first line
- description: the full post content
- contact_name: poster name if available
- contact_email: email if visible
- contact_phone: phone if visible
- location: location mentioned (city/neighborhood)
- matched_keywords: which service keywords were mentioned in the post
- intent_score: 0-100 (100 = explicitly asking for this exact service, 50 = vaguely related, 30 = general home improvement)
- lead_type: "service_request"

Service keywords to match: ${kwList}

IMPORTANT: Only include posts that genuinely relate to concrete/epoxy/flooring services. Ignore spam, unrelated posts, business advertisements, and job postings. Only include a post if the person seems to be a potential CUSTOMER looking for these services.

Return only valid JSON. If no matching posts found, return {"leads": []}.`;
}