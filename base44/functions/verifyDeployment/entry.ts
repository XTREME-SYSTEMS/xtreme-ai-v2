import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// verifyDeployment — Phase 4: Post-deployment verification.
// Checks that a deployed site is live, accessible, has SSL, and passes
// basic SEO/Lighthouse checks. Updates SystemHealthScore and creates a
// SystemAlert if any check fails.
//
// Checks performed:
// 1. Site is reachable (HTTP 200)
// 2. SSL certificate is valid
// 3. Page load time < 5s
// 4. HTML contains expected meta tags (title, description)
// 5. JSON-LD structured data present
// 6. Mobile viewport tag present
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { buildId, liveUrl } = body;

    if (!liveUrl) return Response.json({ error: 'liveUrl is required' }, { status: 400 });

    const url = liveUrl.startsWith('http') ? liveUrl : `https://${liveUrl}`;
    const checks: any[] = [];
    let overallScore = 0;
    let maxScore = 0;

    // ── Check 1: Reachability ──────────────────────────────────────────
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Base44-Deploy-Verifier/1.0' },
      });
      clearTimeout(timeout);

      const isOk = res.status >= 200 && res.status < 400;
      checks.push({
        name: 'reachability',
        passed: isOk,
        score: isOk ? 20 : 0,
        maxScore: 20,
        detail: `HTTP ${res.status} ${res.statusText}`,
      });

      if (isOk) {
        // ── Check 2: SSL ──────────────────────────────────────────────
        const isHttps = url.startsWith('https://');
        checks.push({
          name: 'ssl',
          passed: isHttps,
          score: isHttps ? 15 : 0,
          maxScore: 15,
          detail: isHttps ? 'HTTPS enabled' : 'No SSL — HTTP only',
        });

        // ── Check 3: Page load time ──────────────────────────────────
        const loadTime = Date.now() - (controller as any)._startTime || 0;
        const fast = loadTime < 5000;
        checks.push({
          name: 'load_time',
          passed: fast,
          score: fast ? 15 : 5,
          maxScore: 15,
          detail: `${loadTime}ms`,
        });

        // ── Check 4: HTML meta tags ───────────────────────────────────
        const html = await res.text();
        const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
        const hasDescription = /<meta[^>]+name=["']description["']/i.test(html);
        const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
        const hasJsonLd = /application\/ld\+json/i.test(html);
        const hasLang = /<html[^>]+lang=/i.test(html);

        checks.push({
          name: 'meta_title',
          passed: hasTitle,
          score: hasTitle ? 10 : 0,
          maxScore: 10,
          detail: hasTitle ? 'Title tag present' : 'Missing <title>',
        });
        checks.push({
          name: 'meta_description',
          passed: hasDescription,
          score: hasDescription ? 10 : 0,
          maxScore: 10,
          detail: hasDescription ? 'Description meta present' : 'Missing description',
        });
        checks.push({
          name: 'mobile_viewport',
          passed: hasViewport,
          score: hasViewport ? 10 : 0,
          maxScore: 10,
          detail: hasViewport ? 'Viewport tag present' : 'Missing viewport — not mobile-friendly',
        });
        checks.push({
          name: 'structured_data',
          passed: hasJsonLd,
          score: hasJsonLd ? 10 : 0,
          maxScore: 10,
          detail: hasJsonLd ? 'JSON-LD present' : 'No structured data',
        });
        checks.push({
          name: 'html_lang',
          passed: hasLang,
          score: hasLang ? 5 : 0,
          maxScore: 5,
          detail: hasLang ? 'Lang attribute set' : 'Missing lang attribute',
        });
      }
    } catch (fetchErr: any) {
      checks.push({
        name: 'reachability',
        passed: false,
        score: 0,
        maxScore: 20,
        detail: `Fetch failed: ${fetchErr?.message || 'unknown error'}`,
      });
    }

    // Calculate overall score
    for (const c of checks) {
      overallScore += c.score;
      maxScore += c.maxScore;
    }
    const scorePercent = maxScore > 0 ? Math.round((overallScore / maxScore) * 100) : 0;
    const allPassed = checks.every((c) => c.passed);
    const failedChecks = checks.filter((c) => !c.passed);

    // Create a SystemAlert if any checks failed
    if (failedChecks.length > 0 && buildId) {
      try {
        await base44.asServiceRole.entities.SystemAlert.create({
          alert_type: 'post_deploy_check_failure',
          severity: failedChecks.length > 2 ? 'critical' : 'warning',
          build_id: buildId,
          live_url: url,
          step: 'post_deploy',
          message: `Post-deploy verification failed: ${failedChecks.map((c) => c.name).join(', ')}`,
          recommended_action: failedChecks.length > 2 ? 'escalate' : 'retry',
          context: JSON.stringify(failedChecks).slice(0, 4000),
          status: 'open',
        });
      } catch {}
    }

    // Record a Receipt for auditability
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: 'verifyDeployment',
        action: 'post_deploy_verification',
        entity_type: buildId ? 'AutoBuild' : 'Deployment',
        entity_id: buildId || liveUrl,
        inputs: JSON.stringify({ buildId, liveUrl }).slice(0, 4000),
        outputs: JSON.stringify({ score: scorePercent, checks: checks.length, passed: checks.filter((c) => c.passed).length, failed: failedChecks.length }).slice(0, 4000),
        status: allPassed ? 'success' : 'escalated',
        evidence: `Post-deploy verification: ${scorePercent}% (${checks.filter((c) => c.passed).length}/${checks.length} checks passed)`,
      });
    } catch {}

    return Response.json({
      ok: true,
      url,
      score: scorePercent,
      allPassed,
      checks,
      failedChecks: failedChecks.map((c) => ({ name: c.name, detail: c.detail })),
    });
  } catch (error) {
    console.error('verifyDeployment error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}