import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Orchestrator: auto-launches ALL acquired domains in the portfolio.
// For each acquired domain: creates RankEngine campaign, submits to GSC,
// generates keywords/pages/citations — zero manual clicks required.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Get all acquired domains that haven't been launched yet
    const acquired = await svc.entities.DomainPortfolio.filter(
      { status: 'acquired' },
      '-created_date', 100
    );

    if (!acquired || acquired.length === 0) {
      return Response.json({ ok: true, message: 'No acquired domains to launch', launched: 0 });
    }

    const results = [];
    for (const p of acquired) {
      try {
        // Step 1: Launch the domain (creates rank engine + submits to GSC)
        await base44.functions.invoke('launchDomainPortfolio', {
          portfolio_id: p.id,
          niche: p.niche,
        });

        // Step 2: Run the rank engine to generate keywords, pages, and citations
        const updated = await svc.entities.DomainPortfolio.get(p.id);
        if (updated.engine_id) {
          await base44.functions.invoke('runRankEngine', {
            action: 'run',
            engine_id: updated.engine_id,
          });
        }

        // Step 3: Build citation plan
        if (updated.engine_id) {
          try {
            await base44.functions.invoke('buildCitationPlan', {
              portfolio_id: p.id,
              niche: p.niche,
            });
          } catch {}
        }

        results.push({ domain: p.domain, status: 'launched', engine_id: updated.engine_id });
      } catch (e) {
        results.push({ domain: p.domain, error: e.message });
      }
    }

    return Response.json({
      ok: true,
      launched: results.filter(r => r.status === 'launched').length,
      failed: results.filter(r => r.error).length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}