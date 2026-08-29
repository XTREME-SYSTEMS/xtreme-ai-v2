import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil, secrets } from 'base44:runtime';
import { runSystemTest, type QAFinding } from '../../shared/qaSystemTester.ts';

const APP_URL = 'https://lead-growth-forge.base44.app';

// Client portal journey steps — the full onboarding flow a real client walks through
const CLIENT_PORTAL_STEPS = [
  { url: '/business-generator', name: 'Client Dashboard', system: 'client_portal' },
  { url: '/vision', name: 'Vision Step', system: 'client_portal' },
  { url: '/strategy', name: 'Strategy Step', system: 'client_portal' },
  { url: '/business-name-studio', name: 'Business Name Studio', system: 'client_portal' },
  { url: '/business-profile', name: 'Business Profile', system: 'client_portal' },
  { url: '/content-generator', name: 'Content Generator', system: 'client_portal' },
  { url: '/logo-generator', name: 'Logo Generator', system: 'client_portal' },
  { url: '/brand-generator', name: 'Brand Generator', system: 'client_portal' },
  { url: '/design-direction', name: 'Design Direction', system: 'client_portal' },
  { url: '/social-media', name: 'Social Media', system: 'client_portal' },
  { url: '/video-generator', name: 'Video Generator', system: 'client_portal' },
  { url: '/enhancements', name: 'Enhancements', system: 'client_portal' },
  { url: '/signatures', name: 'Signatures', system: 'client_portal' },
];

// Employee portal pages
const EMPLOYEE_PORTAL_STEPS = [
  { url: '/employee-portal', name: 'Employee Portal Home', system: 'employee_portal' },
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
    const targetSystem = body.target_system || 'client_portal';
    const loginEmail = body.login_email || secrets.get('QA_TEST_EMAIL') || '';
    const loginPassword = body.login_password || secrets.get('QA_TEST_PASSWORD') || '';

    // Determine which pages to test
    let pagesToTest = CLIENT_PORTAL_STEPS;
    if (targetSystem === 'employee_portal') {
      pagesToTest = EMPLOYEE_PORTAL_STEPS;
    }

    // Create a QATestRun record
    const testRun = await svc.entities.QATestRun.create({
      agent_type: 'humanized_test',
      target_system: targetSystem,
      status: 'running',
      started_at: new Date().toISOString(),
      triggered_by: user?.email || 'manual',
      logs: ['Initializing Humanized Test Agent...'],
    });

    // Run the test — fill forms to simulate a real user
    const result = await runSystemTest(svc, APP_URL, {
      pages: pagesToTest.map((p) => ({ ...p, url: APP_URL + p.url })),
      loginEmail: loginEmail || undefined,
      loginPassword: loginPassword || undefined,
      testFunctions: false,
      fillForms: true,
      agentType: 'humanized_test',
      targetSystem,
    });

    // Generate AI summary focused on UX
    let aiSummary = '';
    try {
      const findingsText = result.findings.slice(0, 25).map((f) =>
        `- [${f.severity}] ${f.category} on ${f.page_name}: ${f.description}`
      ).join('\n');

      const llmRes = await svc.integrations.Core.InvokeLLM({
        prompt: `You are a UX testing expert. A humanized test agent just walked through a client portal as a real user would — filling forms, clicking buttons, and taking screenshots at each step. Analyze the findings and provide a UX-focused report:

Findings (${result.findings.length} total):
${findingsText || 'No issues found — the portal journey is smooth.'}

Test stats: ${result.pages_tested} steps visited, ${result.buttons_clicked} buttons clicked, ${result.screenshots_taken} screenshots taken.

Provide:
1. **User Journey Summary** (2-3 sentences on the overall experience)
2. **UX Friction Points** (top 5 issues a real user would encounter, with severity)
3. **Enhancement Recommendations** (3-5 actionable UX improvements to increase conversion)
4. **Conversion Risk Assessment** (which steps are most likely to cause user drop-off)

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
        agent_type: 'humanized_test',
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
      } catch (e) { console.error('[HumanizedTest] Failed to write findings:', e); }
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
              subject: `Humanized Test Report — ${targetSystem} — Score ${result.score}/100`,
              body: `
                <h2>Humanized Test Agent Report</h2>
                <p><strong>Target:</strong> ${targetSystem}</p>
                <p><strong>Score:</strong> ${result.score}/100</p>
                <p><strong>Steps visited:</strong> ${result.pages_tested}</p>
                <p><strong>Buttons clicked:</strong> ${result.buttons_clicked}</p>
                <p><strong>Screenshots taken:</strong> ${result.screenshots_taken}</p>
                <p><strong>Findings:</strong> ${result.findings.length} total (${result.findings.filter(f => f.severity === 'critical').length} critical)</p>
                <h3>UX Analysis</h3>
                <pre style="white-space: pre-wrap; font-family: sans-serif;">${aiSummary}</pre>
                <p><em>Full details in the QA Agent dashboard.</em></p>
              `,
            });
          }
        }
      } catch (e) { console.error('[HumanizedTest] Email report failed:', e); }
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
    console.error('humanizedTestPortal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}