import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { discoverIdeasFromWeb, scoreIdea } from '../../shared/ideaScoring.ts';

// runDiscoveryScrape — Autonomous idea discovery engine.
// Searches the web for problems, trends, and opportunities, extracts ideas,
// scores each on profitability/scalability/niche/usability/competition/trend,
// and saves them as IdeaCandidate records.
//
// Can be triggered manually (with search criteria) or by a scheduled workflow.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const {
      industry,
      sub_industry,
      search_type = 'problems',
      max_results = 10,
      auto_score = true,
      min_score = 0,
      triggered_by = 'manual',
    } = body;

    // Create a DiscoveryRun record
    const run = await base44.entities.DiscoveryRun.create({
      run_type: 'idea_discovery',
      source: search_type,
      industry: industry || 'general',
      sub_industry: sub_industry || '',
      search_criteria: {
        keywords: [industry, sub_industry].filter(Boolean),
        max_results,
        min_score,
      },
      status: 'running',
      started_at: new Date().toISOString(),
      triggered_by,
      logs: [`[${new Date().toISOString()}] Discovery run started — ${search_type} search for ${industry || 'general'}${sub_industry ? '/' + sub_industry : ''}`],
    });

    try {
      // Phase 1: Discover ideas from the web
      const ideas = await discoverIdeasFromWeb(base44, {
        industry,
        sub_industry,
        search_type,
        max_results,
      });

      run.logs.push(`[${new Date().toISOString()}] Discovered ${ideas.length} raw ideas from web search`);

      // Phase 2: Score each idea (if auto_score is enabled)
      const savedIdeas = [];
      for (const idea of ideas) {
        try {
          let scores = null;
          let scoreBreakdown = '';
          let monetizationModel = 'subscription';
          let competitors = idea.competitors || [];
          let keywords = idea.keywords || [];

          if (auto_score) {
            const scoring = await scoreIdea(base44, {
              title: idea.title,
              description: idea.description,
              problem_statement: idea.problem_statement,
              proposed_solution: idea.proposed_solution,
              target_audience: idea.target_audience,
              industry: idea.industry || industry,
              sub_industry: idea.sub_industry || sub_industry,
              source: idea.source,
            });
            scores = scoring.scores;
            scoreBreakdown = scoring.score_breakdown;
            monetizationModel = scoring.monetization_model;
            competitors = scoring.competitors;
            keywords = scoring.keywords;
          }

          // Skip ideas below min_score
          if (auto_score && scores && scores.overall < min_score) {
            run.logs.push(`[${new Date().toISOString()}] Skipped "${idea.title}" — score ${scores.overall} below threshold ${min_score}`);
            continue;
          }

          const saved = await base44.entities.IdeaCandidate.create({
            title: idea.title,
            description: idea.description,
            problem_statement: idea.problem_statement || '',
            proposed_solution: idea.proposed_solution || '',
            target_audience: idea.target_audience || '',
            source: idea.source || search_type,
            source_url: idea.source_url || '',
            source_snippet: idea.source_snippet || '',
            industry: idea.industry || industry || 'general',
            sub_industry: idea.sub_industry || sub_industry || '',
            product_type: idea.product_type || 'web_app',
            scores: scores || {},
            score_breakdown: scoreBreakdown,
            status: auto_score ? 'scored' : 'new',
            discovery_run_id: run.id,
            keywords,
            competitors,
            monetization_model: monetizationModel,
            logs: [`[${new Date().toISOString()}] Created from discovery run ${run.id}`],
          });

          savedIdeas.push(saved);
        } catch (ideaErr) {
          run.logs.push(`[${new Date().toISOString()}] Error saving idea "${idea.title}": ${ideaErr?.message || ideaErr}`);
        }
      }

      // Update the run record
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'complete',
        items_found: savedIdeas.length,
        completed_at: new Date().toISOString(),
        logs: [...run.logs, `[${new Date().toISOString()}] Discovery run complete — ${savedIdeas.length} ideas saved`],
      });

      return Response.json({
        ok: true,
        run_id: run.id,
        ideas_discovered: ideas.length,
        ideas_saved: savedIdeas.length,
        ideas: savedIdeas.map((i: any) => ({
          id: i.id,
          title: i.title,
          overall_score: i.scores?.overall || 0,
          status: i.status,
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
    console.error('runDiscoveryScrape error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}