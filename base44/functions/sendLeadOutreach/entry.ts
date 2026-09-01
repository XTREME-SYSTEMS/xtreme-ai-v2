// sendLeadOutreach — Sends automated outreach emails to scraped leads
// (company-type leads) via the Gmail connector. Includes digital brochure,
// business card, and 10% off first service coupon. Manages follow-up sequences.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let user;
    try { user = await base44.auth.me(); } catch {}

    const svc = base44.asServiceRole;
    const {
      lead_id,
      client_email,
      template_type = 'hello',
      max_sends = 10,
      follow_up_only = false,
    } = body;

    // Get Gmail connection
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'Gmail not connected. Authorize the Gmail connector first.' }, { status: 503 });
    }

    // Get sender email
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      const errText = await profileRes.text();
      return Response.json({ error: `Google auth failed: ${profileRes.status} ${errText}` }, { status: 502 });
    }
    const profile = await profileRes.json();
    const fromEmail = profile.email;

    // Determine which leads to email
    let leads = [];
    if (lead_id) {
      const lead = await svc.entities.ScrapedLead.get(lead_id);
      leads = lead ? [lead] : [];
    } else if (follow_up_only) {
      // Follow-up: leads that have been contacted and need a follow-up
      const now = new Date().toISOString();
      const query = {};
      if (client_email) query.client_email = client_email;
      // We can't do complex $in/$lte in filter, so fetch recent and filter in JS
      const candidates = await svc.entities.ScrapedLead.filter(query, '-next_follow_up_at', 50);
      leads = candidates.filter(l =>
        ['outreach_sent', 'follow_up_1', 'follow_up_2'].includes(l.status) &&
        l.next_follow_up_at && l.next_follow_up_at <= now
      ).slice(0, max_sends);
    } else {
      // Initial outreach: new company leads with emails
      const query = { lead_type: 'company', status: 'new' };
      if (client_email) query.client_email = client_email;
      leads = await svc.entities.ScrapedLead.filter(query, '-intent_score', max_sends);
    }

    // Filter to leads with emails
    const emailableLeads = leads.filter(l =>
      l.contact_email &&
      l.status !== 'unsubscribed' &&
      l.status !== 'bounced' &&
      l.status !== 'won'
    );

    const sent = [];
    const errors = [];

    for (const lead of emailableLeads) {
      try {
        // Get the client's business info for personalization
        let businessName = 'Our Team';
        let businessPhone = '';
        let websiteUrl = '';
        const services = ['epoxy flooring', 'garage floors', 'polished concrete', 'decorative concrete', 'concrete countertops'];
        try {
          const clientProjects = await svc.entities.ClientProject.filter({ client_email: lead.client_email }, '-created_date', 1);
          const cp = clientProjects[0];
          if (cp) {
            businessName = cp.business_name || businessName;
            if (cp.contact && cp.contact.phone) businessPhone = cp.contact.phone;
            if (cp.contact && cp.contact.website) websiteUrl = cp.contact.website;
          }
        } catch {}

        const isFollowUp = follow_up_only || (lead.follow_up_count && lead.follow_up_count > 0);
        const followUpNumber = lead.follow_up_count || 0;

        const { subject, htmlBody } = buildOutreachEmail(
          isFollowUp ? 'follow_up' : template_type,
          lead,
          businessName,
          businessPhone,
          websiteUrl,
          services,
          followUpNumber
        );

        const mime = [
          `From: ${businessName} <${fromEmail}>`,
          `To: ${lead.contact_name ? `${lead.contact_name} <${lead.contact_email}>` : lead.contact_email}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset=utf-8',
          'Content-Transfer-Encoding: 8bit',
          '',
          htmlBody,
        ].join('\r\n');

        const raw = btoa(unescape(encodeURIComponent(mime)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

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
          throw new Error(`Gmail send failed: ${sendRes.status} ${errText}`);
        }

        const result = await sendRes.json();

        // Update lead status
        const newFollowUpCount = (lead.follow_up_count || 0) + 1;
        const nextFollowUpDays = newFollowUpCount === 1 ? 3 : newFollowUpCount === 2 ? 5 : 7;
        const newStatus = newFollowUpCount === 1 ? 'follow_up_1' :
                          newFollowUpCount === 2 ? 'follow_up_2' :
                          'follow_up_3';

        await svc.entities.ScrapedLead.update(lead.id, {
          status: lead.status === 'new' ? 'outreach_sent' : newStatus,
          outreach_sent_at: lead.outreach_sent_at || new Date().toISOString(),
          follow_up_count: newFollowUpCount,
          next_follow_up_at: new Date(Date.now() + nextFollowUpDays * 24 * 60 * 60 * 1000).toISOString(),
        });

        sent.push({
          lead_id: lead.id,
          email: lead.contact_email,
          message_id: result.id,
          follow_up: newFollowUpCount,
        });
      } catch (sendErr) {
        console.log(`Failed to send to ${lead.contact_email}: ${sendErr?.message || sendErr}`);
        errors.push({ lead_id: lead.id, email: lead.contact_email, error: sendErr?.message || 'send failed' });
        // Mark bounced if Gmail rejected
        if (sendErr && sendErr.message && sendErr.message.includes('Gmail send failed')) {
          await svc.entities.ScrapedLead.update(lead.id, { status: 'bounced' }).catch(() => {});
        }
      }
    }

    return Response.json({
      ok: true,
      sent_count: sent.length,
      error_count: errors.length,
      sent,
      errors,
    });
  } catch (error) {
    console.error('sendLeadOutreach error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}

function buildOutreachEmail(templateType, lead, businessName, businessPhone, websiteUrl, services, followUpNumber) {
  const serviceList = services.join(', ');
  const firstName = lead.contact_name ? lead.contact_name.split(' ')[0] : 'there';

  if (templateType === 'follow_up') {
    const followUpSubject = followUpNumber === 1 ?
      `Quick follow-up — ${businessName} for ${lead.title || 'your project'}` :
      followUpNumber === 2 ?
      `Still interested in working together? — ${businessName}` :
      `Last note from ${businessName} — 10% off still available`;

    const followUpBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
<p>Hi ${firstName},</p>
<p>${followUpNumber === 1 ?
  `I reached out last week about helping with your concrete and flooring needs. I know things get busy, so I wanted to follow up quickly.` :
  followUpNumber === 2 ?
  `Just checking in — I'd love to help with any concrete, epoxy, or flooring projects you have coming up.` :
  `This will be my last note for now. If you ever need reliable concrete/epoxy services, we're here.`}</p>
<p>We specialize in: ${serviceList}.</p>
<p>The <strong>10% off your first service</strong> offer is still on the table.</p>
<p>Would a quick 5-minute call work this week? Or just reply with what you need and I'll send a quote.</p>
<p>Best,<br/>${businessName}<br/>${businessPhone ? `&#9742; ${businessPhone}<br/>` : ''}${websiteUrl ? `&#127760; ${websiteUrl}` : ''}</p>
</div>`;

    return { subject: followUpSubject, htmlBody: followUpBody };
  }

  // Default: hello / initial outreach email
  const subject = `Hello from ${businessName} — 10% off your first concrete/epoxy project`;

  const htmlBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
<div style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
<h1 style="color: #FFD700; margin: 0; font-size: 24px;">${businessName}</h1>
<p style="color: #ccc; margin: 5px 0 0; font-size: 14px;">Premium Concrete and Epoxy Flooring</p>
</div>
<div style="padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
<p>Hi ${firstName},</p>
<p>I came across <strong>${lead.title || 'your company'}</strong> and wanted to reach out. We're a local concrete and epoxy flooring specialist serving the area, and I think we could be a great partner for any projects that come up.</p>
<h3 style="color: #1a1a1a;">What We Do:</h3>
<ul style="color: #555; line-height: 1.8;">
<li>&#9989; <strong>Epoxy Garage Floors</strong> — chip, metallic, and solid color systems</li>
<li>&#9989; <strong>Polished and Stained Concrete</strong> — residential and commercial</li>
<li>&#9989; <strong>Decorative Concrete</strong> — overlays, stamping, resurfacing</li>
<li>&#9989; <strong>Concrete Countertops</strong> and epoxy countertops</li>
<li>&#9989; <strong>Driveways, Patios, Walkways</strong> — new installs and repairs</li>
<li>&#9989; <strong>Concrete Grinding and Leveling</strong></li>
</ul>
<div style="background: #FFF8E1; border: 2px dashed #FFD700; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
<p style="margin: 0; font-size: 18px; color: #1a1a1a;"><strong>&#127873; 10% OFF Your First Service</strong></p>
<p style="margin: 5px 0 0; font-size: 13px; color: #666;">Mention this email when you reach out</p>
</div>
<h3 style="color: #1a1a1a;">Why Work With Us:</h3>
<ul style="color: #555; line-height: 1.8;">
<li>&#128640; <strong>Fast turnaround</strong> — most projects done in 1-2 days</li>
<li>&#128737; <strong>Lifetime warranty</strong> on epoxy floor installations</li>
<li>&#128176; <strong>Competitive pricing</strong> — free estimates, no obligation</li>
<li>&#11088; <strong>5-star rated</strong> — trusted by homeowners and contractors</li>
</ul>
<p>Whether you need a sub for a project, or you have clients asking about flooring — let's connect.</p>
<div style="text-align: center; margin: 30px 0;">
<a href="${websiteUrl || '#'}" style="background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Get a Free Quote</a>
</div>
<div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 20px;">
<p style="margin: 0; font-size: 13px; color: #888;">
<strong>${businessName}</strong><br/>
${businessPhone ? `&#9742; ${businessPhone} &nbsp;` : ''}${websiteUrl ? `&#127760; ${websiteUrl}` : ''}<br/>
Premium concrete and epoxy flooring services
</p>
</div>
</div>
</div>`;

  return { subject, htmlBody };
}