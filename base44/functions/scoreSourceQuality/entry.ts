// scoreSourceQuality — The Analyst agent's weekly source performance
// review. For each LeadSource, calculates conversion rate (leads →
// responded/won) over the last 30 days. Demotes sources with < 5%
// conversion and sufficient volume (>= 5 leads) by setting active=false.
// Returns a performance report.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let user;
    try { user = await base44.auth.me(); } catch {}
    const svc = base44.asServiceRole;
    const { client_email, demote_threshold = 5, min_leads = 5, dry_run = false } = body;

    // Fetch all sources
    const sourceQuery = {} as any;
    if (client_email) sourceQuery.client_email = client_email;
    const sources = await svc.entities.LeadSource.filter(sourceQuery, '-created_date', 200);

    // Fetch leads from last 30 days
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const leadQuery = {} as any;
    if (client_email) leadQuery.client_email = client_email;
    const allLeads = await svc.entities.ScrapedLead.filter(leadQuery, '-scraped_at', 500);
    const last30d = (allLeads || []).filter(l => l.scraped_at && l.scraped_at >= since30);

    // Group leads by source_id
    const leadsBySource = {};
    for (const l of last30d) {
      const sid = l.source_id;
      if (!sid) continue;
      if (!leadsBySource[sid]) leadsBySource[sid] = { total: 0, won: 0, responded: 0, hot: 0, outreach_sent: 0 };
      leadsBySource[sid].total++;
      if (l.status === 'won') leadsBySource[sid].won++;
      if (l.status === 'responded') leadsBySource[sid].responded++;
      if (l.intent_tier === 'hot' || l.intent_tier === 'very_hot') leadsBySource[sid].hot++;
      if (['outreach_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'responded', 'won'].includes(l.status)) {
        leadsBySource[sid].outreach_sent++;
      }
    }

    const report = [];
    const demoted = [];

    for (const source of sources || []) {
      const stats = leadsBySource[source.id] || { total: 0, won: 0, responded: 0, hot: 0, outreach_sent: 0 };
      const conversion = stats.outreach_sent > 0
        ? ((stats.won + stats.responded) / stats.outreach_sent * 100)
        : 0;
      const entry = {
        source_id: source.id,
        source_name: source.source_name,
        source_type: source.source_type,
        active: source.active,
        total_leads_30d: stats.total,
        hot_leads: stats.hot,
        outreach_sent: stats.outreach_sent,
        responded: stats.responded,
        won: stats.won,
        conversion_rate: parseFloat(conversion.toFixed(1)),
      };
      report.push(entry);

      // Demote underperformers
      if (!dry_run && source.active && stats.total >= min_leads && conversion < demote_threshold) {
        try {
          await svc.entities.LeadSource.update(source.id, { active: false });
          demoted.push(source.source_name);
        } catch (e) {
          console.log(`Failed to demote ${source.source_name}: ${e?.message || e}`);
        }
      }
    }

    // Sort by conversion rate descending
    report.sort((a, b) => b.conversion_rate - a.conversion_rate);

    return Response.json({
      ok: true,
      sources_reviewed: report.length,
      demoted: demoted.length,
      demoted_names: demoted,
      dry_run,
      report: report.slice(0, 50),
    });
  } catch (error) {
    console.error('scoreSourceQuality error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}