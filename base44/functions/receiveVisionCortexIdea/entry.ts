// receiveVisionCortexIdea — Public webhook that the external Vision Cortex
// Base44 app calls to inject an approved idea into this app's AutoBuild queue.
//
// This is the BRAIN → HANDS bridge. Vision Cortex (the brain) discovers and
// scores ideas, runs council debates, and approves the best ones. When an
// idea is approved, Vision Cortex POSTs it here. This function creates an
// AutoBuild record and the Autonomous Build Loop workflow picks it up and
// runs the full pipeline (architecture → data model → UI → code → deploy).
//
// Authentication: shared secret via x-api-key header (VISION_CORTEX_WEBHOOK_KEY).
//   Vision Cortex is NOT a user of this app, so we can't use base44.auth —
//   we use a simple API key instead. Set the same key in both apps' secrets.
//
// POST /functions/receiveVisionCortexIdea
//   Headers: x-api-key: <VISION_CORTEX_WEBHOOK_KEY>
//   Body: {
//     title: string (required) — the idea/business name
//     description: string — what it does
//     industry: string — e.g. "epoxy", "hvac", "roofing"
//     product_type: "marketing_site" | "web_app" | "ecommerce" | "platform"
//     target_audience: string
//     key_features: string[]
//     scores: { overall, profitability, scalability, ... } — from Vision Cortex
//     source_idea_id: string — Vision Cortex's idea ID (for dedup + linking)
//     auto_advance: boolean — if true, the build auto-advances through steps
//   }
//
// Returns: { ok, autobuild_id, message }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    // ── Authenticate via shared secret ──────────────────────────────
    const expectedKey = secrets.get('VISION_CORTEX_WEBHOOK_KEY');
    if (!expectedKey) {
      console.error('receiveVisionCortexIdea: VISION_CORTEX_WEBHOOK_KEY secret not set');
      return new Response(JSON.stringify({ error: 'Webhook not configured — set VISION_CORTEX_WEBHOOK_KEY secret' }), { status: 503 });
    }
    const providedKey = req.headers.get('x-api-key');
    if (!providedKey || providedKey !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized — invalid API key' }), { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const title = String(body.title || '').trim();
    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required' }), { status: 400 });
    }

    const productType = ['marketing_site', 'web_app', 'ecommerce', 'platform'].includes(body.product_type)
      ? body.product_type
      : 'web_app';

    const sourceIdeaId = body.source_idea_id ? String(body.source_idea_id) : null;

    // ── Dedup: if this idea was already submitted, return the existing build ──
    if (sourceIdeaId) {
      try {
        const existing = await base44.asServiceRole.entities.AutoBuild.filter(
          { source_vision_cortex_idea_id: sourceIdeaId },
          '-created_date',
          1
        );
        if (existing?.length > 0) {
          return new Response(JSON.stringify({
            ok: true,
            autobuild_id: existing[0].id,
            message: 'Idea already received — build exists',
            duplicate: true,
          }), { status: 200 });
        }
      } catch { /* dedup is best-effort */ }
    }

    // ── Create the AutoBuild ────────────────────────────────────────
    const scores = body.scores || {};
    const build = await base44.asServiceRole.entities.AutoBuild.create({
      business_name: title,
      industry: String(body.industry || 'general').trim(),
      sub_industry: String(body.sub_industry || '').trim(),
      product_type: productType,
      profile: {
        product_description: String(body.description || ''),
        target_audience: String(body.target_audience || ''),
        key_features: Array.isArray(body.key_features) ? body.key_features : [],
        services: Array.isArray(body.key_features) ? body.key_features : [],
        business_stage: 'new',
      },
      current_step: 'profile',
      status: 'queued',
      auto_advance: body.auto_advance === true,
      visited_steps: [],
      source_vision_cortex_idea_id: sourceIdeaId || undefined,
      vision_cortex_scores: scores || undefined,
      logs: [
        `[${new Date().toISOString()}] AutoBuild created from Vision Cortex webhook`,
        `[${new Date().toISOString()}] Idea: ${title}`,
        `[${new Date().toISOString()}] Source idea ID: ${sourceIdeaId || 'none'}`,
        `[${new Date().toISOString()}] Overall score: ${scores.overall || 'unscored'}`,
        `[${new Date().toISOString()}] Product type: ${productType}`,
      ],
    });

    // ── Receipt for auditability ─────────────────────────────────────
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: 'receiveVisionCortexIdea',
        action: 'receive_vision_cortex_idea',
        entity_type: 'AutoBuild',
        entity_id: build.id,
        inputs: JSON.stringify({ title, source_idea_id: sourceIdeaId, product_type: productType }).slice(0, 4000),
        outputs: JSON.stringify({ autobuild_id: build.id }).slice(0, 4000),
        status: 'success',
        evidence: `Vision Cortex idea "${title}" received → AutoBuild ${build.id} created`,
      });
    } catch { /* best-effort */ }

    return new Response(JSON.stringify({
      ok: true,
      autobuild_id: build.id,
      message: `Idea "${title}" received. AutoBuild ${build.id} queued. The Autonomous Build Loop will pick it up within 30 minutes.`,
    }), { status: 200 });
  } catch (e) {
    console.error('receiveVisionCortexIdea error:', e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});