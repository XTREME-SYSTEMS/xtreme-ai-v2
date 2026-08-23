import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { scoreIdea } from '../../shared/ideaScoring.ts';

// scoreIdeaCandidate — Re-score an individual IdeaCandidate using the AI scoring
// engine. Called from the UI when an admin wants to re-evaluate an idea.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { idea_id } = body;

    if (!idea_id) return Response.json({ error: 'idea_id is required' }, { status: 400 });

    const idea = await base44.entities.IdeaCandidate.get(idea_id);
    if (!idea) return Response.json({ error: 'Idea not found' }, { status: 404 });

    const scoring = await scoreIdea(base44, {
      title: idea.title,
      description: idea.description,
      problem_statement: idea.problem_statement,
      proposed_solution: idea.proposed_solution,
      target_audience: idea.target_audience,
      industry: idea.industry,
      sub_industry: idea.sub_industry,
      source: idea.source,
    });

    await base44.entities.IdeaCandidate.update(idea_id, {
      scores: scoring.scores,
      score_breakdown: scoring.score_breakdown,
      monetization_model: scoring.monetization_model,
      competitors: scoring.competitors,
      keywords: scoring.keywords,
      status: 'scored',
      logs: [...(idea.logs || []), `[${new Date().toISOString()}] Re-scored — overall: ${scoring.scores.overall}`],
    });

    return Response.json({
      ok: true,
      idea_id,
      scores: scoring.scores,
      score_breakdown: scoring.score_breakdown,
      monetization_model: scoring.monetization_model,
      competitors: scoring.competitors,
      keywords: scoring.keywords,
    });
  } catch (error) {
    console.error('scoreIdeaCandidate error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}