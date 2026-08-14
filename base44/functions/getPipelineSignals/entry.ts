import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Returns per-user signals that complete the two non-gate pipeline steps:
//   index-rank  -> a DomainPortfolio linked to the user has gsc_verified && gsc_sitemap_submitted
//   optimize    -> a RankKeyword for the user's engine has current_position > 0
//                  OR a runSeoMaintenance Receipt exists in the last 30 days
// User->portfolio/engine link is resolved via Market.email === user email.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const email = body.email;
    if (!email) return Response.json({ error: "email required" }, { status: 400 });

    const markets = await base44.asServiceRole.entities.Market.filter({ email }, undefined, 100);
    const domains = markets.map((m) => m.domain).filter(Boolean);

    let indexRankComplete = false;
    let optimizeComplete = false;

    if (domains.length > 0) {
      const portfolios = await base44.asServiceRole.entities.DomainPortfolio.list(undefined, 200);
      indexRankComplete = portfolios.some(
        (p) => domains.includes(p.domain) && p.gsc_verified && p.gsc_sitemap_submitted
      );

      const marketIds = markets.map((m) => m.id).filter(Boolean);
      if (marketIds.length > 0) {
        const engines = await base44.asServiceRole.entities.RankEngine.list(undefined, 200);
        const engineIds = engines.filter((e) => marketIds.includes(e.market_id)).map((e) => e.id);
        if (engineIds.length > 0) {
          const keywords = await base44.asServiceRole.entities.RankKeyword.list(undefined, 300);
          optimizeComplete = keywords.some((k) => engineIds.includes(k.engine_id) && k.current_position > 0);
        }
      }
    }

    if (!optimizeComplete) {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const receipts = await base44.asServiceRole.entities.Receipt.list("-created_date", 100);
      optimizeComplete = receipts.some(
        (r) => (r.agent_or_workflow || "").includes("runSeoMaintenance") && (r.created_date || "") >= since
      );
    }

    return Response.json({ email, indexRankComplete, optimizeComplete });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}