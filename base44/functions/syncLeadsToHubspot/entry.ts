// syncLeadsToHubspot — Pushes validated (auto_approved) leads to the
// client's HubSpot CRM as contacts. Uses the HubSpot connector. Only
// syncs leads with contact info that haven't been synced yet (tracked
// via the notes field containing 'synced_to_hubspot').

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let user;
    try { user = await base44.auth.me(); } catch {}
    const svc = base44.asServiceRole;
    const { client_email, max_leads = 25 } = body;

    // Get HubSpot connection
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('hubspot');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'HubSpot not connected. Authorize the HubSpot connector first.' }, { status: 503 });
    }

    // Fetch auto_approved leads with contact info not yet synced
    const query = { review_status: 'auto_approved' } as any;
    if (client_email) query.client_email = client_email;
    const candidates = await svc.entities.ScrapedLead.filter(query, '-scraped_at', 100);
    const toSync = (candidates || []).filter(l =>
      (l.contact_email || l.contact_phone) &&
      !(l.notes || '').includes('synced_to_hubspot')
    ).slice(0, max_leads);

    if (!toSync.length) {
      return Response.json({ ok: true, synced: 0, message: 'No new leads to sync.' });
    }

    const synced = [];
    const errors = [];

    for (const lead of toSync) {
      try {
        // Create HubSpot contact
        const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              email: lead.contact_email || '',
              firstname: (lead.contact_name || '').split(' ')[0] || '',
              lastname: (lead.contact_name || '').split(' ').slice(1).join(' ') || '',
              phone: lead.contact_phone || '',
              city: (lead.location || '').split(',')[0] || '',
              state: (lead.location || '').split(',')[1]?.trim() || '',
              lifecyclestage: lead.intent_tier === 'hot' || lead.intent_tier === 'very_hot' ? 'salesqualifiedlead' : 'lead',
              hs_lead_status: lead.intent_tier || 'warm',
            },
          }),
        });

        if (!contactRes.ok) {
          const errText = await contactRes.text();
          // 409 = duplicate contact — that's fine, mark as synced
          if (contactRes.status === 409) {
            await svc.entities.ScrapedLead.update(lead.id, {
              notes: (lead.notes || '') + '\n[synced_to_hubspot: duplicate]',
            });
            synced.push({ id: lead.id, status: 'duplicate' });
            continue;
          }
          throw new Error(`HubSpot ${contactRes.status}: ${errText.slice(0, 200)}`);
        }

        const contact = await contactRes.json();
        await svc.entities.ScrapedLead.update(lead.id, {
          notes: (lead.notes || '') + `\n[synced_to_hubspot: ${contact.id}]`,
        });
        synced.push({ id: lead.id, hubspot_id: contact.id });
      } catch (syncErr) {
        console.log(`HubSpot sync failed for ${lead.id}: ${syncErr?.message || syncErr}`);
        errors.push({ id: lead.id, error: syncErr?.message || 'sync failed' });
      }
    }

    return Response.json({
      ok: true,
      synced: synced.length,
      errors: errors.length,
      synced_ids: synced,
      errors_detail: errors,
    });
  } catch (error) {
    console.error('syncLeadsToHubspot error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}