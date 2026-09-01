// sendLeadDigest — The Analyst agent's 5am morning digest. Summarizes
// HOT/VERY_HOT leads from the last 24h, source performance, and action
// items. Emails the digest to the operator and returns the content for
// the in-app briefing.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let user;
    try { user = await base44.auth.me(); } catch {}
    const svc = base44.asServiceRole;
    const { client_email, triggered_by = 'manual' } = body;

    // Fetch leads from the last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const query = {} as any;
    if (client_email) query.client_email = client_email;
    const recentLeads = await svc.entities.ScrapedLead.filter(query, '-scraped_at', 200);
    const last24h = (recentLeads || []).filter(l => l.scraped_at && l.scraped_at >= since);

    // Categorize
    const hotLeads = last24h.filter(l => l.intent_tier === 'hot' || l.intent_tier === 'very_hot');
    const flaggedLeads = last24h.filter(l => l.review_status === 'flagged');
    const newApproved = last24h.filter(l => l.review_status === 'auto_approved');
    const outreachSent = last24h.filter(l => ['outreach_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3'].includes(l.status));
    const responded = last24h.filter(l => l.status === 'responded' || l.status === 'won');

    // Source performance (last 30 days for conversion)
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const last30d = (recentLeads || []).filter(l => l.scraped_at && l.scraped_at >= since30);
    const sourceMap = {};
    for (const l of last30d) {
      const name = l.source_name || 'unknown';
      if (!sourceMap[name]) sourceMap[name] = { name, total: 0, won: 0, responded: 0, hot: 0 };
      sourceMap[name].total++;
      if (l.status === 'won') sourceMap[name].won++;
      if (l.status === 'responded') sourceMap[name].responded++;
      if (l.intent_tier === 'hot' || l.intent_tier === 'very_hot') sourceMap[name].hot++;
    }
    const sources = Object.values(sourceMap).map((s: any) => ({
      ...s,
      conversion: s.total > 0 ? ((s.won + s.responded) / s.total * 100) : 0,
    }));
    const topSources = sources.sort((a, b) => b.hot - a.hot).slice(0, 3);
    const bottomSources = sources.filter((s: any) => s.total >= 5).sort((a, b) => a.conversion - b.conversion).slice(0, 3);

    // Build digest
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const hotList = hotLeads.slice(0, 10).map((l, i) =>
      `${i + 1}. [${l.intent_tier.toUpperCase()}] ${l.title}\n   Source: ${l.source_name} | Location: ${l.location || 'N/A'} | Intent: ${l.intent_score}\n   Contact: ${l.contact_email || l.contact_phone || 'no contact info'}`
    ).join('\n\n');

    const flaggedList = flaggedLeads.slice(0, 5).map((l, i) =>
      `${i + 1}. ${l.title} — ${l.validation_notes || 'flagged'}`
    ).join('\n');

    const topSourcesList = topSources.map((s: any) =>
      `• ${s.name}: ${s.total} leads, ${s.hot} hot, ${s.conversion.toFixed(1)}% conversion`
    ).join('\n');
    const bottomSourcesList = bottomSources.map((s: any) =>
      `• ${s.name}: ${s.total} leads, ${s.conversion.toFixed(1)}% conversion — consider demoting`
    ).join('\n');

    const digestText = `🌅 LEAD ENGINE — MORNING DIGEST
${today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 LAST 24 HOURS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total leads found: ${last24h.length}
Auto-approved: ${newApproved.length}
HOT / VERY_HOT: ${hotLeads.length}
Flagged for review: ${flaggedLeads.length}
Outreach sent: ${outreachSent.length}
Responses received: ${responded.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 HOT LEADS — SAME-DAY ACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${hotList || 'No hot leads in the last 24h.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ FLAGGED — NEEDS YOUR REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${flaggedList || 'No flagged leads. System is clean.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 SOURCE PERFORMANCE (30 DAYS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP SOURCES:
${topSourcesList || 'Not enough data yet.'}

UNDERPERFORMING (consider demoting):
${bottomSourcesList || 'No underperforming sources yet.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TODAY'S RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${hotLeads.length > 0
  ? `You have ${hotLeads.length} HOT lead(s) today. Reach out to all of them before noon — they're ready to hire.`
  : 'No hot leads today. Focus on follow-ups and source expansion.'}
${flaggedLeads.length > 0 ? `Review ${flaggedLeads.length} flagged lead(s) via the Lead Engine page.` : ''}

— Analyst, Lead Engine`;

    // Email the digest to the operator
    const recipient = client_email || user?.email;
    if (recipient) {
      try {
        await base44.integrations.Core.SendEmail({
          to: recipient,
          subject: `🌅 Lead Engine Digest — ${today} | ${hotLeads.length} HOT leads`,
          body: digestText,
        });
      } catch (emailErr) {
        console.log(`Digest email failed: ${emailErr?.message || emailErr}`);
      }
    }

    return Response.json({
      ok: true,
      digest: digestText,
      stats: {
        total_24h: last24h.length,
        hot: hotLeads.length,
        flagged: flaggedLeads.length,
        auto_approved: newApproved.length,
        outreach_sent: outreachSent.length,
        responded: responded.length,
      },
      hot_leads: hotLeads.slice(0, 10).map(l => ({
        id: l.id, title: l.title, tier: l.intent_tier, source: l.source_name,
        location: l.location, intent_score: l.intent_score, contact: l.contact_email || l.contact_phone,
      })),
      flagged_leads: flaggedLeads.slice(0, 5).map(l => ({ id: l.id, title: l.title, notes: l.validation_notes })),
      top_sources: topSources,
      bottom_sources: bottomSources,
    });
  } catch (error) {
    console.error('sendLeadDigest error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}