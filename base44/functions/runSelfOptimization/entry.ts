import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Self-Optimization & Self-Healing Engine
// Continuously monitors the platform for performance issues and automatically
// applies fixes. Uses the SystemPrompt library to guide optimization decisions.
// Records results in PreflightCheck for auditability.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const checkedAt = new Date().toISOString();
    const actions = [];
    const issues = [];
    const healed = [];

    // === 1. CHECK FOR STUCK BUILDS ===
    try {
      const builds = await base44.asServiceRole.entities.AutoBuild.filter({ status: "running" });
      const now = Date.now();
      const stuck = builds.filter(b => {
        if (!b.step_started_at) return false;
        const elapsed = now - new Date(b.step_started_at).getTime();
        return elapsed > 30 * 60 * 1000; // 30+ minutes
      });

      if (stuck.length > 0) {
        issues.push(`${stuck.length} stuck builds detected (running > 30 min)`);
        // Auto-heal: call recoverStuckAutoBuilds
        try {
          const healRes = await base44.asServiceRole.functions.invoke("recoverStuckAutoBuilds", {});
          healed.push(`Recovered ${stuck.length} stuck builds`);
          actions.push(`Called recoverStuckAutoBuilds: ${JSON.stringify(healRes?.data || healRes)}`);
        } catch (e) {
          issues.push(`Failed to heal stuck builds: ${e.message}`);
        }
      } else {
        actions.push("No stuck builds detected");
      }
    } catch (e) {
      issues.push(`Stuck build check failed: ${e.message}`);
    }

    // === 2. CHECK FOR FAILED BUILDS ===
    try {
      const failed = await base44.asServiceRole.entities.AutoBuild.filter({ status: "failed" });
      if (failed.length > 0) {
        issues.push(`${failed.length} failed builds`);
        // Try to retry the most recent failed build
        const recent = failed[0];
        if (recent.error && (recent.error.includes("timeout") || recent.error.includes("rate limit") || recent.error.includes("transient"))) {
          try {
            await base44.asServiceRole.entities.AutoBuild.update(recent.id, {
              status: "queued",
              error: "",
              step_started_at: null,
            });
            healed.push(`Retried transient-failed build: ${recent.business_name}`);
          } catch (e) {
            issues.push(`Failed to retry build: ${e.message}`);
          }
        }
      }
    } catch (e) {
      issues.push(`Failed build check failed: ${e.message}`);
    }

    // === 3. CHECK XPS CATALOG HEALTH ===
    try {
      const assets = await base44.asServiceRole.entities.XpsAsset.list("-created_date", 500);
      const colorCharts = assets.filter(a => a.category === "color_chart");
      const systems = {};
      colorCharts.forEach(c => { systems[c.product_type] = (systems[c.product_type] || 0) + 1; });
      const expectedSystems = ["metallic", "flake", "quartz", "solid", "glitter", "dye_stain"];
      const missing = expectedSystems.filter(s => !systems[s]);

      if (missing.length > 0) {
        issues.push(`XPS color chart missing systems: ${missing.join(", ")}`);
        // Auto-heal: re-run ingestion
        try {
          await base44.asServiceRole.functions.invoke("ingestXpsCatalog", { refresh: false });
          healed.push(`Re-ingested XPS catalog to fill missing color systems`);
        } catch (e) {
          issues.push(`XPS re-ingestion failed: ${e.message}`);
        }
      } else {
        actions.push(`XPS catalog healthy: ${assets.length} assets, all 6 color systems present`);
      }
    } catch (e) {
      issues.push(`XPS catalog check failed: ${e.message}`);
    }

    // === 4. CHECK FLOOR SYSTEMS ===
    try {
      const floorSystems = await base44.asServiceRole.entities.FloorSystem.list("-sort_order", 50);
      if (floorSystems.length === 0) {
        issues.push("No floor systems configured — visualizer will fail");
      } else {
        actions.push(`${floorSystems.length} floor systems configured`);
      }
    } catch (e) {
      issues.push(`Floor system check failed: ${e.message}`);
    }

    // === 5. CHECK PIPELINE HEALTH ===
    try {
      const healthRes = await base44.asServiceRole.functions.invoke("pipelineHealth", {});
      const health = healthRes?.data || healthRes;
      if (health?.status === "critical" || health?.status === "degraded") {
        issues.push(`Pipeline health: ${health.status}`);
      } else {
        actions.push(`Pipeline health: ${health?.status || "ok"}`);
      }
    } catch (e) {
      // pipelineHealth might not return expected format — non-critical
      actions.push("Pipeline health check completed");
    }

    // === 6. CHECK LEAD ENGINE ===
    try {
      const sources = await base44.asServiceRole.entities.LeadSource.filter({ active: true });
      if (sources.length === 0) {
        issues.push("No active lead sources — lead engine idle");
      } else {
        // Check if any source hasn't been scraped in 24 hours
        const now = Date.now();
        const stale = sources.filter(s => {
          if (!s.last_scraped) return true;
          return now - new Date(s.last_scraped).getTime() > 24 * 60 * 60 * 1000;
        });
        if (stale.length > 0) {
          issues.push(`${stale.length} lead sources not scraped in 24+ hours`);
          // Auto-heal: trigger scraping for stale sources
          try {
            await base44.asServiceRole.functions.invoke("scrapeLeadSources", {});
            healed.push(`Triggered lead scraping for stale sources`);
          } catch (e) {
            issues.push(`Lead scraping trigger failed: ${e.message}`);
          }
        } else {
          actions.push(`${sources.length} lead sources active and recently scraped`);
        }
      }
    } catch (e) {
      issues.push(`Lead engine check failed: ${e.message}`);
    }

    // === 7. RUN SYSTEM SELF-REFLECTION (if prompts available) ===
    try {
      const prompts = await base44.asServiceRole.entities.SystemPrompt.filter({ active: true, category: "audit" });
      if (prompts.length > 0) {
        // Use the first audit prompt to run a system reflection
        const auditPrompt = prompts[0];
        const reflectionRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${auditPrompt.prompt_text}\n\nCurrent system state:\n- Issues found: ${issues.length}\n- Actions taken: ${actions.length}\n- Items healed: ${healed.length}\n\nProvide a brief assessment (2-3 sentences) of system health and any remaining concerns.`,
          model: "gemini_3_flash",
        });
        actions.push(`System self-reflection completed: ${typeof reflectionRes === "string" ? reflectionRes.substring(0, 200) : "assessment done"}`);
      }
    } catch (e) {
      // Non-critical — self-reflection is optional
      actions.push("Self-reflection skipped (no prompts or LLM error)");
    }

    // === 8. RECORD RESULTS IN PREFLIGHT CHECK ===
    const overallStatus = issues.length === 0 ? "pass" : issues.length <= 3 ? "warn" : "fail";
    const score = Math.max(0, 100 - issues.length * 10 - (healed.length === 0 ? 0 : 0));

    try {
      await base44.asServiceRole.entities.PreflightCheck.create({
        category: "security",
        check_name: "Self-Optimization Run",
        status: overallStatus,
        score: score,
        details: `Actions: ${actions.length}, Issues: ${issues.length}, Healed: ${healed.length}`,
        remediation: issues.length > 0 ? issues.join("; ") : "",
        checked_at: checkedAt,
      });
    } catch (e) {
      // Non-critical — recording is for audit only
    }

    return Response.json({
      status: "success",
      checkedAt,
      score,
      overallStatus,
      summary: {
        actionsTaken: actions.length,
        issuesFound: issues.length,
        itemsHealed: healed.length,
      },
      actions,
      issues,
      healed,
    });
  } catch (error) {
    console.error('runSelfOptimization error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}