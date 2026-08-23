import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import { scoreIdeaYC, generateExhaustiveSummary } from '../../shared/visionCortexFramework.ts';

// visionCortexValidate — Phase 2 of the Vision Cortex daily cycle.
// Takes all recently discovered VisionCortexIdea records (status=discovered),
// scores each against the YC 10-key-question framework + visionary principles,
// filters out tarpit ideas, ranks by overall score, selects the top 10,
// and generates exhaustive build summaries for each of the top 10.
//
// Called by:
// - The "Vision Cortex Daily Cycle" workflow (after visionCortexDiscover)
// - Manually from the Vision Cortex dashboard
//
// Flow: fetch discovered ideas → score each with YC framework → rank → pick top 10 → generate exhaustive summaries
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const {
      run_id,
      top_n = 10,
      min_score = 40,
      generate_summaries = true,
    } = body;

    // Fetch discovered ideas — either from a specific run or all unvalidated
    let ideas: any[];
    if (run_id) {
      ideas = await base44.asServiceRole.entities.VisionCortexIdea.filter({
        discovery_run_id: run_id,
        status: 'discovered',
      }, '-created_date', 100);
    } else {
      ideas = await base44.asServiceRole.entities.VisionCortexIdea.filter({
        status: 'discovered',
      }, '-created_date', 100);
    }

    if (ideas.length === 0) {
      return Response.json({
        ok: true,
        message: 'No discovered ideas to validate — run visionCortexDiscover first',
        validated: 0,
        top_10: [],
      });
    }

    const logs: string[] = [`[${new Date().toISOString()}] Vision Cortex validation started — ${ideas.length} ideas to score`];

    // Phase 1: Score each idea with the YC framework
    const scoredIdeas: any[] = [];
    for (const idea of ideas) {
      try {
        const scoring = await scoreIdeaYC(base44, {
          title: idea.title,
          description: idea.description,
          problem_statement: idea.problem_statement,
          proposed_solution: idea.proposed_solution,
          target_audience: idea.target_audience,
          industry: idea.industry,
          sub_industry: idea.sub_industry,
          source: idea.source,
          source_snippet: idea.source_snippet,
        });

        // Skip tarpit ideas — they look good but structurally never work
        if (scoring.is_tarpit) {
          logs.push(`[${new Date().toISOString()}] TAR PIT detected: "${idea.title}" — ${scoring.tarpit_warning}`);
          await base44.asServiceRole.entities.VisionCortexIdea.update(idea.id, {
            status: 'rejected',
            yc_scores: scoring.yc_scores,
            score_breakdown: `${scoring.score_breakdown}\n\nTAR PIT WARNING: ${scoring.tarpit_warning}`,
            logs: [...(idea.logs || []), `[${new Date().toISOString()}] Rejected — tarpit idea: ${scoring.tarpit_warning}`],
          });
          continue;
        }

        // Skip ideas below minimum score
        if (scoring.yc_scores.overall < min_score) {
          logs.push(`[${new Date().toISOString()}] Skipped "${idea.title}" — score ${scoring.yc_scores.overall} below threshold ${min_score}`);
          await base44.asServiceRole.entities.VisionCortexIdea.update(idea.id, {
            status: 'archived',
            yc_scores: scoring.yc_scores,
            score_breakdown: scoring.score_breakdown,
            logs: [...(idea.logs || []), `[${new Date().toISOString()}] Archived — score ${scoring.yc_scores.overall} below threshold`],
          });
          continue;
        }

        // Update the idea with scores
        const updated = await base44.asServiceRole.entities.VisionCortexIdea.update(idea.id, {
          status: 'validated',
          yc_scores: scoring.yc_scores,
          score_breakdown: scoring.score_breakdown,
          logs: [...(idea.logs || []), `[${new Date().toISOString()}] Validated — YC overall score: ${scoring.yc_scores.overall}`],
        });

        scoredIdeas.push({ ...updated, _yc_scores: scoring.yc_scores });
        logs.push(`[${new Date().toISOString()}] Scored "${idea.title}" — overall: ${scoring.yc_scores.overall}`);
      } catch (scoreErr: any) {
        logs.push(`[${new Date().toISOString()}] Error scoring "${idea.title}": ${scoreErr?.message || scoreErr}`);
      }
    }

    logs.push(`[${new Date().toISOString()}] Scoring complete — ${scoredIdeas.length} ideas passed validation`);

    // Phase 2: Rank by overall YC score and pick top N
    scoredIdeas.sort((a, b) => (b._yc_scores?.overall || 0) - (a._yc_scores?.overall || 0));
    const topIdeas = scoredIdeas.slice(0, top_n);

    if (topIdeas.length === 0) {
      return Response.json({
        ok: true,
        message: 'No ideas passed validation threshold',
        validated: scoredIdeas.length,
        top_10: [],
      });
    }

    // Phase 3: Generate exhaustive summaries for top N
    if (generate_summaries) {
      for (let i = 0; i < topIdeas.length; i++) {
        const idea = topIdeas[i];
        try {
          logs.push(`[${new Date().toISOString()}] Generating exhaustive summary for #${i + 1}: "${idea.title}"`);

          const summary = await generateExhaustiveSummary(base44, idea);

          await base44.asServiceRole.entities.VisionCortexIdea.update(idea.id, {
            is_top_10: true,
            top_10_rank: i + 1,
            exhaustive_summary: summary,
            status: 'top_10',
            logs: [...(idea.logs || []), `[${new Date().toISOString()}] Selected as top ${top_n} idea (rank #${i + 1}) — exhaustive summary generated`],
          });

          logs.push(`[${new Date().toISOString()}] Summary complete for #${i + 1}: "${idea.title}"`);
        } catch (summaryErr: any) {
          logs.push(`[${new Date().toISOString()}] Error generating summary for "${idea.title}": ${summaryErr?.message || summaryErr}`);
          // Still mark as top 10 even if summary fails
          await base44.asServiceRole.entities.VisionCortexIdea.update(idea.id, {
            is_top_10: true,
            top_10_rank: i + 1,
            status: 'top_10',
            logs: [...(idea.logs || []), `[${new Date().toISOString()}] Selected as top ${top_n} (rank #${i + 1}) — summary generation failed`],
          });
        }
      }
    } else {
      // Just mark as top 10 without summaries
      for (let i = 0; i < topIdeas.length; i++) {
        const idea = topIdeas[i];
        await base44.asServiceRole.entities.VisionCortexIdea.update(idea.id, {
          is_top_10: true,
          top_10_rank: i + 1,
          status: 'top_10',
        });
      }
    }

    return Response.json({
      ok: true,
      validated: scoredIdeas.length,
      top_n: topIdeas.length,
      top_10: topIdeas.map((idea, i) => ({
        id: idea.id,
        rank: i + 1,
        title: idea.title,
        overall_score: idea._yc_scores?.overall || 0,
        industry: idea.industry,
        source: idea.source,
      })),
      logs,
    });
  } catch (error) {
    console.error('visionCortexValidate error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}