// enrichHotLead — Investigates a HOT/VERY_HOT lead deeply. Builds the
// lead graph by creating LeadRelationship nodes (PERSON → COMPANY →
// PROPERTY → PROJECT → GC → ARCHITECT → DEVELOPER → FLOORING SCOPE →
// EPOXY OPPORTUNITY). Uses web search + cloud browser to find the
// company website, project details, permits, GC/architect, and
// adjacent trades.
//
// Triggered by the Validator when a lead is classified hot/very_hot,
// or manually from the Lead Engine UI.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { scrapePage, isEngineConfigured } from '../../shared/cloudBrowserScrape.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let user;
    try { user = await base44.auth.me(); } catch {}
    const svc = base44.asServiceRole;
    const { lead_id, client_email, max_depth = 2 } = body;

    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    const lead = await svc.entities.ScrapedLead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Mark as enriching
    await svc.entities.ScrapedLead.update(lead_id, { enrichment_status: 'enriching' });

    const nodes = [];
    const engineReady = await isEngineConfigured();

    // Step 1: Investigate the original conversation/source (if URL available)
    if (lead.source_url) {
      try {
        const page = engineReady
          ? await scrapePage(lead.source_url, { waitMs: 3000, screenshot: true })
          : null;

        // Create a SOURCE node
        const sourceNode = await svc.entities.LeadRelationship.create({
          client_email: lead.client_email,
          lead_id: lead.id,
          node_type: 'person',
          name: lead.contact_name || 'Original poster',
          role: lead.lead_type === 'company' ? 'business' : 'homeowner',
          url: lead.source_url,
          email: lead.contact_email || '',
          phone: lead.contact_phone || '',
          location: lead.location || '',
          evidence: lead.description || lead.title,
          confidence: 80,
          investigated: !!page,
          discovered_at: new Date().toISOString(),
        });
        nodes.push(sourceNode);
      } catch (e) {
        // best-effort
      }
    }

    // Step 2: If it's a company lead, investigate the company website
    if (lead.lead_type === 'company' || lead.company_website) {
      let website = lead.company_website;
      if (!website && lead.contact_email) {
        // Try to find website from email domain
        const domain = lead.contact_email.split('@')[1];
        if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('outlook')) {
          website = `https://${domain}`;
        }
      }

      if (website) {
        try {
          // Scrape the company website
          let companyInfo = null;
          if (engineReady) {
            const page = await scrapePage(website, { waitMs: 3000, screenshot: false });
            const content = (page.text || '').substring(0, 8000);
            // AI extract company details
            companyInfo = await base44.integrations.Core.InvokeLLM({
              prompt: `Extract company information from this website content. URL: ${website}

Return:
- company_name: the company name
- industry: what industry/trade
- services: list of services they offer
- locations: service areas
- contact_email: public contact email if visible
- contact_phone: public phone if visible
- address: business address if visible
- is_gc: true if they're a general contractor
- is_referral_partner: true if they could refer flooring/concrete work to us
- projects: any project names/types mentioned

JSON only. Content:
${content}`,
              response_json_schema: {
                type: 'object',
                properties: {
                  company_name: { type: 'string' },
                  industry: { type: 'string' },
                  services: { type: 'array', items: { type: 'string' } },
                  locations: { type: 'array', items: { type: 'string' } },
                  contact_email: { type: 'string' },
                  contact_phone: { type: 'string' },
                  address: { type: 'string' },
                  is_gc: { type: 'boolean' },
                  is_referral_partner: { type: 'boolean' },
                  projects: { type: 'array', items: { type: 'string' } },
                },
              },
            });
          }

          const companyNode = await svc.entities.LeadRelationship.create({
            client_email: lead.client_email,
            lead_id: lead.id,
            node_type: 'company',
            name: companyInfo?.company_name || lead.title,
            website,
            email: companyInfo?.contact_email || '',
            phone: companyInfo?.contact_phone || '',
            address: companyInfo?.address || '',
            location: companyInfo?.locations?.join(', ') || lead.location || '',
            url: website,
            evidence: companyInfo?.services?.join(', ') || 'Company website',
            confidence: 85,
            investigated: !!companyInfo,
            discovered_at: new Date().toISOString(),
          });
          nodes.push(companyNode);

          // Update lead with enriched company data
          await svc.entities.ScrapedLead.update(lead_id, {
            company_website: website,
            gc_name: companyInfo?.is_gc ? companyInfo?.company_name : '',
          });

          // If they're a referral partner, create a partner node
          if (companyInfo?.is_referral_partner || companyInfo?.is_gc) {
            const partnerNode = await svc.entities.LeadRelationship.create({
              client_email: lead.client_email,
              lead_id: lead.id,
              node_type: 'gc',
              name: companyInfo?.company_name || lead.title,
              website,
              role: companyInfo?.industry || 'general contractor',
              confidence: 90,
              evidence: 'Identified as referral partner via website analysis',
              discovered_at: new Date().toISOString(),
            });
            nodes.push(partnerNode);
          }
        } catch (e) {
          console.log(`Company investigation failed: ${e?.message || e}`);
        }
      }
    }

    // Step 3: If it's a permit/project lead, investigate the project
    if (lead.lead_type === 'permit_project' || lead.opportunity_type === 'project_demand' || lead.opportunity_type === 'bid_demand') {
      try {
        // Web search for project details
        const projectInfo = await base44.integrations.Core.InvokeLLM({
          prompt: `Investigate this construction project/permit lead for a concrete/epoxy flooring contractor.

Lead: ${lead.title}
Description: ${lead.description}
Location: ${lead.location}
Source: ${lead.source_name}

Search for:
1. Project name and details
2. General contractor (GC) on the project
3. Architect or designer
4. Developer
5. Property address
6. Project stage (planning, permitting, bidding, construction)
7. Estimated project value
8. Bid deadline if applicable

Return what you find. Mark unknown fields as "unknown" — do NOT fabricate.

JSON: {"project_name": "...", "gc_name": "...", "architect_name": "...", "developer_name": "...", "property_address": "...", "project_stage": "...", "estimated_value": 0, "bid_deadline": "...", "bid_url": "..."}`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              project_name: { type: 'string' },
              gc_name: { type: 'string' },
              architect_name: { type: 'string' },
              developer_name: { type: 'string' },
              property_address: { type: 'string' },
              project_stage: { type: 'string' },
              estimated_value: { type: 'number' },
              bid_deadline: { type: 'string' },
              bid_url: { type: 'string' },
            },
          },
        });

        // Create project node
        if (projectInfo?.project_name && projectInfo.project_name !== 'unknown') {
          const projectNode = await svc.entities.LeadRelationship.create({
            client_email: lead.client_email,
            lead_id: lead.id,
            node_type: 'project',
            name: projectInfo.project_name,
            address: projectInfo.property_address,
            location: lead.location,
            evidence: `Stage: ${projectInfo.project_stage}, Value: $${projectInfo.estimated_value || 'unknown'}`,
            confidence: 75,
            investigated: true,
            discovered_at: new Date().toISOString(),
          });
          nodes.push(projectNode);
        }

        // Create GC node
        if (projectInfo?.gc_name && projectInfo.gc_name !== 'unknown') {
          const gcNode = await svc.entities.LeadRelationship.create({
            client_email: lead.client_email,
            lead_id: lead.id,
            node_type: 'gc',
            name: projectInfo.gc_name,
            role: 'general contractor',
            evidence: `GC on ${projectInfo.project_name || 'project'}`,
            confidence: 80,
            discovered_at: new Date().toISOString(),
          });
          nodes.push(gcNode);
        }

        // Create architect node
        if (projectInfo?.architect_name && projectInfo.architect_name !== 'unknown') {
          const archNode = await svc.entities.LeadRelationship.create({
            client_email: lead.client_email,
            lead_id: lead.id,
            node_type: 'architect',
            name: projectInfo.architect_name,
            role: 'architect',
            evidence: `Architect on ${projectInfo.project_name || 'project'}`,
            confidence: 75,
            discovered_at: new Date().toISOString(),
          });
          nodes.push(archNode);
        }

        // Create developer node
        if (projectInfo?.developer_name && projectInfo.developer_name !== 'unknown') {
          const devNode = await svc.entities.LeadRelationship.create({
            client_email: lead.client_email,
            lead_id: lead.id,
            node_type: 'developer',
            name: projectInfo.developer_name,
            role: 'developer',
            evidence: `Developer on ${projectInfo.project_name || 'project'}`,
            confidence: 75,
            discovered_at: new Date().toISOString(),
          });
          nodes.push(devNode);
        }

        // Create property node
        if (projectInfo?.property_address && projectInfo.property_address !== 'unknown') {
          const propNode = await svc.entities.LeadRelationship.create({
            client_email: lead.client_email,
            lead_id: lead.id,
            node_type: 'property',
            name: projectInfo.property_address,
            address: projectInfo.property_address,
            location: lead.location,
            evidence: 'Property associated with project',
            confidence: 70,
            discovered_at: new Date().toISOString(),
          });
          nodes.push(propNode);
        }

        // Create epoxy opportunity node (the flooring scope)
        const oppNode = await svc.entities.LeadRelationship.create({
          client_email: lead.client_email,
          lead_id: lead.id,
          node_type: 'epoxy_opportunity',
          name: 'Flooring/Concrete Scope',
          evidence: `Potential flooring scope on ${projectInfo?.project_name || 'this project'}`,
          confidence: 70,
          discovered_at: new Date().toISOString(),
        });
        nodes.push(oppNode);

        // Update lead with enriched project data
        await svc.entities.ScrapedLead.update(lead_id, {
          project_name: projectInfo?.project_name || '',
          project_stage: projectInfo?.project_stage || '',
          gc_name: projectInfo?.gc_name || '',
          architect_name: projectInfo?.architect_name || '',
          developer_name: projectInfo?.developer_name || '',
          property_address: projectInfo?.property_address || '',
          estimated_value: projectInfo?.estimated_value || 0,
          bid_url: projectInfo?.bid_url || '',
          bid_deadline: projectInfo?.bid_deadline || '',
          recommended_next_action: projectInfo?.bid_url
            ? 'Review bid documents and submit proposal before deadline'
            : 'Reach out to GC to introduce flooring capabilities',
        });
      } catch (e) {
        console.log(`Project investigation failed: ${e?.message || e}`);
      }
    }

    // Link all nodes to the lead
    const nodeIds = nodes.map(n => n.id);
    await svc.entities.ScrapedLead.update(lead_id, {
      enrichment_status: 'enriched',
      enriched_at: new Date().toISOString(),
      related_entities: nodeIds,
      lead_graph_id: nodes[0]?.id || '',
    });

    return Response.json({
      ok: true,
      lead_id,
      nodes_created: nodes.length,
      nodes: nodes.map(n => ({ id: n.id, type: n.node_type, name: n.name })),
    });
  } catch (error) {
    console.error('enrichHotLead error', error?.message || error);
    // Mark enrichment as failed
    try {
      const svc = createClientFromRequest(req).asServiceRole;
      if (body.lead_id) {
        await svc.entities.ScrapedLead.update(body.lead_id, { enrichment_status: 'failed' });
      }
    } catch {}
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}