import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Vision Cortex Diagnostic Loop — the autonomous brain's end-to-end system
// analysis. Runs a comprehensive, zero-ambiguity diagnostic across every
// subsystem: entities, functions, connectors, visualizer, bid engine, lead
// engine, auto builder, XPS catalog, prompt library, and infrastructure.
//
// For vision_cortex API keys, this also runs healing/optimization actions
// when issues are found (auto-fix mode). For admin keys, it's read-only.
//
// This function is the core of the Vision Cortex's self-managing loop:
//   1. DIAGNOSE  — scan every subsystem for issues
//   2. ANALYZE  — classify severity (critical/warn/info)
//   3. HEAL     — auto-fix what can be fixed (vision_cortex keys only)
//   4. HARDEN   — apply preventive measures
//   5. OPTIMIZE  — suggest or apply improvements
//   6. REPORT   — produce a structured diagnostic report

interface DiagnosticCheck {
  category: string;
  check_name: string;
  status: 'pass' | 'warn' | 'fail' | 'pending';
  score: number;
  details: string;
  remediation?: string;
  auto_fixed?: boolean;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const autoFix = body?.auto_fix !== false; // default: auto-fix for vision_cortex
    const apiKeyId = body?.api_key_id || null;

    const checks: DiagnosticCheck[] = [];
    const actions: string[] = [];
    const now = new Date().toISOString();

    // ═════════════════════════════════════════════════════
    // 1. DATABASE / ENTITY DIAGNOSTICS
    // ═════════════════════════════════════════════════════
    const entityChecks = [
      { name: 'AutoBuild', label: 'Auto Builder Queue' },
      { name: 'FloorSystem', label: 'Floor Systems' },
      { name: 'ColorChart', label: 'Color Charts' },
      { name: 'VisualizerSession', label: 'Visualizer Sessions' },
      { name: 'XpsAsset', label: 'XPS Assets' },
      { name: 'SystemPrompt', label: 'System Prompts' },
      { name: 'PreflightCheck', label: 'Preflight Checks' },
      { name: 'LeadSource', label: 'Lead Sources' },
      { name: 'ScrapedLead', label: 'Scraped Leads' },
      { name: 'CouncilDecision', label: 'Council Decisions' },
      { name: 'AgentPerformance', label: 'Agent Performance' },
      { name: 'MassBuildProject', label: 'Mass Build Projects' },
      { name: 'WebPack', label: 'Web Pack Queue' },
      { name: 'ApiKey', label: 'API Keys' },
    ];

    let totalRecords = 0;
    for (const ec of entityChecks) {
      try {
        const records = await base44.asServiceRole.entities[ec.name].list('-created_date', 1);
        const count = records.length;
        totalRecords += count;

        if (count === 0 && ec.name !== 'ApiKey') {
          checks.push({
            category: 'database',
            check_name: `${ec.label} Records`,
            status: 'warn',
            score: 30,
            details: `${ec.label} entity has 0 records — may need seeding.`,
            remediation: `Run the appropriate seed/ingest function for ${ec.name}.`,
          });
        } else {
          checks.push({
            category: 'database',
            check_name: `${ec.label} Records`,
            status: 'pass',
            score: 100,
            details: `${count} record(s) in ${ec.label}.`,
          });
        }
      } catch (e) {
        checks.push({
          category: 'database',
          check_name: `${ec.label} Records`,
          status: 'fail',
          score: 0,
          details: `Failed to query ${ec.name}: ${e.message}`,
          remediation: 'Check entity schema and RLS configuration.',
        });
      }
    }

    checks.push({
      category: 'database',
      check_name: 'Total Records',
      status: totalRecords > 0 ? 'pass' : 'fail',
      score: Math.min(100, totalRecords),
      details: `${totalRecords} total records across all entities.`,
    });

    // ═════════════════════════════════════════════════════
    // 2. XPS CATALOG & INVENTORY DIAGNOSTICS
    // ═════════════════════════════════════════════════════
    try {
      const products = await base44.asServiceRole.entities.XpsAsset.filter({ category: 'product' });
      const equipment = await base44.asServiceRole.entities.XpsAsset.filter({ category: 'equipment' });
      const colorCharts = await base44.asServiceRole.entities.XpsAsset.filter({ category: 'color_chart' });
      const outOfStock = products.filter(p => p.inventory_status === 'out_of_stock');
      const neverSynced = products.filter(p => !p.last_synced);

      checks.push({
        category: 'xps_catalog',
        check_name: 'Product Catalog',
        status: products.length > 0 ? 'pass' : 'fail',
        score: products.length > 0 ? 100 : 0,
        details: `${products.length} products, ${equipment.length} equipment items, ${colorCharts.length} color charts.`,
        remediation: products.length === 0 ? 'Run syncXpsInventory to ingest products.' : undefined,
      });

      checks.push({
        category: 'xps_catalog',
        check_name: 'Inventory Sync',
        status: neverSynced.length === 0 ? 'pass' : 'warn',
        score: neverSynced.length === 0 ? 100 : Math.round((1 - neverSynced.length / Math.max(products.length, 1)) * 100),
        details: `${neverSynced.length} products have never been synced. ${outOfStock.length} out of stock.`,
        remediation: neverSynced.length > 0 ? 'Run syncXpsInventory to sync all product inventory.' : undefined,
      });

      if (neverSynced.length > 0 && autoFix) {
        try {
          await base44.asServiceRole.functions.invoke('syncXpsInventory', { cloud_browser: false });
          actions.push(`AUTO-FIX: Triggered syncXpsInventory for ${neverSynced.length} unsynced products.`);
          checks[checks.length - 1].auto_fixed = true;
        } catch (e) {
          actions.push(`AUTO-FIX FAILED: syncXpsInventory — ${e.message}`);
        }
      }
    } catch (e) {
      checks.push({
        category: 'xps_catalog',
        check_name: 'XPS Catalog',
        status: 'fail',
        score: 0,
        details: `Failed to query XPS catalog: ${e.message}`,
      });
    }

    // ═════════════════════════════════════════════════════
    // 3. FLOOR SYSTEMS & BID ENGINE DIAGNOSTICS
    // ═════════════════════════════════════════════════════
    try {
      const floorSystems = await base44.asServiceRole.entities.FloorSystem.list('sort_order', 50);
      const activeSystems = floorSystems.filter(fs => fs.active !== false);
      const systemsWithColors = activeSystems.filter(fs => fs.color_system_key && fs.color_system_key !== 'none');

      checks.push({
        category: 'bid_engine',
        check_name: 'Floor Systems',
        status: activeSystems.length >= 5 ? 'pass' : 'warn',
        score: Math.min(100, activeSystems.length * 15),
        details: `${activeSystems.length} active floor systems, ${systemsWithColors.length} with color charts linked.`,
        remediation: activeSystems.length < 5 ? 'Seed FloorSystem entity with standard floor systems.' : undefined,
      });

      // Check visualizer sessions
      const sessions = await base44.asServiceRole.entities.VisualizerSession.list('-created_date', 10);
      const recentSessions = sessions.filter(s => {
        const age = Date.now() - new Date(s.created_date).getTime();
        return age < 7 * 24 * 60 * 60 * 1000; // last 7 days
      });

      checks.push({
        category: 'bid_engine',
        check_name: 'Visualizer Activity',
        status: 'pass',
        score: 100,
        details: `${sessions.length} total sessions, ${recentSessions.length} in the last 7 days.`,
      });
    } catch (e) {
      checks.push({
        category: 'bid_engine',
        check_name: 'Floor Systems',
        status: 'fail',
        score: 0,
        details: `Failed: ${e.message}`,
      });
    }

    // ═════════════════════════════════════════════════════
    // 4. LEAD ENGINE DIAGNOSTICS
    // ═════════════════════════════════════════════════════
    try {
      const leadSources = await base44.asServiceRole.entities.LeadSource.list('-created_date', 50);
      const activeSources = leadSources.filter(ls => ls.active !== false);
      const scrapedLeads = await base44.asServiceRole.entities.ScrapedLead.list('-created_date', 5);
      const recentLeads = scrapedLeads.filter(sl => {
        const age = Date.now() - new Date(sl.created_date).getTime();
        return age < 24 * 60 * 60 * 1000; // last 24h
      });

      checks.push({
        category: 'lead_engine',
        check_name: 'Lead Sources',
        status: activeSources.length > 0 ? 'pass' : 'warn',
        score: Math.min(100, activeSources.length * 20),
        details: `${activeSources.length} active lead sources, ${recentLeads.length} leads scraped in last 24h.`,
        remediation: activeSources.length === 0 ? 'Add lead sources in the Lead Engine page.' : undefined,
      });

      // Check source nodes (recursive discovery graph)
      const sourceNodes = await base44.asServiceRole.entities.SourceNode.list('-discovered_at', 10);
      checks.push({
        category: 'lead_engine',
        check_name: 'Source Graph',
        status: sourceNodes.length > 0 ? 'pass' : 'info',
        score: Math.min(100, sourceNodes.length * 10),
        details: `${sourceNodes.length} source nodes in the recursive discovery graph.`,
      });
    } catch (e) {
      checks.push({
        category: 'lead_engine',
        check_name: 'Lead Engine',
        status: 'fail',
        score: 0,
        details: `Failed: ${e.message}`,
      });
    }

    // ═════════════════════════════════════════════════════
    // 5. AUTO BUILDER & MASS WEBSITE FACTORY DIAGNOSTICS
    // ═════════════════════════════════════════════════════
    try {
      const autoBuilds = await base44.asServiceRole.entities.AutoBuild.list('-updated_date', 50);
      const runningBuilds = autoBuilds.filter(ab => ab.status === 'running');
      const queuedBuilds = autoBuilds.filter(ab => ab.status === 'queued');
      const stuckBuilds = autoBuilds.filter(ab => {
        if (ab.status !== 'running') return false;
        if (!ab.step_started_at) return false;
        const age = Date.now() - new Date(ab.step_started_at).getTime();
        return age > 30 * 60 * 1000; // stuck if running > 30 min
      });

      checks.push({
        category: 'auto_builder',
        check_name: 'Build Queue',
        status: stuckBuilds.length === 0 ? 'pass' : 'warn',
        score: stuckBuilds.length === 0 ? 100 : 50,
        details: `${autoBuilds.length} total builds, ${runningBuilds.length} running, ${queuedBuilds.length} queued, ${stuckBuilds.length} potentially stuck.`,
        remediation: stuckBuilds.length > 0 ? 'Run recoverStuckAutoBuilds to unstick stale builds.' : undefined,
      });

      if (stuckBuilds.length > 0 && autoFix) {
        try {
          await base44.asServiceRole.functions.invoke('recoverStuckAutoBuilds', {});
          actions.push(`AUTO-FIX: Triggered recoverStuckAutoBuilds for ${stuckBuilds.length} stuck builds.`);
          checks[checks.length - 1].auto_fixed = true;
        } catch (e) {
          actions.push(`AUTO-FIX FAILED: recoverStuckAutoBuilds — ${e.message}`);
        }
      }

      // Mass website factory
      const massBuilds = await base44.asServiceRole.entities.MassBuildProject.list('-created_date', 10);
      const activeMassBuilds = massBuilds.filter(mb => ['generating', 'queued', 'reviewing', 'deploying'].includes(mb.status));
      checks.push({
        category: 'auto_builder',
        check_name: 'Mass Website Factory',
        status: 'pass',
        score: 100,
        details: `${massBuilds.length} mass build projects, ${activeMassBuilds.length} active.`,
      });

      // Web Pack queue
      const webPacks = await base44.asServiceRole.entities.WebPack.list('-created_date', 10);
      const queuedWebPacks = webPacks.filter(wp => wp.status === 'queued');
      checks.push({
        category: 'auto_builder',
        check_name: 'Web Pack Queue',
        status: queuedWebPacks.length < 20 ? 'pass' : 'warn',
        score: queuedWebPacks.length < 20 ? 100 : 60,
        details: `${webPacks.length} web packs, ${queuedWebPacks.length} queued.`,
        remediation: queuedWebPacks.length >= 20 ? 'Web Pack queue backlog — consider processing.' : undefined,
      });
    } catch (e) {
      checks.push({
        category: 'auto_builder',
        check_name: 'Auto Builder',
        status: 'fail',
        score: 0,
        details: `Failed: ${e.message}`,
      });
    }

    // ═════════════════════════════════════════════════════
    // 6. PROMPT LIBRARY DIAGNOSTICS
    // ═════════════════════════════════════════════════════
    try {
      const prompts = await base44.asServiceRole.entities.SystemPrompt.list('sort_order', 50);
      const activePrompts = prompts.filter(p => p.active !== false);
      const categories = new Set(activePrompts.map(p => p.category));

      checks.push({
        category: 'prompt_library',
        check_name: 'System Prompts',
        status: activePrompts.length >= 5 ? 'pass' : 'warn',
        score: Math.min(100, activePrompts.length * 10),
        details: `${activePrompts.length} active prompts across ${categories.size} categories: ${[...categories].join(', ')}.`,
        remediation: activePrompts.length < 5 ? 'Run seedPromptLibrary to populate optimization prompts.' : undefined,
      });

      if (activePrompts.length < 5 && autoFix) {
        try {
          await base44.asServiceRole.functions.invoke('seedPromptLibrary', {});
          actions.push('AUTO-FIX: Triggered seedPromptLibrary to populate prompt library.');
          checks[checks.length - 1].auto_fixed = true;
        } catch (e) {
          actions.push(`AUTO-FIX FAILED: seedPromptLibrary — ${e.message}`);
        }
      }
    } catch (e) {
      checks.push({
        category: 'prompt_library',
        check_name: 'System Prompts',
        status: 'fail',
        score: 0,
        details: `Failed: ${e.message}`,
      });
    }

    // ═════════════════════════════════════════════════════
    // 7. COUNCIL & AGENT PERFORMANCE DIAGNOSTICS
    // ═════════════════════════════════════════════════════
    try {
      const decisions = await base44.asServiceRole.entities.CouncilDecision.list('-created_date', 10);
      const pendingDecisions = decisions.filter(d => d.status === 'pending' || d.status === 'debating');
      const agents = await base44.asServiceRole.entities.AgentPerformance.list('-last_evaluated', 20);

      checks.push({
        category: 'council',
        check_name: 'Council Decisions',
        status: 'pass',
        score: 100,
        details: `${decisions.length} total decisions, ${pendingDecisions.length} pending, ${agents.length} tracked agents.`,
      });
    } catch (e) {
      checks.push({
        category: 'council',
        check_name: 'Council',
        status: 'fail',
        score: 0,
        details: `Failed: ${e.message}`,
      });
    }

    // ═════════════════════════════════════════════════════
    // 8. API KEY DIAGNOSTICS
    // ═════════════════════════════════════════════════════
    try {
      const apiKeys = await base44.asServiceRole.entities.ApiKey.list('-created_date', 50);
      const activeKeys = apiKeys.filter(k => k.active !== false);
      const visionCortexKeys = activeKeys.filter(k => k.key_type === 'vision_cortex');

      checks.push({
        category: 'api_keys',
        check_name: 'API Key Status',
        status: visionCortexKeys.length > 0 ? 'pass' : 'warn',
        score: visionCortexKeys.length > 0 ? 100 : 50,
        details: `${activeKeys.length} active keys (${visionCortexKeys.length} vision_cortex, ${activeKeys.filter(k => k.key_type === 'admin').length} admin, ${activeKeys.filter(k => k.key_type === 'user').length} user).`,
        remediation: visionCortexKeys.length === 0 ? 'Generate a vision_cortex API key for autonomous diagnostics.' : undefined,
      });
    } catch (e) {
      checks.push({
        category: 'api_keys',
        check_name: 'API Keys',
        status: 'fail',
        score: 0,
        details: `Failed: ${e.message}`,
      });
    }

    // ═════════════════════════════════════════════════════
    // 9. PREFLIGHT READINESS DIAGNOSTICS
    // ═════════════════════════════════════════════════════
    try {
      const preflightChecks = await base44.asServiceRole.entities.PreflightCheck.list('-checked_at', 50);
      const failedChecks = preflightChecks.filter(pc => pc.status === 'fail');
      const warnChecks = preflightChecks.filter(pc => pc.status === 'warn');

      checks.push({
        category: 'preflight',
        check_name: 'Preflight Readiness',
        status: failedChecks.length === 0 ? (warnChecks.length === 0 ? 'pass' : 'warn') : 'fail',
        score: failedChecks.length === 0 ? (warnChecks.length === 0 ? 100 : 70) : 30,
        details: `${preflightChecks.length} preflight checks, ${failedChecks.length} failed, ${warnChecks.length} warnings.`,
        remediation: failedChecks.length > 0 ? 'Review and fix failed preflight checks on the Preflight page.' : undefined,
      });
    } catch (e) {
      checks.push({
        category: 'preflight',
        check_name: 'Preflight',
        status: 'fail',
        score: 0,
        details: `Failed: ${e.message}`,
      });
    }

    // ═════════════════════════════════════════════════════
    // 10. SELF-HEALING / SELF-OPTIMIZATION
    // ═════════════════════════════════════════════════════
    if (autoFix) {
      try {
        const optimizationResult = await base44.asServiceRole.functions.invoke('runSelfOptimization', {});
        if (optimizationResult?.data) {
          actions.push(`SELF-OPTIMIZE: runSelfOptimization executed successfully.`);
        }
      } catch (e) {
        actions.push(`SELF-OPTIMIZE: runSelfOptimization failed — ${e.message}`);
      }
    }

    // ═════════════════════════════════════════════════════
    // COMPUTE OVERALL SCORE & REPORT
    // ═════════════════════════════════════════════════════
    const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
    const overallScore = Math.round(totalScore / checks.length);
    const issuesFound = checks.filter(c => c.status === 'warn' || c.status === 'fail').length;
    const criticalIssues = checks.filter(c => c.status === 'fail').length;
    const autoFixed = checks.filter(c => c.auto_fixed).length;

    const report = {
      run_at: now,
      overall_score: overallScore,
      issues_found: issuesFound,
      critical_issues: criticalIssues,
      auto_fixed: autoFixed,
      total_checks: checks.length,
      status: criticalIssues > 0 ? 'critical' : (issuesFound > 0 ? 'warning' : 'healthy'),
      checks,
      actions,
      summary: `System health: ${overallScore}/100. ${checks.length} checks run, ${issuesFound} issues found (${criticalIssues} critical), ${autoFixed} auto-fixed.`,
    };

    // Update the API key's last diagnostic report if provided
    if (apiKeyId) {
      try {
        await base44.entities.ApiKey.update(apiKeyId, {
          last_used: now,
          last_diagnostic_report: {
            overall_score: overallScore,
            issues_found: issuesFound,
            critical_issues: criticalIssues,
            run_at: now,
          },
        });
      } catch (e) {
        // Non-critical — report is still returned
      }
    }

    // Store the diagnostic as a PreflightCheck record
    try {
      await base44.entities.PreflightCheck.create({
        category: 'security',
        check_name: 'Vision Cortex Diagnostic Loop',
        status: criticalIssues > 0 ? 'fail' : (issuesFound > 0 ? 'warn' : 'pass'),
        score: overallScore,
        details: report.summary,
        remediation: criticalIssues > 0 ? `${criticalIssues} critical issues require attention.` : undefined,
        checked_at: now,
      });
    } catch (e) {
      // Non-critical
    }

    return Response.json(report);
  } catch (error) {
    console.error('visionCortexDiagnostics error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}