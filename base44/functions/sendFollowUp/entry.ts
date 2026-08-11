import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeUpdate } from '../../shared/resilience.ts';

// Sends a follow-up email to a backlink prospect.
// Only sends if the prospect hasn't replied (status is still "sent" or "follow_up").
// follow_up_number: 1 (first follow-up) or 2 (final follow-up)
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const logs = [];
    const log = (m) => { logs.push(m); };

    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {}

    const svc = base44.asServiceRole;
    const prospectId = body.prospect_id;
    const followUpNumber = body.follow_up_number || 1;
    if (!prospectId) return Response.json({ error: 'prospect_id required' }, { status: 400 });

    const prospect = await svc.entities.BacklinkProspect.get(prospectId);

    // Only follow up if no reply yet
    const repliedStatuses = ['replied', 'accepted', 'rejected', 'dead'];
    if (repliedStatuses.includes(prospect.outreach_status)) {
      log(`Prospect already ${prospect.outreach_status} — skipping follow-up`);
      return Response.json({ ok: true, skipped: true, reason: `status is ${prospect.outreach_status}`, logs });
    }

    // Check follow-up count limit
    if ((prospect.follow_up_count || 0) >= 2) {
      log('Already sent 2 follow-ups — marking as dead');
      await safeUpdate(svc, 'BacklinkProspect', prospectId, {
        outreach_status: 'dead',
        notes: (prospect.notes || '') + ' | Auto-marked dead after 2 follow-ups with no reply'
      }, 'prospect-dead');
      return Response.json({ ok: true, skipped: true, reason: 'max follow-ups reached', logs });
    }

    if (!prospect.contact_email) {
      log('No contact email — skipping');
      return Response.json({ ok: true, skipped: true, reason: 'no contact email', logs });
    }

    // Get Gmail connection token
    let token;
    try {
      token = await base44.asServiceRole.connectors.getConnection('gmail');
    } catch (e) {
      return Response.json({ error: 'Gmail connector not connected: ' + e.message }, { status: 500 });
    }

    // Resolve sender email
    let senderEmail;
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` }
      });
      const userInfo = await userInfoRes.json();
      senderEmail = userInfo.email;
    } catch (e) {
      return Response.json({ error: 'Failed to resolve sender email: ' + e.message }, { status: 500 });
    }

    // Build follow-up email
    const prospectName = prospect.contact_name || 'there';
    const isFinal = followUpNumber >= 2;
    const subject = isFinal
      ? `Quick follow-up — ${prospect.target_domain}?`
      : `Following up — ${prospect.target_domain}`;
    const emailBody = isFinal
      ? `Hi ${prospectName},\n\nI reached out a couple of weeks ago about a potential collaboration between our sites. I know you're busy, so this is my last email on this.\n\nI still think there's a great fit here — would you be open to a quick 5-minute chat this week?\n\nIf not, no worries at all — just reply "no" and I won't follow up again.\n\nThanks for your time,\n${senderEmail.split('@')[0]}`
      : `Hi ${prospectName},\n\nJust following up on my email from last week about a potential collaboration with ${prospect.target_domain}.\n\nI'd love to explore how we could help each other with content or a link partnership. Would you be open to a quick conversation?\n\nThanks,\n${senderEmail.split('@')[0]}`;

    // Build MIME message
    const mimeMessage = [
      `From: ${senderEmail}`,
      `To: ${prospect.contact_email}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      emailBody
    ].join('\r\n');
    const encodedMessage = btoa(unescape(encodeURIComponent(mimeMessage)));

    // Send via Gmail API
    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedMessage })
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      throw new Error(`Gmail API error: ${sendRes.status} ${errText}`);
    }

    const newFollowUpCount = (prospect.follow_up_count || 0) + 1;
    const newStatus = isFinal ? 'follow_up' : 'follow_up';

    await safeUpdate(svc, 'BacklinkProspect', prospectId, {
      outreach_status: newStatus,
      follow_up_count: newFollowUpCount,
      last_contacted: new Date().toISOString(),
      outreach_subject: subject,
      outreach_body: emailBody,
      notes: (prospect.notes || '') + ` | Follow-up #${newFollowUpCount} sent ${new Date().toISOString().slice(0,10)}`
    }, 'prospect-followup');

    log(`Follow-up #${newFollowUpCount} sent to ${prospect.contact_email}`);

    return Response.json({
      ok: true,
      prospect_id: prospectId,
      follow_up_number: newFollowUpCount,
      sent_to: prospect.contact_email,
      logs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}