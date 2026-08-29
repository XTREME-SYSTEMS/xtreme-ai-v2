import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil, secrets } from 'base44:runtime';
import { runSystemTest, type QAFinding } from '../../shared/qaSystemTester.ts';

const APP_URL = 'https://lead-growth-forge.base44.app';

// Admin pages to test (requires login)
const ADMIN_PAGES = [
  { url: '/autonomous-system', name: 'Pipeline Overview', system: 'admin' },
  { url: '/architect', name: 'AI Chief Architect', system: 'admin' },
  { url: '/vision-cortex', name: 'Vision Cortex', system: 'admin' },
  { url: '/pipeline-catalog', name: 'Pipeline Catalog', system: 'admin' },
  { url: '/build-queue', name: 'Build Queue', system: 'admin' },
  { url: '/auto-builder', name: 'Auto Builder', system: 'admin' },
  { url: '/product-catalog', name: 'Product Catalog', system: 'admin' },
  { url: '/employee-portal', name: 'Employee Portal', system: 'admin' },
  { url: '/system-alerts', name: 'System Alerts', system: 'admin' },
  { url: '/system-optimization', name: 'System Optimization', system: 'admin' },
  { url: '/qa-agent', name: 'QA Agent', system: 'admin' },
  { url: '/settings', name: 'Settings', system: 'admin' },
];

// Public pages to test (no login needed)
const PUBLIC_PAGES = [
  { url: '/', name: 'Marketing Home', system: 'public' },
  { url: '/pricing', name: 'Pricing', system: 'public' },
  { url: '/free-tools', name: 'Free Tools', system: 'public' },
  { url: '/free-audit', name: 'Free Audit', system: 'public' },
  { url: '/login', name: 'Login', system: 'public' },
  { url: '/register', name: 'Register', system: 'public' },
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const targetSystem = body.target_system || 'full_system';
    const loginEmail = body.login_email || secrets.get('QA_TEST_EMAIL') || '';
    const loginPassword = body.login_password || secrets.get('QA_TEST_PASSWORD') || '';

    // Create a QATestRun record
    const testRun = await svc.entities.QATestRun.create({
      agent_type: 'qa_agent',
      target_system: targetSystem,
      status: 'running',
      started_at: new Date().toISOString(),
      triggered_by: user?.email || 'manual',
      logs: ['Initializing QA Agent...'],
    });

    // Determine which pages to test
    let pagesToTest = [...PUBLIC_PAGES];
    if (loginEmail && loginPassword) {
      pagesToTest = [...PUBLIC_PAGES, ...ADMIN_PAGES];
    }
    if (targetSystem === 'admin') {
      pagesToTest = loginEmail ? ADMIN_PAGES : [];
      if (!loginEmail) {
        await svc.entities.QATestRun.update(testRun.id, {
          status: 'failed',
          error: 'No test credentials provided for admin testing',
          completed_at: new Date().toISOString(),
        });
        return Response.json({ error: 'No test credentials provided for admin testing' }, { status: 400 });
      }
    }

    // Run the test
    const result = await runSystemTest(svc, APP_URL, {
      pages: pagesToTest.map((p) => ({ ...p, url: APP_URL + p.url })),
      loginEmail: loginEmail || undefined,
      loginPassword: loginPassword || undefined,
      testFunctions: true,
      fillForms: false,
      agentType: 'qa_agent',
      targetSystem,
    });

    // Generate AI summary with recommendations
    let aiSummary = '';
    try {
      const findingsText = result.findings.slice(0, 25).map((f) =>
        `- [${f.severity}] ${f.category} on ${f.page_name}: ${f.description}`
      ).join('\n');

      const llmRes = await svc.integrations.Core.InvokeLLM({
        prompt: `You are a QA expert. Analyze these findings from a systematic test of a web app's admin system and provide a concise report:

Findings (${result.findings.length} total):
${findingsText || 'No issues found — system is healthy.'}

Test stats: ${result.pages_tested} pages tested, ${result.buttons_clicked} buttons clicked, ${result.functions_tested} functions tested, ${result.screenshots_taken} screenshots taken.

Provide:
1. **System Health Summary** (2-3 sentences)
2. **Top 5 Flaws** (most critical first, with recommended fix for each)
3. **Enhancement Recommendations** (3-5 actionable improvements)
4. **Overall Score Justification** (why the score is what it is)

Format as clean markdown.`,
      });
      aiSummary = typeof llmRes === 'string' ? llmRes : JSON.stringify(llmRes);
    } catch (e) {
      aiSummary = 'AI analysis unavailable — see raw findings in the dashboard.';
    }

    // Create QAFinding records
    if (result.findings.length > 0) {
      const findingRecords = result.findings.map((f: QAFinding) => ({
        test_run_id: testRun.id,
        agent_type: 'qa_agent',
        severity: f.severity,
        category: f.category,
        target_system: targetSystem,
        page_url: f.page_url,
        page_name: f.page_name,
        element_description: f.element_description,
        screenshot_url: f.screenshot_url || '',
        description: f.description,
        recommended_fix: f.recommended_fix || '',
        status: 'open',
      }));
      try {
        await svc.entities.QAFinding.bulkCreate(findingRecords);
      } catch (e) { console.error('[QA] Failed to write findings:', e); }
    }

    // Update the test run with results
    const completedAt = new Date().toISOString();
    await svc.entities.QATestRun.update(testRun.id, {
      status: 'complete',
      pages_tested: result.pages_tested,
      buttons_clicked: result.buttons_clicked,
      functions_tested: result.functions_tested,
      screenshots_taken: result.screenshots_taken,
      score: result.score,
      flaws_count: result.findings.length,
      critical_count: result.findings.filter((f) => f.severity === 'critical').length,
      recommendations_count: result.findings.filter((f) => f.category === 'enhancement_opportunity').length,
      summary: aiSummary.slice(0, 5000),
      completed_at: completedAt,
      duration_ms: Date.now() - new Date(testRun.started_at).getTime(),
      logs: result.logs,
    });

    // Email admins the report (non-blocking)
    waitUntil((async () => {
      try {
        const admins = await svc.entities.User.filter({ role: 'admin' }, '-created_date', 10);
        for (const admin of admins) {
          if (admin.email) {
            await svc.integrations.Core.SendEmail({
              to: admin.email,
              subject: `QA Agent Report — Score ${result.score}/100 — ${result.findings.length} findings`,
              body: `
                <h2>QA Agent Test Report</h2>
                <p><strong>Target:</strong> ${targetSystem}</p>
                <p><strong>Score:</strong> ${result.score}/100</p>
                <p><strong>Pages tested:</strong> ${result.pages_tested}</p>
                <p><strong>Buttons clicked:</strong> ${result.buttons_clicked}</p>
                <p><strong>Functions tested:</strong> ${result.functions_tested}</p>
                <p><strong>Screenshots taken:</strong> ${result.screenshots_taken}</p>
                <p><strong>Findings:</strong> ${result.findings.length} total (${result.findings.filter(f => f.severity === 'critical').length} critical)</p>
                <h3>AI Analysis</h3>
                <pre style="white-space: pre-wrap; font-family: sans-serif;">${aiSummary}</pre>
                <p><em>Full details in the QA Agent dashboard.</em></p>
              `,
            });
          }
        }
      } catch (e) { console.error('[QA] Email report failed:', e); }
    })());

    return Response.json({
      success: true,
      test_run_id: testRun.id,
      pages_tested: result.pages_tested,
      buttons_clicked: result.buttons_clicked,
      functions_tested: result.functions_tested,
      screenshots_taken: result.screenshots_taken,
      score: result.score,
      findings_count: result.findings.length,
      critical_count: result.findings.filter((f) => f.severity === 'critical').length,
      summary: aiSummary.slice(0, 5000),
      screenshots: result.screenshots,
    });
  } catch (error) {
    console.error('qaTestSystem error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}