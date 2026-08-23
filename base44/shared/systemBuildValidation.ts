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

// ============================================================
// CROSS-STEP CONSISTENCY VALIDATORS
// Check that downstream specs are consistent with upstream specs.
// ============================================================

// Data model entities must cover all architecture.data_models
export function validateDataModelConsistency(dataModel: any, architecture: any): ValidationResult {
  const r = base();
  if (!dataModel?.entities || !architecture?.data_models) return r;

  const archEntityNames = architecture.data_models.map((dm: any) => dm.name?.toLowerCase()).filter(Boolean);
  const dataModelNames = dataModel.entities.map((e: any) => e.name?.toLowerCase()).filter(Boolean);

  const missing = archEntityNames.filter((name: string) => !dataModelNames.includes(name));
  if (missing.length > 0) {
    r.warnings.push(`Data model is missing entities defined in architecture: ${missing.join(", ")}`);
  }

  // Check that referenced entities in relationships exist
  if (Array.isArray(dataModel.relationships)) {
    dataModel.relationships.forEach((rel: any, i: number) => {
      if (rel.from && !dataModelNames.includes(rel.from.toLowerCase()))
        r.warnings.push(`relationships[${i}].from '${rel.from}' does not match any entity name`);
      if (rel.to && !dataModelNames.includes(rel.to.toLowerCase()))
        r.warnings.push(`relationships[${i}].to '${rel.to}' does not match any entity name`);
    });
  }

  r.valid = r.errors.length === 0;
  return r;
}

// UI system components should cover all architecture pages
export function validateUiSystemConsistency(uiSystem: any, architecture: any): ValidationResult {
  const r = base();
  if (!uiSystem?.components || !architecture?.pages) return r;

  // Every page should have at least one component that references it
  const componentNames = uiSystem.components.map((c: any) => c.name?.toLowerCase() || "");
  const pages = architecture.pages;

  // Check that the component library has at least a few navigation/layout components
  const hasNav = componentNames.some((n: string) => n.includes("nav") || n.includes("header") || n.includes("sidebar"));
  if (!hasNav && pages.length > 1)
    r.warnings.push("UI system has no navigation/header/sidebar component despite multiple pages");

  // Check color palette has enough contrast info
  if (uiSystem.color_palette) {
    if (!uiSystem.color_palette.text && !uiSystem.color_palette.text_muted)
      r.warnings.push("UI system color_palette has no text color defined");
  }

  r.valid = r.errors.length === 0;
  return r;
}

// Code manifest files should implement all architecture features
export function validateCodeManifestConsistency(codeManifest: any, architecture: any): ValidationResult {
  const r = base();
  if (!codeManifest?.files || !architecture) return r;

  const filePaths = codeManifest.files.map((f: any) => f.path || "").filter(Boolean);
  const pageRoutes = (architecture.pages || []).map((p: any) => p.route || "").filter(Boolean);

  // Every page route should have a corresponding file
  for (const route of pageRoutes) {
    const routeSlug = route.replace(/^\//, "").replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const hasFile = filePaths.some((p: string) =>
      p.toLowerCase().includes(routeSlug) ||
      p.toLowerCase().includes(route.replace(/^\//, "").toLowerCase())
    );
    if (!hasFile && route !== "/") {
      r.warnings.push(`No file found for architecture page route '${route}'`);
    }
  }

  // Every entity should have a corresponding file
  const entityNames = (architecture.data_models || []).map((dm: any) => dm.name).filter(Boolean);
  for (const entity of entityNames) {
    const slug = entity.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const hasFile = filePaths.some((p: string) =>
      p.toLowerCase().includes(slug) || p.toLowerCase().includes(entity.toLowerCase())
    );
    if (!hasFile)
      r.warnings.push(`No file found for architecture entity '${entity}'`);
  }

  // Every feature should have at least one file referencing it
  const features = (architecture.features || []).map((f: any) => f.name).filter(Boolean);
  for (const feature of features) {
    const featureSlug = feature.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const hasFile = filePaths.some((p: string) =>
      p.toLowerCase().includes(featureSlug)
    );
    if (!hasFile)
      r.warnings.push(`No file found for architecture feature '${feature}'`);
  }

  r.valid = r.errors.length === 0;
  return r;
}

// Deployment routes should cover all architecture pages
export function validateDeploymentConsistency(deployment: any, architecture: any): ValidationResult {
  const r = base();
  if (!deployment?.routes || !architecture?.pages) return r;

  const deployRoutes = deployment.routes.map((r: any) => r.path || "").filter(Boolean);
  const archRoutes = architecture.pages.map((p: any) => p.route || "").filter(Boolean);

  const missing = archRoutes.filter((route: string) => !deployRoutes.includes(route));
  if (missing.length > 0) {
    r.warnings.push(`Deployment routes missing for architecture pages: ${missing.join(", ")}`);
  }

  r.valid = r.errors.length === 0;
  return r;
}

// Combined consistency check for a full build
export function validateFullBuildConsistency(build: any): ValidationResult {
  const r = base();
  const arch = build.architecture;
  const dm = build.data_model;
  const ui = build.ui_system;
  const cm = build.code_manifest;
  const dep = build.deployment;

  if (arch && dm) {
    const c = validateDataModelConsistency(dm, arch);
    r.errors.push(...c.errors);
    r.warnings.push(...c.warnings);
  }
  if (arch && ui) {
    const c = validateUiSystemConsistency(ui, arch);
    r.errors.push(...c.errors);
    r.warnings.push(...c.warnings);
  }
  if (arch && cm) {
    const c = validateCodeManifestConsistency(cm, arch);
    r.errors.push(...c.errors);
    r.warnings.push(...c.warnings);
  }
  if (arch && dep) {
    const c = validateDeploymentConsistency(dep, arch);
    r.errors.push(...c.errors);
    r.warnings.push(...c.warnings);
  }

  r.valid = r.errors.length === 0;
  return r;
}