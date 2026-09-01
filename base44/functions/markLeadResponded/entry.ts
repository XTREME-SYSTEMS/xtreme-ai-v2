// markLeadResponded — Triggered by the Gmail mailbox webhook when a
// lead replies to an outreach email. Matches the reply to a ScrapedLead
// by the recipient email + thread, then marks the lead as 'responded'
// and records the response timestamp.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;

    // Gmail webhook payload — extract the reply-to email and subject
    const fromEmail = body.from_email || body.from || '';
    const subject = body.subject || '';
    const snippet = body.snippet || body.body || '';
    const threadId = body.thread_id || body.threadId || '';

    if (!fromEmail) {
      return Response.json({ error: 'No from_email in webhook payload' }, { status: 400 });
    }

    // Find leads with this contact email that have been sent outreach
    const candidates = await svc.entities.ScrapedLead.filter(
      { contact_email: fromEmail },
      '-outreach_sent_at',
      20
    );

    const inOutreach = (candidates || []).filter(l =>
      ['outreach_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3'].includes(l.status)
    );

    if (!inOutreach.length) {
      return Response.json({ ok: true, message: 'No matching leads in outreach sequence.', matched: 0 });
    }

    // Mark all matching leads as responded
    const now = new Date().toISOString();
    let updated = 0;
    for (const lead of inOutreach) {
      try {
        await svc.entities.ScrapedLead.update(lead.id, {
          status: 'responded',
          last_response_at: now,
          notes: (lead.notes || '') + `\n[Reply received] ${subject}: ${snippet.slice(0, 200)}`,
        });
        updated++;
      } catch (e) {
        console.log(`Failed to mark lead ${lead.id} responded: ${e?.message || e}`);
      }
    }

    return Response.json({
      ok: true,
      matched: inOutreach.length,
      updated,
      from_email: fromEmail,
    });
  } catch (error) {
    console.error('markLeadResponded error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}