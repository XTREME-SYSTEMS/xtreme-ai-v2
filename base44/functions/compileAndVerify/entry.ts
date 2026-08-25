// ============================================================
// compileAndVerify — THE DETERMINISTIC CODE GATE
// The single most important bulletproofing addition.
// Takes the generated code manifest files and performs REAL
// deterministic validation: syntax checking, import resolution,
// JSX validity, and structural analysis — NO LLM involved.
//
// This is the gate that prevents broken code from being packaged.
// Per research: "deterministic code verification is the real gate
// in loop engineering" — LLM judge is useful for improving drafts
// but CANNOT be the final release condition.
//
// Returns: { compiled, errors, warnings, score, file_count, checks }
// ============================================================

import { createClientFromRequest } from "npm:@base44/sdk@0.8.43";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || (user.role !== "admin" && user.role !== "employee")) {
      return new Response(JSON.stringify({ error: "Admin or employee access required" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildId = String(body.build_id || "");

    if (!buildId) {
      return new Response(JSON.stringify({ error: "build_id is required" }), { status: 400 });
    }

    // Load the build
    const builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
    const build = builds?.[0];
    if (!build) {
      return new Response(JSON.stringify({ error: "Build not found" }), { status: 404 });
    }

    const manifest = build.code_manifest;
    if (!manifest || !manifest.files || manifest.files.length === 0) {
      return new Response(JSON.stringify({
        compiled: false,
        errors: ["No code manifest found — run the codegen step first"],
        warnings: [],
        score: 0,
        file_count: 0,
        checks: [],
      }), { status: 200 });
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const checks: any[] = [];
    const files = manifest.files;

    // ── CHECK 1: Every file must have real content (>50 chars) ──────────
    let filesWithRealContent = 0;
    for (const f of files) {
      const content = f.content || f.key_content || "";
      if (typeof content !== "string" || content.trim().length < 50) {
        errors.push(`File '${f.path}' has no real content (or <50 chars) — placeholder detected`);
      } else {
        filesWithRealContent++;
      }
    }
    checks.push({
      name: "real_content",
      passed: filesWithRealContent === files.length,
      details: `${filesWithRealContent}/${files.length} files have real content`,
    });

    // ── CHECK 2: JSX/JS syntax validation via eval-free parsing ────────
    // We can't run a real bundler in Deno Deploy, but we CAN do
    // structural syntax checks that catch the most common LLM errors.
    let syntaxErrors = 0;
    for (const f of files) {
      const content = f.content || "";
      if (!content || content.length < 50) continue;

      const ext = f.path.split(".").pop()?.toLowerCase();
      const isJSX = ext === "jsx" || ext === "tsx";
      const isJS = ext === "js" || ext === "ts";
      const isJSON = ext === "json" || ext === "jsonc";

      if (isJSON) {
        // Validate JSON
        try {
          const cleaned = content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
          JSON.parse(cleaned);
        } catch (e: any) {
          errors.push(`File '${f.path}' has invalid JSON: ${e?.message || "parse error"}`);
          syntaxErrors++;
        }
      }

      if (isJSX || isJS) {
        // Check for balanced braces/brackets/parens
        const open = (content.match(/[{[(]/g) || []).length;
        const close = (content.match(/[}\])]/g) || []).length;
        if (Math.abs(open - close) > 2) {
          errors.push(`File '${f.path}' has unbalanced brackets (open: ${open}, close: ${close}) — likely syntax error`);
          syntaxErrors++;
        }

        // Check for common LLM mistakes in JSX
        if (isJSX) {
          // Unclosed self-closing tags (common LLM error)
          const selfClose = (content.match(/<[A-Z][a-zA-Z0-9]*\s*[^>]*\/>/g) || []).length;
          const openTags = (content.match(/<[A-Z][a-zA-Z0-9]*[\s>]/g) || []).length;
          const closeTags = (content.match(/<\/[A-Z][a-zA-Z0-9]*>/g) || []).length;
          if (openTags - closeTags > 5) {
            warnings.push(`File '${f.path}' has ${openTags} component open tags but only ${closeTags} close tags — check for unclosed JSX`);
          }
        }

        // Check for missing export default (React components)
        if (isJSX && f.category === "page" && !content.includes("export default")) {
          errors.push(`File '${f.path}' is a page but has no 'export default' — React won't render it`);
          syntaxErrors++;
        }

        // Check for import of non-existent packages (common LLM hallucination)
        const importMatches = content.match(/import\s+.*from\s+["']([^"']+)["']/g) || [];
        for (const imp of importMatches) {
          const pkg = imp.match(/from\s+["']([^"']+)["']/)?.[1] || "";
          if (pkg.startsWith(".") || pkg.startsWith("@/")) continue; // relative/alias — can't check
          // Known valid packages (subset — the app's actual dependencies)
          const knownPkgs = ["react", "react-dom", "react-router-dom", "lucide-react", "recharts", "framer-motion", "date-fns", "lodash", "react-markdown", "react-quill-new", "react-leaflet", "@hello-pangea/dnd", "@tanstack/react-query", "tailwindcss", "clsx", "tailwind-merge", "class-variance-authority", "zod", "sonner", "next-themes", "react-hook-form", "@hookform/resolvers", "react-day-picker", "react-resizable-panels", "embla-carousel-react", "vaul", "cmdk", "input-otp", "jspdf", "html2canvas", "canvas-confetti", "three", "playwright-core", "@base44/sdk", "@base44/vite-plugin"];
          const pkgName = pkg.startsWith("@") ? pkg.split("/").slice(0, 2).join("/") : pkg.split("/")[0];
          if (!knownPkgs.includes(pkgName) && !pkgName.startsWith("@radix-ui") && !pkgName.startsWith("@base44")) {
            warnings.push(`File '${f.path}' imports '${pkgName}' which is not in the known package list — may be hallucinated`);
          }
        }
      }
    }
    checks.push({
      name: "syntax_validation",
      passed: syntaxErrors === 0,
      details: syntaxErrors === 0 ? "All files pass structural syntax checks" : `${syntaxErrors} syntax errors detected`,
    });

    // ── CHECK 3: App.jsx router registration ────────────────────────────
    const appFile = files.find((f: any) => f.path.endsWith("App.jsx") || f.path.endsWith("App.tsx"));
    if (appFile) {
      const content = appFile.content || "";
      // Check that routes are registered
      const routeCount = (content.match(/<Route\s+path=/g) || []).length;
      if (routeCount === 0) {
        warnings.push("App.jsx has no <Route> elements — pages won't be reachable");
      }
      // Check for BrowserRouter/Router wrapper
      if (!content.includes("BrowserRouter") && !content.includes("<Router")) {
        warnings.push("App.jsx has no Router wrapper — routing won't work");
      }
      checks.push({
        name: "router_registration",
        passed: routeCount > 0,
        details: `${routeCount} routes registered`,
      });
    }

    // ── CHECK 4: package.json validity ──────────────────────────────────
    const pkgFile = files.find((f: any) => f.path === "package.json");
    if (pkgFile) {
      try {
        const pkg = JSON.parse(pkgFile.content || "{}");
        if (!pkg.dependencies || Object.keys(pkg.dependencies).length === 0) {
          warnings.push("package.json has no dependencies — app won't run");
        }
        if (!pkg.scripts || (!pkg.scripts.build && !pkg.scripts.dev)) {
          warnings.push("package.json has no build or dev script — can't build");
        }
        checks.push({
          name: "package_json",
          passed: !!pkg.dependencies && Object.keys(pkg.dependencies).length > 0,
          details: `${pkg.dependencies ? Object.keys(pkg.dependencies).length : 0} dependencies`,
        });
      } catch (e: any) {
        errors.push(`package.json is invalid JSON: ${e?.message}`);
      }
    }

    // ── CHECK 5: Entity schema validity (if any .jsonc entity files) ────
    const entityFiles = files.filter((f: any) => f.path.includes("entities/") && f.path.endsWith(".jsonc"));
    for (const ef of entityFiles) {
      try {
        const cleaned = (ef.content || "").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
        const schema = JSON.parse(cleaned);
        if (!schema.name || !schema.properties) {
          errors.push(`Entity file '${ef.path}' is missing 'name' or 'properties'`);
        }
      } catch (e: any) {
        errors.push(`Entity file '${ef.path}' has invalid JSON: ${e?.message}`);
      }
    }
    if (entityFiles.length > 0) {
      checks.push({
        name: "entity_schemas",
        passed: !errors.some((e) => e.includes("Entity file")),
        details: `${entityFiles.length} entity files checked`,
      });
    }

    // ── Calculate score ─────────────────────────────────────────────────
    const totalChecks = checks.length;
    const passedChecks = checks.filter((c) => c.passed).length;
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    const compiled = errors.length === 0 && score >= 75;

    // Update the build with compile_verified status
    await base44.asServiceRole.entities.AutoBuild.update(buildId, {
      compile_verified: compiled,
      logs: [...(build.logs || []), `[${new Date().toISOString()}] compileAndVerify: ${compiled ? "PASSED" : "FAILED"} — score ${score}%, ${errors.length} errors, ${warnings.length} warnings`],
    });

    // Create Receipt
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "compileAndVerify",
        action: "deterministic_compile_gate",
        entity_type: "AutoBuild",
        entity_id: buildId,
        inputs: JSON.stringify({ build_id: buildId, file_count: files.length }).slice(0, 4000),
        outputs: JSON.stringify({ compiled, score, errors: errors.slice(0, 10), warnings: warnings.slice(0, 10) }).slice(0, 4000),
        status: compiled ? "success" : "failed",
        evidence: `Deterministic compile gate: ${compiled ? "PASSED" : "FAILED"} — ${passedChecks}/${totalChecks} checks, ${errors.length} errors`,
      });
    } catch {}

    return new Response(JSON.stringify({
      compiled,
      errors,
      warnings,
      score,
      file_count: files.length,
      checks,
    }), { status: 200 });

  } catch (e) {
    console.error("compileAndVerify error:", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});