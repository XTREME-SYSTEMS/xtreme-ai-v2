import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// sendClientInvitation — Step 1 of the deterministic pipeline.
// The admin enters the client's contact info and business type. The system
// creates a ClientInvitation record with a token, then emails the client a
// link to the public onboarding form.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to send invitations.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });

    const body = await req.json();
    const { client_name, client_email, client_phone, business_type } = body;
    if (!client_email || !client_name) return Response.json({ error: 'Client name and email are required.' }, { status: 400 });
    if (!['new', 'ai_enhancement', 'rebrand'].includes(business_type)) return Response.json({ error: 'business_type must be new, ai_enhancement, or rebrand.' }, { status: 400 });

    const token = crypto.randomUUID();
    const appUrl = req.headers.get('X-Base44-App-Url') || 'https://autobuilder.base44.app';
    const onboardingLink = `${appUrl}/onboarding-form?token=${token}`;

    const invitation = await base44.entities.ClientInvitation.create({
      admin_email: user.email,
      client_name,
      client_email,
      client_phone: client_phone || '',
      business_type,
      invitation_token: token,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    const businessTypeLabel = { new: 'a new business', ai_enhancement: 'AI enhancements to your current business', rebrand: 'a rebrand of your existing business' }[business_type];

    await base44.integrations.Core.SendEmail({
      to: client_email,
      subject: `${client_name}, let's build ${businessTypeLabel}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#0047FF">Hi ${client_name},</h2>
        <p style="font-size:16px;line-height:1.6;color:#333">You've been invited to start ${businessTypeLabel} with Auto Builder.</p>
        <p style="font-size:16px;line-height:1.6;color:#333">Click the button below to complete a short onboarding form. We'll gather some details about your business and industry, then our system goes to work building your brand assets.</p>
        <p style="margin:32px 0">
          <a href="${onboardingLink}" style="display:inline-block;background:#0047FF;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Start Onboarding</a>
        </p>
        <p style="font-size:13px;color:#999">If the button doesn't work, copy this link:<br><a href="${onboardingLink}" style="color:#0047FF">${onboardingLink}</a></p>
      </div>`,
    });

    return Response.json({ ok: true, invitation_id: invitation.id, token, onboarding_link: onboardingLink });
  } catch (error) {
    console.error('sendClientInvitation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}