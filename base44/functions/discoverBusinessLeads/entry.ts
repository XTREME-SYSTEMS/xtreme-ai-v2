import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { discoverBadWebsites, scoreIdea } from '../../shared/ideaScoring.ts';
import { checkWebsiteHealth } from '../../shared/browserbaseScrape.ts';

// discoverBusinessLeads — Autonomous business lead discovery engine.
// Searches for businesses with bad websites, poor online presence, or technical
// failures. For each business, checks the actual website health via Browserbase/fetch,
// calculates an opportunity score, and saves as BusinessLead records.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const {
      industry = 'home services',
      sub_industry = '',
      location = '',
      max_results = 10,
      check_websites = true,
      triggered_by = 'manual',
    } = body;

    // Create a DiscoveryRun record
    const run = await base44.entities.DiscoveryRun.create({
      run_type: 'business_lead_discovery',
      source: 'google_search',
      industry,
      sub_industry,
      search_criteria: {
        keywords: [industry, sub_industry, location].filter(Boolean),
        max_results,
      },
      status: 'running',
      started_at: new Date().toISOString(),
      triggered_by,
      logs: [`[${new Date().toISOString()}] Business lead discovery started — ${industry}${sub_industry ? '/' + sub_industry : ''}${location ? ' in ' + location : ''}`],
    });

    try {
      // Phase 1: Discover businesses with bad websites via web search
      const businesses = await discoverBadWebsites(base44, {
        industry,
        sub_industry,
        location,
        max_results,
      });

      run.logs.push(`[${new Date().toISOString()}] Found ${businesses.length} business candidates from web search`);

      // Phase 2: Check actual website health (if URLs are available)
      const savedLeads = [];
      for (const biz of businesses) {
        try {
          let issues = biz.issues || [];
          let websiteScore = 50; // default neutral

          // If the business has a website URL, check its actual health
          if (check_websites && biz.website_url) {
            try {
              const health = await checkWebsiteHealth(biz.website_url);
              // Merge AI-detected issues with actual technical checks
              const actualIssueTypes = new Set(health.issues.map(i => i.type));
              for (const issue of health.issues) {
                if (!issues.some(i => i.type === issue.type)) {
                  issues.push(issue);
                }
              }
              // Calculate website score: start at 100, deduct per issue
              websiteScore = 100;
              for (const issue of issues) {
                if (issue.severity === 'critical') websiteScore -= 25;
                else if (issue.severity === 'major') websiteScore -= 15;
                else websiteScore -= 5;
              }
              websiteScore = Math.max(0, websiteScore);

              run.logs.push(`[${new Date().toISOString()}] Checked ${biz.website_url} — score ${websiteScore}, ${issues.length} issues`);
            } catch (healthErr) {
              run.logs.push(`[${new Date().toISOString()}] Website health check failed for ${biz.website_url}: ${healthErr?.message || healthErr}`);
            }
          } else if (!biz.website_url) {
            // No website at all — worst score
            websiteScore = 10;
            issues.unshift({ type: 'no_website', severity: 'critical', description: 'Business has no website' });
          }

          // Calculate opportunity score: worse website + valuable industry = higher opportunity
          const opportunityScore = Math.round((100 - websiteScore) * 0.6 + (issues.filter(i => i.severity === 'critical').length * 10));

          const saved = await base44.entities.BusinessLead.create({
            business_name: biz.business_name,
            website_url: biz.website_url || '',
            industry: biz.industry || industry,
            sub_industry: biz.sub_industry || sub_industry,
            location: biz.location || location,
            phone: biz.phone || '',
            email: biz.email || '',
            address: biz.address || '',
            issues,
            website_score: websiteScore,
            opportunity_score: Math.min(100, opportunityScore),
            status: 'new',
            discovery_run_id: run.id,
            suggested_services: biz.suggested_services || [],
            competitor_analysis: biz.competitor_analysis || '',
            logs: [`[${new Date().toISOString()}] Created from discovery run ${run.id}`],
          });

          savedLeads.push(saved);
        } catch (bizErr) {
          run.logs.push(`[${new Date().toISOString()}] Error saving business lead "${biz.business_name}": ${bizErr?.message || bizErr}`);
        }
      }

      // Update the run record
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'complete',
        items_found: savedLeads.length,
        completed_at: new Date().toISOString(),
        logs: [...run.logs, `[${new Date().toISOString()}] Business lead discovery complete — ${savedLeads.length} leads saved`],
      });

      return Response.json({
        ok: true,
        run_id: run.id,
        businesses_found: businesses.length,
        leads_saved: savedLeads.length,
        leads: savedLeads.map((l: any) => ({
          id: l.id,
          business_name: l.business_name,
          website_score: l.website_score,
          opportunity_score: l.opportunity_score,
          issues_count: l.issues?.length || 0,
        })),
      });
    } catch (discoverErr) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'failed',
        error: discoverErr?.message || 'Discovery failed',
        completed_at: new Date().toISOString(),
        logs: [...run.logs, `[${new Date().toISOString()}] ERROR: ${discoverErr?.message || discoverErr}`],
      });
      throw discoverErr;
    }
  } catch (error) {
    console.error('discoverBusinessLeads error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}