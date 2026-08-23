import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// promoteIdeaToAutoBuild — Takes an IdeaCandidate and creates an AutoBuild
// record from it, seeding the profile with the idea's data. The idea is then
// linked to the AutoBuild and its status is updated to 'promoted'.
//
// This is the bridge between the discovery engine and the AutoBuilder pipeline:
// idea → AutoBuild → architecture → data model → UI system → codegen → deploy
// → Vercel/Supabase/Drive/Git → email link to preview.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { idea_id, auto_advance = false } = body;

    if (!idea_id) return Response.json({ error: 'idea_id is required' }, { status: 400 });

    // Fetch the idea
    const idea = await base44.entities.IdeaCandidate.get(idea_id);
    if (!idea) return Response.json({ error: 'Idea not found' }, { status: 404 });

    if (idea.status === 'promoted' && idea.promoted_to_autobuild_id) {
      return Response.json({
        error: 'Idea already promoted',
        autobuild_id: idea.promoted_to_autobuild_id,
      }, { status: 409 });
    }

    // Create the AutoBuild record from the idea
    const build = await base44.entities.AutoBuild.create({
      business_name: idea.title,
      industry: idea.industry || 'general',
      sub_industry: idea.sub_industry || '',
      product_type: idea.product_type || 'web_app',
      profile: {
        product_description: idea.description,
        target_audience: idea.target_audience || '',
        key_features: idea.keywords || [],
        services: idea.keywords || [],
        business_stage: 'new',
      },
      current_step: idea.product_type === 'marketing_site' ? 'profile' : 'profile',
      status: 'queued',
      auto_advance: auto_advance,
      visited_steps: [],
      logs: [
        `[${new Date().toISOString()}] AutoBuild created from IdeaCandidate ${idea.id}`,
        `[${new Date().toISOString()}] Idea: ${idea.title}`,
        `[${new Date().toISOString()}] Source: ${idea.source}`,
        `[${new Date().toISOString()}] Overall score: ${idea.scores?.overall || 'unscored'}`,
      ],
    });

    // Update the idea to link it to the AutoBuild
    await base44.entities.IdeaCandidate.update(idea_id, {
      status: 'promoted',
      promoted_to_autobuild_id: build.id,
      logs: [...(idea.logs || []), `[${new Date().toISOString()}] Promoted to AutoBuild ${build.id}`],
    });

    // Create a Receipt for auditability
    try {
      await base44.entities.Receipt.create({
        agent_or_workflow: 'promoteIdeaToAutoBuild',
        action: 'promote_idea',
        entity_type: 'IdeaCandidate',
        entity_id: idea_id,
        inputs: JSON.stringify({ idea_id, auto_advance }).slice(0, 4000),
        outputs: JSON.stringify({ autobuild_id: build.id }).slice(0, 4000),
        status: 'success',
        evidence: `Idea "${idea.title}" promoted to AutoBuild ${build.id}`,
      });
    } catch {}

    return Response.json({
      ok: true,
      autobuild_id: build.id,
      idea_id: idea_id,
      message: `Idea "${idea.title}" promoted to AutoBuilder. Navigate to the Auto Builder to start the pipeline.`,
    });
  } catch (error) {
    console.error('promoteIdeaToAutoBuild error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}