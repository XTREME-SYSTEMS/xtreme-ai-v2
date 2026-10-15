import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

// architectScan — The AI Chief Architect.
//
// This is the "brain" that is designed to be 100x smarter, 100x faster, and
// 10 steps ahead of the human operator. It:
//
// 1. Analyzes the current system state (recent builds, top ideas, open
//    optimizations, alerts, recent actions) to understand what exists.
// 2. Searches the web for emerging AI capabilities, new technologies, and
//    competitive landscape developments.
// 3. Uses Claude Opus (highest reasoning quality) to synthesize everything
//    into visionary, actionable proposals across 6 categories:
//    - what_to_build: new products/features that would 10x the business
//    - how_to_build: better architectural approaches
//    - new_technology: emerging tech the operator should adopt
//    - ai_capability: AI tools/models not yet integrated
//    - integration: third-party services/APIs to connect
//    - strategic_direction: long-term vision and positioning
// 4. Saves each proposal as an ArchitectProposal record for the operator
//    to review and act on.
//
// Called by:
// - The "Architect Daily Scan" workflow (every 24 hours)
// - Manually from the Architect dashboard

const SYSTEM_DESCRIPTION = `Lead Gen Near You is an AI-powered autonomous marketing engine that scales local lead generation by automating site deployment, GSC indexing, citation building, and backlink outreach for high-volume niche portfolios. The platform includes:

- Vision Cortex: AI-assisted idea discovery engine that scrapes Reddit, Product Hunt, Hacker News, and AI directories via Browserbase cloud browser, scores ideas against the YC 10-key-question framework, classifies "fully autonomous systems," and provisions top ideas into the Auto Builder.
- Auto Builder: Autonomous web app generation pipeline — architecture → data model → UI system → codegen → deploy → system review. Supports marketing sites, web apps, e-commerce, and platforms.
- Client Portal: Approval-gated workflow for clients to review and approve generated assets (brand, content, logo, website, social, video).
- SEO Engine: Autonomous site deployment, GSC indexing, citation building, backlink outreach, SERP competitor cloning, rank monitoring.
- Autonomous System: Self-healing infrastructure with error classification, exponential backoff retries, system self-reflection, and system optimization findings.
- CRM + Billing: Contacts, accounts, deals, activities, campaigns, quotes, invoices, expenses, e-sign documents.
- Governance: Green (automatic) / Yellow (preview) / Red (operator approval) tiers for all autonomous actions.`;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { triggered_by = 'manual', max_proposals = 15 } = body;

    const logs: string[] = [`[${new Date().toISOString()}] AI Chief Architect scan started (${triggered_by})`];

    // ── Phase 1: Gather current system state ──
    logs.push(`[${new Date().toISOString()}] Gathering system state...`);

    const [recentBuilds, topIdeas, openOptimizations, openAlerts, recentReceipts, autonomousIdeas] = await Promise.all([
      base44.asServiceRole.entities.AutoBuild.list('-created_date', 10).catch(() => []),
      base44.asServiceRole.entities.VisionCortexIdea.filter({ status: 'top_10' }, '-top_10_rank', 10).catch(() => []),
      base44.asServiceRole.entities.SystemOptimization.filter({ status: 'open' }, '-created_date', 10).catch(() => []),
      base44.asServiceRole.entities.SystemAlert.filter({ status: 'open' }, '-created_date', 10).catch(() => []),
      base44.asServiceRole.entities.Receipt.list('-created_date', 15).catch(() => []),
      base44.asServiceRole.entities.VisionCortexIdea.filter({ system_category: 'fully_autonomous' }, '-created_date', 10).catch(() => []),
    ]);

    const systemContext = {
      system_description: SYSTEM_DESCRIPTION,
      recent_builds: (recentBuilds as any[]).map(b => ({
        name: b.business_name,
        type: b.product_type,
        status: b.status,
        step: b.current_step,
        industry: b.industry,
      })),
      top_ideas: (topIdeas as any[]).map(i => ({
        title: i.title,
        industry: i.industry,
        yc_score: i.yc_scores?.overall,
        autonomous_score: i.yc_scores?.autonomous_overall,
        system_category: i.system_category,
      })),
      autonomous_systems_found: (autonomousIdeas as any[]).map(i => ({
        title: i.title,
        autonomous_overall: i.autonomous_scores?.autonomous_overall,
        automation_level: i.autonomous_scores?.automation_level,
        speed_to_profit: i.autonomous_scores?.speed_to_profit,
        end_user_value: i.autonomous_scores?.end_user_value,
      })),
      open_optimizations: (openOptimizations as any[]).map(o => ({
        title: o.title,
        category: o.category,
        severity: o.severity,
        area: o.area,
      })),
      open_alerts: (openAlerts as any[]).map(a => ({
        type: a.alert_type,
        message: a.message,
        severity: a.severity,
      })),
      recent_actions: (recentReceipts as any[]).map(r => ({
        agent: r.agent_or_workflow,
        action: r.action,
        status: r.status,
      })),
    };

    logs.push(`[${new Date().toISOString()}] System state gathered — ${systemContext.recent_builds.length} builds, ${systemContext.top_ideas.length} top ideas, ${systemContext.open_optimizations.length} optimizations, ${systemContext.open_alerts.length} alerts`);

    // ── Phase 2: Generate visionary proposals ──
    logs.push(`[${new Date().toISOString()}] Generating proposals with Claude Opus + web search...`);

    const prompt = `You are an AI Chief Architect — 100x smarter and 10 steps ahead of the human operator. Proactively surface ideas, technologies, and strategic directions they should act on NOW.

SYSTEM: ${SYSTEM_DESCRIPTION.slice(0, 800)}

CURRENT STATE: ${JSON.stringify({
      builds: systemContext.recent_builds.slice(0, 5),
      top_ideas: systemContext.top_ideas.slice(0, 5),
      autonomous: systemContext.autonomous_systems_found.slice(0, 3),
      open_issues: systemContext.open_optimizations.slice(0, 5),
    })}

Generate ${max_proposals} visionary proposals across 6 categories:
1. what_to_build — new products/features that 10x the business
2. how_to_build — better architecture/approaches
3. new_technology — emerging tech the operator doesn't know about
4. ai_capability — AI tools/models not yet integrated
5. integration — third-party APIs/services to connect
6. strategic_direction — long-term vision

For each: be specific and actionable. Name real tools. Include tech references with URLs, implementation steps, impact/effort scores (0-100), priority (critical/high/medium/low), time horizon. Explain the competitive advantage.

Search the web for the LATEST AI capabilities and emerging technologies. Be bold and cutting-edge.`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          proposals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Short, punchy title' },
                description: { type: 'string', description: '2-3 sentence description of what this is and why it matters' },
                proposal_type: { type: 'string', enum: ['what_to_build', 'how_to_build', 'new_technology', 'ai_capability', 'integration', 'strategic_direction'] },
                rationale: { type: 'string', description: 'Why this matters — the reasoning' },
                current_gap: { type: 'string', description: 'What is missing or suboptimal today' },
                proposed_solution: { type: 'string', description: 'The concrete action to take' },
                impact_score: { type: 'number', description: '0-100' },
                effort_score: { type: 'number', description: '0-100 (lower = easier)' },
                priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                time_horizon: { type: 'string', enum: ['immediate', 'short_term', 'medium_term', 'long_term'] },
                technology_references: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      url: { type: 'string' },
                      description: { type: 'string' }
                    }
                  }
                },
                implementation_steps: { type: 'array', items: { type: 'string' } },
                estimated_impact: { type: 'string' },
                competitive_advantage: { type: 'string' }
              },
              required: ['title', 'description', 'proposal_type', 'rationale', 'proposed_solution', 'impact_score', 'effort_score', 'priority', 'time_horizon']
            }
          }
        },
        required: ['proposals']
      },
      model: 'gemini_3_1_pro',
    });

    const proposals = (response as any)?.proposals || [];
    logs.push(`[${new Date().toISOString()}] LLM generated ${proposals.length} proposals`);

    // ── Phase 3: Save proposals (with deduplication) ──
    const scanId = `architect_${Date.now()}`;
    const saved: any[] = [];

    // Fetch existing proposal titles from the last 48 hours to dedup
    const existingProposals = await base44.asServiceRole.entities.ArchitectProposal
      .list('-created_date', 200).catch(() => []);
    const existingKeys = new Set(
      (existingProposals as any[]).map((p) => `${p.title}::${p.proposal_type}`)
    );
    const dedupCutoff = Date.now() - 48 * 60 * 60 * 1000;
    const recentKeys = new Set(
      (existingProposals as any[])
        .filter((p) => new Date(p.created_date).getTime() > dedupCutoff)
        .map((p) => `${p.title}::${p.proposal_type}`)
    );

    for (const proposal of proposals) {
      const key = `${proposal.title}::${proposal.proposal_type}`;
      if (recentKeys.has(key)) {
        logs.push(`[${new Date().toISOString()}] Skipping duplicate proposal: "${proposal.title}"`);
        continue;
      }
      try {
        const record = await base44.asServiceRole.entities.ArchitectProposal.create({
          title: proposal.title,
          description: proposal.description,
          proposal_type: proposal.proposal_type,
          rationale: proposal.rationale || '',
          current_gap: proposal.current_gap || '',
          proposed_solution: proposal.proposed_solution || '',
          impact_score: Math.max(0, Math.min(100, Math.round(proposal.impact_score || 0))),
          effort_score: Math.max(0, Math.min(100, Math.round(proposal.effort_score || 0))),
          priority: proposal.priority || 'medium',
          time_horizon: proposal.time_horizon || 'medium_term',
          technology_references: proposal.technology_references || [],
          implementation_steps: proposal.implementation_steps || [],
          estimated_impact: proposal.estimated_impact || '',
          competitive_advantage: proposal.competitive_advantage || '',
          status: 'pending',
          scan_id: scanId,
          logs: [`[${new Date().toISOString()}] Generated by AI Chief Architect (${triggered_by})`],
        });
        saved.push(record);
      } catch (saveErr: any) {
        logs.push(`[${new Date().toISOString()}] Error saving proposal "${proposal.title}": ${saveErr?.message || saveErr}`);
      }
    }

    logs.push(`[${new Date().toISOString()}] Architect scan complete — ${saved.length} proposals saved`);

    // Record a receipt
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: 'architectScan',
        action: 'architect_scan',
        entity_type: 'ArchitectProposal',
        inputs: JSON.stringify({ triggered_by, max_proposals }).slice(0, 4000),
        outputs: JSON.stringify({ scan_id: scanId, proposals_generated: saved.length }).slice(0, 4000),
        status: 'success',
        evidence: `AI Chief Architect generated ${saved.length} proposals (${scanId})`,
      });
    } catch {}

    return Response.json({
      ok: true,
      scan_id: scanId,
      proposals_generated: saved.length,
      proposals: saved.map(p => ({
        id: p.id,
        title: p.title,
        type: p.proposal_type,
        priority: p.priority,
        impact: p.impact_score,
      })),
      logs,
    });
  } catch (error) {
    console.error('architectScan error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}