import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Website quality gate — the critic half of a generate→critique→fix loop.
// Scores every section of the generated website content against a rubric
// (copy quality, conversion strength, local SEO, AEO/answer-readiness, brand
// fit), returns per-section scores + an overall score + concrete fixes, and
// when autoFix=true, rewrites the weak copy sections in place and returns the
// improved content. This is the single biggest lever for closing the gap to
// top-tier human-crafted sites.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { content, profile, autoFix } = body;
    const c = content || {};
    const p = profile || {};
    const biz = p.businessName || "this business";
    const loc = p.primaryLocation || "";
    const ind = p.industry || "local service business";
    const subInd = p.subIndustry || p.customSubIndustry || "";
    const svc = (p.services || []).join(", ");
    const diff = (p.differentiators || []).join("; ");

    // ── Critique pass ───────────────────────────────────────────────
    const critique = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior conversion copywriter, local SEO specialist, and brand director reviewing a generated website for a real local business. Score it against a strict rubric and give concrete fixes.

BUSINESS:
- Name: ${biz}
- Industry: ${ind}${subInd ? ` (${subInd})` : ""}${p.businessType ? `\n- Type: ${p.businessType}` : ""}
- Location: ${loc || "n/a"}
- Services: ${svc || "n/a"}
- Differentiators: ${diff || "n/a"}

WEBSITE CONTENT (JSON):
${JSON.stringify(c).slice(0, 12000)}

Score EACH section present (hero, about, services, faq, cta, testimonials if any) on 0-100 for:
- copyQuality: punchy, specific, no fluff, professional voice
- conversion: clear value prop, strong CTA, trust signals, urgency
- localSeo: city/area mentions, local intent, NAP consistency, service+city combos
- aeo: concise answer-ready blocks, FAQ phrased as real questions, entity clarity
- brandFit: matches industry tone and the business's differentiators

Also give an overallScore (0-100) and a prioritized list of fixes (max 8), each tagged with the section it applies to.

Return JSON:
{
  "sections": { "<sectionKey>": { "copyQuality": n, "conversion": n, "localSeo": n, "aeo": n, "brandFit": n, "score": n, "notes": "..." } },
  "overallScore": n,
  "fixes": [ { "section": "...", "issue": "...", "fix": "..." } ]
}`,
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          sections: { type: "object" },
          overallScore: { type: "number" },
          fixes: { type: "array", items: { type: "object", properties: { section: { type: "string" }, issue: { type: "string" }, fix: { type: "string" } } } },
        },
      },
    });

    const sections = (critique && critique.sections) || {};
    const overallScore = (critique && critique.overallScore) || 0;
    const fixes = (critique && critique.fixes) || [];

    // ── Auto-fix pass ───────────────────────────────────────────────
    // Rewrite any section scoring under 75, applying the critic's fixes.
    let fixedContent = null;
    if (autoFix) {
      const weakSections = Object.entries(sections)
        .filter(([, v]) => v && typeof v.score === "number" && v.score < 75)
        .map(([k]) => k);
      if (weakSections.length > 0) {
        const fixRes = await base44.integrations.Core.InvokeLLM({
          prompt: `You are rewriting weak sections of a local business website to top-tier quality. Apply the fixes below and return ONLY the updated sections as JSON — preserve everything else.

BUSINESS: ${biz} — ${ind}${subInd ? ` (${subInd})` : ""} — ${loc || "n/a"}
SERVICES: ${svc || "n/a"}
DIFFERENTIATORS: ${diff || "n/a"}

CURRENT CONTENT:
${JSON.stringify(c).slice(0, 10000)}

WEAK SECTIONS TO REWRITE: ${weakSections.join(", ")}
CRITIC FIXES TO APPLY:
${JSON.stringify(fixes).slice(0, 4000)}

Rules:
- Hero: punchy headline + subhead with city + service, strong value prop.
- About: 2-3 sentences, local, trust-building, mentions years if known.
- Services: 5-7 items, each title + 1-2 sentence description with a benefit.
- FAQ: 6-8 real customer questions, each a concise 1-2 sentence answer.
- CTA: one clear action with urgency.
- Keep all copy specific to THIS business and location — no generic filler.

Return JSON with the SAME top-level keys as the current content, but only the rewritten sections filled in (others can be omitted).`,
          model: "claude_sonnet_4_6",
          response_json_schema: { type: "object" },
        });
        if (fixRes && typeof fixRes === "object") {
          fixedContent = { ...c, ...fixRes };
        }
      }
    }

    return Response.json({ ok: true, sections, overallScore, fixes, fixedContent });
  } catch (error) {
    console.error("websiteQualityGate error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}