import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Admin-only
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {}

    const svc = base44.asServiceRole;

    const prospectId = body.prospect_id;
    if (!prospectId) {
      return Response.json({ error: 'prospect_id required' }, { status: 400 });
    }

    const prospect = await svc.entities.BacklinkProspect.get(prospectId);
    if (!prospect) {
      return Response.json({ error: 'Prospect not found' }, { status: 404 });
    }

    if (!prospect.contact_email) {
      return Response.json({ error: 'No contact email on this prospect. Add one before sending.' }, { status: 400 });
    }

    // ---- Get Gmail connection (platform SHARED connector) ----
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'Gmail not connected. Authorize the Gmail connector first.' }, { status: 503 });
    }

    // ---- Resolve sender address from the authorized Gmail account ----
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      const errText = await profileRes.text();
      return Response.json({ error: `Gmail auth failed: ${profileRes.status} ${errText}` }, { status: 502 });
    }
    const profile = await profileRes.json();
    const fromEmail = profile.emailAddress;

    const fromName = body.from_name || 'Lead Gen Near You';
    const subject = body.subject || prospect.outreach_subject || `Partnership opportunity`;
    const emailBody = body.body || prospect.outreach_body || '';

    if (!emailBody) {
      return Response.json({ error: 'No email body. Draft outreach first.' }, { status: 400 });
    }

    // ---- Build RFC 2822 MIME message ----
    const mime = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${prospect.contact_name ? `${prospect.contact_name} <${prospect.contact_email}>` : prospect.contact_email}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      emailBody,
    ].join('\r\n');

    // Base64url encode (UTF-8 safe)
    const raw = btoa(unescape(encodeURIComponent(mime)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // ---- Send via Gmail API ----
    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      return Response.json({ error: `Gmail send failed: ${sendRes.status} ${errText}` }, { status: 502 });
    }

    const result = await sendRes.json();

    // ---- Update prospect status ----
    await svc.entities.BacklinkProspect.update(prospect.id, {
      outreach_status: 'sent',
      last_contacted: new Date().toISOString(),
      outreach_subject: subject,
      outreach_body: emailBody,
      follow_up_count: (prospect.follow_up_count || 0),
    });

    return Response.json({
      ok: true,
      prospect_id: prospect.id,
      target_domain: prospect.target_domain,
      message_id: result.id,
      sent_to: prospect.contact_email,
      sent_from: fromEmail,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}