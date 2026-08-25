import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

// visionCortexProvision — Phase 3 of the Vision Cortex daily cycle.
// Takes a top 10 VisionCortexIdea and provisions it into the AutoBuilder
// pipeline — creates an AutoBuild record seeded with the idea's exhaustive
// summary data (architecture, data systems, brand strategy, etc.) so the
// Auto Builder can autonomously generate architecture → data model → UI →
// code → deploy.
//
// Also saves the exhaustive summary to Google Drive (via connector) for
// team reference and creates a Receipt for auditability.
//
// Called by:
// - The "Vision Cortex Daily Cycle" workflow (provisions the #1 idea)
// - Manually from the Vision Cortex dashboard
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { idea_id, auto_advance = true } = body;

    if (!idea_id) return Response.json({ error: 'idea_id is required' }, { status: 400 });

    // Fetch the idea
    const idea = await base44.asServiceRole.entities.VisionCortexIdea.get(idea_id);
    if (!idea) return Response.json({ error: 'Idea not found' }, { status: 404 });

    if (idea.status === 'provisioned' && idea.provisioned_to_autobuild_id) {
      return Response.json({
        error: 'Idea already provisioned',
        autobuild_id: idea.provisioned_to_autobuild_id,
      }, { status: 409 });
    }

    const summary = idea.exhaustive_summary || {};

    // Create the AutoBuild record from the idea + exhaustive summary
    const build = await base44.asServiceRole.entities.AutoBuild.create({
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
        tagline: summary.brand_strategy ? summary.brand_strategy.split('\n')[0] : '',
      },
      current_step: 'profile',
      status: 'queued',
      auto_advance: auto_advance,
      visited_steps: [],
      logs: [
        `[${new Date().toISOString()}] AutoBuild created from Vision Cortex idea ${idea.id}`,
        `[${new Date().toISOString()}] Idea: ${idea.title}`,
        `[${new Date().toISOString()}] Source: ${idea.source}`,
        `[${new Date().toISOString()}] YC Overall Score: ${idea.yc_scores?.overall || 'unscored'}`,
        `[${new Date().toISOString()}] Top 10 Rank: #${idea.top_10_rank || 'N/A'}`,
        summary.how_it_works ? `[${new Date().toISOString()}] How it works: ${summary.how_it_works.slice(0, 200)}` : '',
        summary.architecture_overview ? `[${new Date().toISOString()}] Architecture: ${summary.architecture_overview.slice(0, 200)}` : '',
      ],
    });

    // Update the idea to link it to the AutoBuild
    await base44.asServiceRole.entities.VisionCortexIdea.update(idea_id, {
      status: 'provisioned',
      provisioned_to_autobuild_id: build.id,
      logs: [...(idea.logs || []), `[${new Date().toISOString()}] Provisioned to AutoBuild ${build.id}`],
    });

    // Email the exhaustive summary to the operator for team reference
    try {
      const driveContent = `# Vision Cortex: ${idea.title}

## Idea Overview
**Industry:** ${idea.industry || 'General'}
**Sub-Industry:** ${idea.sub_industry || 'General'}
**Product Type:** ${idea.product_type || 'web_app'}
**Source:** ${idea.source || 'N/A'}
**Source URL:** ${idea.source_url || 'N/A'}
**YC Overall Score:** ${idea.yc_scores?.overall || 'N/A'}
**Top 10 Rank:** #${idea.top_10_rank || 'N/A'}

## Problem Statement
${idea.problem_statement || 'N/A'}

## Proposed Solution
${idea.proposed_solution || 'N/A'}

## Target Audience
${idea.target_audience || 'N/A'}

## YC Framework Scores
- Founder Market Fit: ${idea.yc_scores?.founder_market_fit || 'N/A'}/100
- Market Size: ${idea.yc_scores?.market_size || 'N/A'}/100
- Problem Acuity: ${idea.yc_scores?.problem_acuity || 'N/A'}/100
- Competition Insight: ${idea.yc_scores?.competition_insight || 'N/A'}/100
- Personal Demand: ${idea.yc_scores?.personal_demand || 'N/A'}/100
- Recently Possible: ${idea.yc_scores?.recently_possible || 'N/A'}/100
- Proxy Validation: ${idea.yc_scores?.proxy_validation || 'N/A'}/100
- Scalability: ${idea.yc_scores?.scalability || 'N/A'}/100
- Technical Feasibility: ${idea.yc_scores?.technical_feasibility || 'N/A'}/100
- Autonomous Build Potential: ${idea.yc_scores?.autonomous_build_potential || 'N/A'}/100
- **Overall: ${idea.yc_scores?.overall || 'N/A'}/100**

## Score Breakdown
${idea.score_breakdown || 'N/A'}

## How It Works
${summary.how_it_works || 'N/A'}

## How To Build
${summary.how_to_build || 'N/A'}

## Possible Complications
${summary.possible_complications || 'N/A'}

## Complication Prevention
${summary.complication_prevention || 'N/A'}

## Financial Cost
${summary.financial_cost || 'N/A'}

## Gross Income Potential
${summary.gross_income_potential || 'N/A'}

## Net Income Potential
${summary.net_income_potential || 'N/A'}

## Niche
${summary.niche || 'N/A'}

## Problems Solved
${summary.problems_solved || 'N/A'}

## AI Usage Plan
${summary.ai_usage_plan || 'N/A'}

## Autonomous Build Plan
${summary.autonomous_build_plan || 'N/A'}

## Architecture Overview
${summary.architecture_overview || 'N/A'}

## Data Systems Needed
${summary.data_systems_needed || 'N/A'}

## Brand Strategy
${summary.brand_strategy || 'N/A'}

## Go To Market
${summary.go_to_market || 'N/A'}

## Competitors
${(idea.competitors || []).join(', ') || 'N/A'}

## Keywords
${(idea.keywords || []).join(', ') || 'N/A'}

## Monetization Model
${idea.monetization_model || 'N/A'}

---
*Generated by Vision Cortex — AI-Assisted Idea Discovery & Validation Engine*
*AutoBuild ID: ${build.id}*
`;

      // Save to Drive via connector
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `Vision Cortex: ${idea.title} — Provisioned to Auto Builder`,
        body: driveContent,
      });
    } catch (driveErr: any) {
      console.error('Drive save failed (non-critical):', driveErr?.message || driveErr);
    }

    // Create a Receipt for auditability
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: 'visionCortexProvision',
        action: 'provision_idea',
        entity_type: 'VisionCortexIdea',
        entity_id: idea_id,
        inputs: JSON.stringify({ idea_id, auto_advance }).slice(0, 4000),
        outputs: JSON.stringify({ autobuild_id: build.id, title: idea.title }).slice(0, 4000),
        status: 'success',
        evidence: `Vision Cortex idea "${idea.title}" (rank #${idea.top_10_rank}) provisioned to AutoBuild ${build.id}`,
      });
    } catch {}

    return Response.json({
      ok: true,
      autobuild_id: build.id,
      idea_id: idea_id,
      title: idea.title,
      message: `Idea "${idea.title}" provisioned to Auto Builder. The build pipeline will start automatically.`,
    });
  } catch (error) {
    console.error('visionCortexProvision error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}