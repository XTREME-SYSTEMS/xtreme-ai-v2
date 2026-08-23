// ============================================================
// systemBuildValidation.ts — Spec validation for the system-build
// pipeline. Each validator checks that the LLM returned the
// minimum required fields for the spec to be usable by downstream
// steps. Returns { valid, errors, warnings }.
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function base(): ValidationResult {
  return { valid: true, errors: [], warnings: [] };
}

export function validateArchitectureSpec(spec: any): ValidationResult {
  const r = base();
  if (!spec || typeof spec !== "object") {
    return { valid: false, errors: ["Architecture spec is empty or not an object"], warnings: [] };
  }
  if (!spec.concept) r.errors.push("Missing 'concept' — the one-sentence product concept");
  if (!spec.summary) r.warnings.push("Missing 'summary' — executive summary");
  if (!spec.tech_stack || typeof spec.tech_stack !== "object") {
    r.errors.push("Missing 'tech_stack' — the architecture must specify a tech stack");
  } else {
    if (!spec.tech_stack.frontend) r.warnings.push("tech_stack.frontend not specified");
    if (!spec.tech_stack.backend) r.warnings.push("tech_stack.backend not specified");
  }
  if (!Array.isArray(spec.pages) || spec.pages.length === 0) {
    r.errors.push("Missing or empty 'pages' — at least one page must be defined");
  } else {
    spec.pages.forEach((p: any, i: number) => {
      if (!p.name) r.errors.push(`pages[${i}] missing 'name'`);
      if (!p.route) r.errors.push(`pages[${i}] missing 'route'`);
    });
  }
  if (!Array.isArray(spec.data_models) || spec.data_models.length === 0) {
    r.warnings.push("No data_models defined — data model step will design from scratch");
  }
  if (!Array.isArray(spec.features) || spec.features.length === 0) {
    r.warnings.push("No features defined");
  }
  r.valid = r.errors.length === 0;
  return r;
}

export function validateDataModelSpec(spec: any): ValidationResult {
  const r = base();
  if (!spec || typeof spec !== "object") {
    return { valid: false, errors: ["Data model spec is empty or not an object"], warnings: [] };
  }
  if (!Array.isArray(spec.entities) || spec.entities.length === 0) {
    r.errors.push("Missing or empty 'entities' — at least one entity must be defined");
  } else {
    spec.entities.forEach((e: any, i: number) => {
      if (!e.name) r.errors.push(`entities[${i}] missing 'name'`);
      if (!Array.isArray(e.fields) || e.fields.length === 0)
        r.errors.push(`entities[${i}] ('${e.name || i}') has no fields`);
    });
  }
  if (!Array.isArray(spec.relationships)) {
    r.warnings.push("No 'relationships' array — relationships won't be displayed");
  }
  if (!Array.isArray(spec.api_endpoints)) {
    r.warnings.push("No 'api_endpoints' array — API endpoints won't be displayed");
  }
  r.valid = r.errors.length === 0;
  return r;
}

export function validateUiSystemSpec(spec: any): ValidationResult {
  const r = base();
  if (!spec || typeof spec !== "object") {
    return { valid: false, errors: ["UI system spec is empty or not an object"], warnings: [] };
  }
  if (!spec.color_palette || typeof spec.color_palette !== "object") {
    r.errors.push("Missing 'color_palette' — the design system must define colors");
  } else {
    if (!spec.color_palette.primary) r.errors.push("color_palette.primary is required");
    if (!spec.color_palette.background) r.warnings.push("color_palette.background not specified");
  }
  if (!spec.typography || typeof spec.typography !== "object") {
    r.warnings.push("Missing 'typography' — typography system won't be displayed");
  }
  if (!Array.isArray(spec.components) || spec.components.length === 0) {
    r.warnings.push("No 'components' defined — component library won't be displayed");
  }
  r.valid = r.errors.length === 0;
  return r;
}

export function validateCodeManifestSpec(spec: any): ValidationResult {
  const r = base();
  if (!spec || typeof spec !== "object") {
    return { valid: false, errors: ["Code manifest is empty or not an object"], warnings: [] };
  }
  if (!spec.framework) r.warnings.push("Missing 'framework'");
  if (!spec.repo_name) r.warnings.push("Missing 'repo_name'");
  if (!Array.isArray(spec.files) || spec.files.length === 0) {
    r.errors.push("Missing or empty 'files' — the manifest must list at least one file");
  } else {
    spec.files.forEach((f: any, i: number) => {
      if (!f.path) r.errors.push(`files[${i}] missing 'path'`);
      if (!f.category) r.warnings.push(`files[${i}] ('${f.path || i}') missing 'category'`);
    });
  }
  if (!Array.isArray(spec.build_steps)) {
    r.warnings.push("No 'build_steps' array");
  }
  r.valid = r.errors.length === 0;
  return r;
}

export function validateDeploymentSpec(spec: any): ValidationResult {
  const r = base();
  if (!spec || typeof spec !== "object") {
    return { valid: false, errors: ["Deployment spec is empty or not an object"], warnings: [] };
  }
  if (!spec.live_url) r.errors.push("Missing 'live_url' — the preview URL is required");
  if (!spec.platform) r.warnings.push("Missing 'platform'");
  if (!spec.build_config || typeof spec.build_config !== "object") {
    r.warnings.push("Missing 'build_config'");
  }
  r.valid = r.errors.length === 0;
  return r;
}