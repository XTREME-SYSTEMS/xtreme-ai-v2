import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil, secrets } from 'base44:runtime';
import { crawlSite } from '../../shared/qaCrawler.ts';

const APP_URL = 'https://lead-growth-forge.base44.app';

// Classify a finding into a SystemOptimization category + recommended action.
function classifyFinding(finding: any): { category: string; action: string; severity: string } {
  switch (finding.type) {
    case 'js_exception':
    case 'navigation_error':
      return { category: 'failure', action: 'fix', severity: finding.severity };
    case 'network_failure':
      return { category: 'failure', action: 'fix', severity: finding.severity };
    case 'console_error':
      return { category: 'gap', action: 'fix', severity: finding.severity };
    case 'broken_image':
      return { category: 'gap', action: 'fix', severity: finding.severity };
    case 'slow_load':
      return { category: 'optimization', action: 'optimize', severity: finding.severity };
    case 'missing_seo':
      return { category: 'enhancement', action: 'enhance', severity: 'low' };
    case 'missing_schema':
      return { category: 'enhancement', action: 'enhance', severity: 'low' };
    default:
      return { category: 'gap', action: 'fix', severity: finding.severity };
  }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    // Allow workflow calls (no user) and admin UI calls.
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const scanId = `qa-${Date.now()}`;
    const startedAt = new Date().toISOString();

    // 1. CRAWL — real browser crawl of all public pages.
    console.log('[QA] Starting crawl...');
    const crawlResult = await crawlSite(APP_URL, { maxPages: 10 });
    console.log(`[QA] Crawled ${crawlResult.pages_crawled} pages, found ${crawlResult.findings.length} issues`);

    // 2. ANALYZE — write each finding to SystemOptimization + SystemAlert.
    const findings = crawlResult.findings;
    const criticalCount = findings.filter((f) => f.severity === 'critical').length;
    const highCount = findings.filter((f) => f.severity === 'high').length;

    // Bulk-create SystemOptimization records.
    if (findings.length > 0) {
      const optRecords = findings.map((f) => {
        const cls = classifyFinding(f);
        return {
          category: cls.category,
          severity: cls.severity,
          area: 'qa_crawl',
          title: `${f.type.replace(/_/g, ' ')} — ${f.url.replace(APP_URL, '')}`,
          description: f.message,
          recommended_action: cls.action,
          action_endpoint: '',
          action_payload: '',
          status: 'open',
          scan_id: scanId,
          evidence: JSON.stringify({ url: f.url, type: f.type }),
        };
      });
      try {
        await svc.entities.SystemOptimization.bulkCreate(optRecords);
      } catch (e) { console.error('[QA] Failed to write optimizations:', e); }
    }

    // Create SystemAlerts for critical findings.
    const criticalFindings = findings.filter((f) => f.severity === 'critical');
    if (criticalFindings.length > 0) {
      const alertRecords = criticalFindings.map((f) => ({
        alert_type: 'post_deploy_check_failure',
        severity: 'critical',
        step: 'qa_crawl',
        message: `${f.type}: ${f.message}`,
        recommended_action: 'fix',
        status: 'open',
        context: JSON.stringify({ url: f.url, scan_id: scanId }),
      }));
      try {
        await svc.entities.SystemAlert.bulkCreate(alertRecords);
      } catch (e) { console.error('[QA] Failed to write alerts:', e); }
    }

    // 3. RESEARCH — use LLM with web search to find optimization opportunities.
    let llmSummary = '';
    try {
      const findingsSummary = findings.slice(0, 20).map((f) =>
        `- [${f.severity}] ${f.type} on ${f.url.replace(APP_URL, '')}: ${f.message}`
      ).join('\n');

      const llmRes = await svc.integrations.Core.InvokeLLM({
        prompt: `You are a QA and optimization expert. Analyze these findings from a crawl of a web app and provide:
1. A prioritized list of the top 5 issues to fix (most critical first)
2. Best practices for each issue (research current solutions)
3. 3 optimization opportunities to improve the system

Findings:
${findingsSummary || 'No issues found — system is healthy.'}

Format as a concise markdown report with clear sections.`,
        add_context_from_internet: true,
      });
      llmSummary = typeof llmRes === 'string' ? llmRes : JSON.stringify(llmRes);
    } catch (e) {
      console.error('[QA] LLM research failed:', e);
      llmSummary = 'LLM research unavailable — see raw findings.';
    }

    // 4. SCORE — compute a simple health score from findings.
    const score = Math.max(0, Math.round(100 - (criticalCount * 15 + highCount * 5 + (findings.length - criticalCount - highCount) * 1)));

    // 5. REPORT — email admins the summary (non-blocking).
    const reportHtml = `
      <h2>QA Cycle Report — ${new Date().toLocaleString()}</h2>
      <p><strong>Pages crawled:</strong> ${crawlResult.pages_crawled}</p>
      <p><strong>Health score:</strong> ${score}/100</p>
      <p><strong>Findings:</strong> ${findings.length} total (${criticalCount} critical, ${highCount} high)</p>
      <h3>AI Analysis & Recommendations</h3>
      <pre style="white-space: pre-wrap; font-family: sans-serif;">${llmSummary}</pre>
      <p><em>Full details in the QA Agent dashboard.</em></p>
    `;

    waitUntil((async () => {
      try {
        const admins = await svc.entities.User.filter({ role: 'admin' }, '-created_date', 10);
        for (const admin of admins) {
          if (admin.email) {
            await svc.integrations.Core.SendEmail({
              to: admin.email,
              subject: `QA Report — Score ${score}/100 — ${findings.length} findings`,
              body: reportHtml,
            });
          }
        }
      } catch (e) { console.error('[QA] Email report failed:', e); }
    })());

    return Response.json({
      success: true,
      scan_id: scanId,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      pages_crawled: crawlResult.pages_crawled,
      method: crawlResult.method,
      findings_count: findings.length,
      critical_count: criticalCount,
      high_count: highCount,
      score,
      llm_summary: llmSummary.slice(0, 5000),
    });
  } catch (error) {
    console.error('qaRunFullCycle error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}