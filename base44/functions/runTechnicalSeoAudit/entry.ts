import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeInvoke, safeUpdate } from '../../shared/resilience.ts';

// Audits all pages in an engine for technical SEO issues:
// meta title/description length, word count, JSON-LD presence, FAQ schema,
// heading structure, internal linking. Scores each page 0-100 and stores issues.
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
    const engineId = body.engine_id;
    if (!engineId) return Response.json({ error: 'engine_id required' }, { status: 400 });

    const engine = await svc.entities.RankEngine.get(engineId);
    const pages = await svc.entities.RankPage.filter({ engine_id: engineId });
    log(`Auditing ${pages.length} pages for "${engine.site_name}"`);

    if (!pages.length) {
      return Response.json({ error: 'No pages found. Run the Rank Engine first.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let totalScore = 0;
    let auditedCount = 0;
    const allIssues = [];

    for (const page of pages) {
      const issues = [];
      let score = 100;

      // 1. Meta title length (50-60 chars ideal)
      const titleLen = (page.title || '').length;
      if (titleLen === 0) { issues.push({ check: 'meta_title', severity: 'critical', detail: 'Missing meta title', fix: 'Add a unique title tag with the target keyword' }); score -= 25; }
      else if (titleLen < 30) { issues.push({ check: 'meta_title', severity: 'high', detail: `Title too short (${titleLen} chars)`, fix: 'Expand to 50-60 characters with keyword + modifier' }); score -= 10; }
      else if (titleLen > 65) { issues.push({ check: 'meta_title', severity: 'medium', detail: `Title too long (${titleLen} chars)`, fix: 'Trim to under 60 characters' }); score -= 5; }

      // 2. Meta description length (150-160 chars ideal)
      const descLen = (page.meta_description || '').length;
      if (descLen === 0) { issues.push({ check: 'meta_description', severity: 'critical', detail: 'Missing meta description', fix: 'Add a 150-160 char description with keyword + CTA' }); score -= 20; }
      else if (descLen < 120) { issues.push({ check: 'meta_description', severity: 'high', detail: `Description too short (${descLen} chars)`, fix: 'Expand to 150-160 characters' }); score -= 8; }
      else if (descLen > 170) { issues.push({ check: 'meta_description', severity: 'medium', detail: `Description too long (${descLen} chars)`, fix: 'Trim to under 160 characters' }); score -= 4; }

      // 3. Word count (600+ ideal for local SEO)
      const wc = page.word_count || (page.body_content || '').split(/\s+/).length;
      if (wc < 300) { issues.push({ check: 'word_count', severity: 'critical', detail: `Only ${wc} words (need 600+)`, fix: 'Expand content to 600+ words with deeper topic coverage' }); score -= 20; }
      else if (wc < 600) { issues.push({ check: 'word_count', severity: 'high', detail: `Only ${wc} words`, fix: 'Add more sections, FAQs, and detailed service descriptions' }); score -= 10; }

      // 4. JSON-LD presence
      if (!page.json_ld || Object.keys(page.json_ld || {}).length === 0) {
        issues.push({ check: 'json_ld', severity: 'high', detail: 'Missing structured data', fix: 'Add LocalBusiness + Service + FAQPage JSON-LD schema' });
        score -= 15;
      }

      // 5. FAQ presence
      if (!page.faq || page.faq.length === 0) {
        issues.push({ check: 'faq', severity: 'high', detail: 'No FAQ section', fix: 'Add 4-6 FAQ Q&As with FAQPage schema for rich snippets' });
        score -= 10;
      }

      // 6. Heading structure (H1 in body)
      const body = page.body_content || '';
      if (!body.includes('<h1') && !body.includes('# ')) {
        issues.push({ check: 'h1_heading', severity: 'high', detail: 'No H1 heading in body', fix: 'Add a single H1 with the target keyword' });
        score -= 10;
      }

      // 7. Internal linking (mentions of other services/cities)
      const internalLinks = (body.match(/<a\s+href/gi) || []).length;
      if (internalLinks < 2) {
        issues.push({ check: 'internal_links', severity: 'medium', detail: `Only ${internalLinks} internal links`, fix: 'Add contextual links to related service/city pages' });
        score -= 5;
      }

      // 8. Image alt text
      const imgTags = body.match(/<img[^>]*>/gi) || [];
      const imgsWithoutAlt = imgTags.filter(t => !t.includes('alt=') || t.includes('alt=""'));
      if (imgTags.length > 0 && imgsWithoutAlt.length > 0) {
        issues.push({ check: 'image_alt', severity: 'medium', detail: `${imgsWithoutAlt.length} images missing alt text`, fix: 'Add descriptive alt text with keywords to all images' });
        score -= 5;
      }

      score = Math.max(0, Math.min(100, score));
      totalScore += score;
      auditedCount++;
      allIssues.push(...issues);

      await safeUpdate(svc, 'RankPage', page.id, {
        seo_score: score,
        audit_issues: issues,
        last_audited: now,
        word_count: wc
      }, `audit-${page.id}`);
    }

    const avgScore = auditedCount > 0 ? Math.round(totalScore / auditedCount) : 0;
    const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
    const highCount = allIssues.filter(i => i.severity === 'high').length;

    log(`Audit complete: avg score ${avgScore}/100, ${criticalCount} critical, ${highCount} high issues`);

    // Update engine technical SEO score
    await safeUpdate(svc, 'RankEngine', engineId, {
      technical_seo_score: avgScore,
      logs: [...(engine.logs || []), ...logs].slice(-20)
    }, 'engine-audit-update');

    return Response.json({
      ok: true,
      engine_id: engineId,
      pages_audited: auditedCount,
      avg_seo_score: avgScore,
      critical_issues: criticalCount,
      high_issues: highCount,
      total_issues: allIssues.length,
      logs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}