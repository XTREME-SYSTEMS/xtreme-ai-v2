import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// ingestPack — GPT Sync Endpoint
// Lets GPT (or any external tool) POST approved mockups straight in.
// They land as pending review — nothing goes live until the user approves.
// Auth: sync_token in the JSON body must match PACK_SYNC_TOKEN secret.
export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: 'Invalid JSON body' }, { status: 400 });

    const { sync_token, name, kind, preview_html, brand_tokens, source, submitted_by_label, session_id, user_email } = body;

    // Validate sync token
    const expectedToken = secrets.get('PACK_SYNC_TOKEN');
    if (!expectedToken) return Response.json({ error: 'PACK_SYNC_TOKEN not configured' }, { status: 500 });
    if (!sync_token || sync_token !== expectedToken) {
      return Response.json({ error: 'Invalid sync_token' }, { status: 401 });
    }

    // Validate required fields
    if (!name || !preview_html) {
      return Response.json({ error: 'Missing required fields: name, preview_html' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Create the pack as pending review
    const pack = await base44.asServiceRole.entities.GptPack.create({
      name,
      kind: kind || 'web_pack',
      preview_html,
      brand_tokens: brand_tokens || '{}',
      source: source || 'gpt_sync',
      submitted_by_label: submitted_by_label || 'GPT',
      session_id: session_id || null,
      user_email: user_email || null,
      status: 'pending',
    });

    return Response.json({
      ok: true,
      pack_id: pack.id,
      status: 'pending',
      message: 'Pack received — waiting for user review and approval',
    });
  } catch (error) {
    console.error('ingestPack error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}