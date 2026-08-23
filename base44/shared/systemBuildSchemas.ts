// ============================================================
// systemBuildSchemas.ts — Strict schema validation for every
// generated spec. Goes beyond field presence (systemBuildValidation.ts)
// to enforce types, enums, min lengths, and structural requirements.
// Returns { valid, errors, warnings } — same interface as the
// existing validators so they compose cleanly.
// ============================================================

export interface StrictValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 strictness score
}

function pass(): StrictValidationResult {
  return { valid: true, errors: [], warnings: [], score: 100 };
}

function fail(errors: string[], warnings: string[] = [], score = 0): StrictValidationResult {
  return { valid: errors.length === 0, errors, warnings, score };
}

// ── Architecture ─────────────────────────────────────────────────────────

export function strictValidateArchitecture(spec: any): StrictValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!spec || typeof spec !== "object") return fail(["Architecture spec is empty or not an object"]);

  // Required string fields
  if (typeof spec.concept !== "string" || spec.concept.length < 10)
    errors.push("'concept' must be a string of at least 10 characters");
  if (typeof spec.summary !== "string" || spec.summary.length < 20)
    warnings.push("'summary' should be at least 20 characters for a usable executive summary");

  // Tech stack — must be an object with at least frontend + backend
  if (!spec.tech_stack || typeof spec.tech_stack !== "object")
    errors.push("'tech_stack' must be an object");
  else {
    if (typeof spec.tech_stack.frontend !== "string" || spec.tech_stack.frontend.length < 2)
      errors.push("tech_stack.frontend must be a non-empty string");
    if (typeof spec.tech_stack.backend !== "string" || spec.tech_stack.backend.length < 2)
      errors.push("tech_stack.backend must be a non-empty string");
  }

  // Pages — must be a non-empty array with name + route
  if (!Array.isArray(spec.pages) || spec.pages.length === 0)
    errors.push("'pages' must be a non-empty array");
  else {
    spec.pages.forEach((p: any, i: number) => {
      if (typeof p.name !== "string" || !p.name.trim())
        errors.push(`pages[${i}].name must be a non-empty string`);
      if (typeof p.route !== "string" || !p.route.startsWith("/"))
        errors.push(`pages[${i}].route must start with '/'`);
      if (typeof p.purpose !== "string" || p.purpose.length < 5)
        warnings.push(`pages[${i}].purpose should describe the page's role (min 5 chars)`);
    });
  }

  // Data models — should have at least one
  if (!Array.isArray(spec.data_models) || spec.data_models.length === 0)
    warnings.push("No data_models defined — data model step will design from scratch");
  else {
    spec.data_models.forEach((dm: any, i: number) => {
      if (typeof dm.name !== "string" || !dm.name.trim())
        errors.push(`data_models[${i}].name must be a non-empty string`);
      if (!Array.isArray(dm.fields) || dm.fields.length === 0)
        warnings.push(`data_models[${i}] ('${dm.name || i}') has no fields`);
    });
  }

  // Features — should have at least one
  if (!Array.isArray(spec.features) || spec.features.length === 0)
    warnings.push("No features defined");
  else {
    spec.features.forEach((f: any, i: number) => {
      if (typeof f.name !== "string" || !f.name.trim())
        errors.push(`features[${i}].name must be a non-empty string`);
    });
  }

  // Integrations — optional but should be array
  if (spec.integrations !== undefined && !Array.isArray(spec.integrations))
    warnings.push("'integrations' should be an array if present");

  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 85) : 0;
  return fail(errors, warnings, score);
}

// ── Data Model ───────────────────────────────────────────────────────────

export function strictValidateDataModel(spec: any): StrictValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!spec || typeof spec !== "object") return fail(["Data model spec is empty or not an object"]);

  if (!Array.isArray(spec.entities) || spec.entities.length === 0)
    errors.push("'entities' must be a non-empty array");
  else {
    const validTypes = ["string", "number", "boolean", "date", "date-time", "object", "array", "reference", "text", "integer", "float", "uuid", "email", "url", "enum"];
    spec.entities.forEach((e: any, i: number) => {
      if (typeof e.name !== "string" || !e.name.trim())
        errors.push(`entities[${i}].name must be a non-empty string`);
      if (!Array.isArray(e.fields) || e.fields.length === 0)
        errors.push(`entities[${i}] ('${e.name || i}') must have at least one field`);
      else {
        e.fields.forEach((f: any, j: number) => {
          if (typeof f.name !== "string" || !f.name.trim())
            errors.push(`entities[${i}].fields[${j}].name must be a non-empty string`);
          if (typeof f.type !== "string" || !f.type.trim())
            errors.push(`entities[${i}].fields[${j}].type must be a non-empty string`);
          else if (!validTypes.includes(f.type.toLowerCase()) && !f.type.includes("[]"))
            warnings.push(`entities[${i}].fields[${j}].type '${f.type}' is not a standard type`);
        });
      }
    });
  }

  if (!Array.isArray(spec.relationships))
    warnings.push("No 'relationships' array — relationships won't be displayed");
  else {
    spec.relationships.forEach((r: any, i: number) => {
      if (typeof r.from !== "string" || !r.from.trim())
        errors.push(`relationships[${i}].from must be a non-empty string`);
      if (typeof r.to !== "string" || !r.to.trim())
        errors.push(`relationships[${i}].to must be a non-empty string`);
      if (typeof r.type !== "string" || !["one-to-one", "one-to-many", "many-to-one", "many-to-many"].includes(r.type))
        warnings.push(`relationships[${i}].type should be one of: one-to-one, one-to-many, many-to-one, many-to-many`);
    });
  }

  if (!Array.isArray(spec.api_endpoints))
    warnings.push("No 'api_endpoints' array — API endpoints won't be displayed");
  else {
    spec.api_endpoints.forEach((ep: any, i: number) => {
      if (typeof ep.method !== "string" || !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(ep.method.toUpperCase()))
        errors.push(`api_endpoints[${i}].method must be a valid HTTP method`);
      if (typeof ep.path !== "string" || !ep.path.startsWith("/"))
        errors.push(`api_endpoints[${i}].path must start with '/'`);
    });
  }

  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 85) : 0;
  return fail(errors, warnings, score);
}

// ── UI System ────────────────────────────────────────────────────────────

export function strictValidateUiSystem(spec: any): StrictValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!spec || typeof spec !== "object") return fail(["UI system spec is empty or not an object"]);

  // Color palette — must have primary as a valid hex
  if (!spec.color_palette || typeof spec.color_palette !== "object")
    errors.push("'color_palette' must be an object");
  else {
    const hexRegex = /^#[0-9a-fA-F]{3,8}$/;
    if (typeof spec.color_palette.primary !== "string" || !hexRegex.test(spec.color_palette.primary))
      errors.push("color_palette.primary must be a valid hex color (e.g. #D4FF4D)");
    if (spec.color_palette.background && !hexRegex.test(spec.color_palette.background))
      warnings.push("color_palette.background should be a valid hex color");
    if (!spec.color_palette.text)
      warnings.push("color_palette.text not specified — text color is important for the design system");
  }

  // Typography — should have heading + body fonts
  if (!spec.typography || typeof spec.typography !== "object")
    warnings.push("Missing 'typography' — typography system won't be displayed");
  else {
    if (typeof spec.typography.font_heading !== "string" || !spec.typography.font_heading.trim())
      warnings.push("typography.font_heading should be specified");
    if (typeof spec.typography.font_body !== "string" || !spec.typography.font_body.trim())
      warnings.push("typography.font_body should be specified");
  }

  // Components — should have at least 3
  if (!Array.isArray(spec.components) || spec.components.length < 3)
    warnings.push("At least 3 components should be defined for a usable design system");
  else {
    spec.components.forEach((c: any, i: number) => {
      if (typeof c.name !== "string" || !c.name.trim())
        errors.push(`components[${i}].name must be a non-empty string`);
    });
  }

  // Layout patterns — should have at least 1
  if (!Array.isArray(spec.layout_patterns) || spec.layout_patterns.length === 0)
    warnings.push("No layout_patterns defined");

  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 80) : 0;
  return fail(errors, warnings, score);
}

// ── Code Manifest ────────────────────────────────────────────────────────

export function strictValidateCodeManifest(spec: any): StrictValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!spec || typeof spec !== "object") return fail(["Code manifest is empty or not an object"]);

  if (typeof spec.framework !== "string" || spec.framework.trim().length < 2)
    errors.push("'framework' must be a non-empty string");

  if (typeof spec.repo_name !== "string" || spec.repo_name.trim().length < 2)
    warnings.push("'repo_name' should be specified");

  if (!Array.isArray(spec.files) || spec.files.length === 0)
    errors.push("'files' must be a non-empty array");
  else {
    const validCategories = ["config", "page", "component", "hook", "entity", "function", "style", "route", "test", "doc", "util", "api", "lib"];
    let filesWithContent = 0;
    spec.files.forEach((f: any, i: number) => {
      if (typeof f.path !== "string" || !f.path.trim())
        errors.push(`files[${i}].path must be a non-empty string`);
      if (typeof f.category !== "string" || !f.category.trim())
        warnings.push(`files[${i}] ('${f.path || i}') missing 'category'`);
      else if (!validCategories.includes(f.category))
        warnings.push(`files[${i}].category '${f.category}' is not a standard category`);
      // Phase 2: content is now required for real code generation
      if (typeof f.content === "string" && f.content.trim().length > 10)
        filesWithContent++;
      else
        warnings.push(`files[${i}] ('${f.path || i}') has no real 'content' — actual code missing`);
    });
    // At least 50% of files should have real content
    if (filesWithContent < spec.files.length * 0.5)
      warnings.push(`Only ${filesWithContent}/${spec.files.length} files have real content — codegen quality below target`);
  }

  if (!Array.isArray(spec.build_steps) || spec.build_steps.length === 0)
    warnings.push("No 'build_steps' array — build process unclear");

  if (typeof spec.estimated_loc !== "number" || spec.estimated_loc <= 0)
    warnings.push("'estimated_loc' should be a positive number");

  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 80) : 0;
  return fail(errors, warnings, score);
}

// ── Deployment ───────────────────────────────────────────────────────────

export function strictValidateDeployment(spec: any): StrictValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!spec || typeof spec !== "object") return fail(["Deployment spec is empty or not an object"]);

  if (typeof spec.live_url !== "string" || !spec.live_url.startsWith("http"))
    errors.push("'live_url' must be a valid URL starting with http");

  if (typeof spec.platform !== "string" || !spec.platform.trim())
    warnings.push("'platform' should be specified");

  if (!spec.build_config || typeof spec.build_config !== "object")
    warnings.push("Missing 'build_config'");
  else {
    if (typeof spec.build_config.framework !== "string")
      warnings.push("build_config.framework should be specified");
    if (typeof spec.build_config.build_command !== "string")
      warnings.push("build_config.build_command should be specified");
  }

  if (!Array.isArray(spec.env_vars))
    warnings.push("No 'env_vars' array — environment variables not configured");
  else {
    spec.env_vars.forEach((v: any, i: number) => {
      if (typeof v.key !== "string" || !v.key.trim())
        errors.push(`env_vars[${i}].key must be a non-empty string`);
    });
  }

  if (!Array.isArray(spec.routes) || spec.routes.length === 0)
    warnings.push("No 'routes' array — routing configuration missing");

  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 80) : 0;
  return fail(errors, warnings, score);
}