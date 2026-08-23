// Maps AutoBuild records ↔ User-like objects so the client portal's shared
// hooks/pages can operate on an AutoBuild record transparently. The client
// portal pages read camelCase fields from the User record (epoxyProfile,
// chosenLogoUrl, contentTemplates, …). These mappers convert an AutoBuild
// (snake_case) into that shape on read, and convert update payloads back to
// AutoBuild snake_case on write.

// Marketing pipeline steps
const MARKETING_STEPS = [
  "profile", "names", "content", "logo", "brand", "website", "social", "video", "review", "complete",
];

// System-build pipeline steps (web_app / ecommerce / platform)
const SYSTEM_STEPS = [
  "profile", "architecture", "data_model", "ui_system", "codegen", "deploy", "system_review", "complete",
];

// Combined — used to compute current_step from visited_steps. We check both
// pipelines since the build's product_type determines which applies.
const STEP_ORDER = [...new Set([...MARKETING_STEPS, ...SYSTEM_STEPS])];

// System-build product types — their pipeline uses SYSTEM_STEPS, not MARKETING_STEPS
const SYSTEM_PRODUCT_TYPES = ["web_app", "ecommerce", "platform"];

// ── READ: AutoBuild → User-like ──────────────────────────────────────────
export function buildToUser(build) {
  if (!build) return null;
  const visited = build.visited_steps || [];
  const p = build.profile || {};
  return {
    id: build.id,
    email: p.email || `autobuild-${build.id}@auto.local`,
    role: "user",
    plan: "demo", // demo track = full build with social + video
    // Profile (epoxyProfile)
    epoxyProfile: {
      businessName: build.business_name,
      industry: build.industry,
      subIndustry: build.sub_industry,
      primaryLocation: p.primary_location,
      phone: p.phone,
      email: p.email,
      website: p.website,
      address: p.address,
      zip: p.zip,
      radius: p.radius,
      yearsInBusiness: p.years_in_business,
      services: p.services || [],
      tagline: p.tagline,
      businessStage: p.business_stage,
    },
    epoxyProfileSubmitted: visited.includes("profile") || !!p.primary_location,
    // Content
    contentTemplates: build.content_templates,
    chosenContentTemplate: build.chosen_content_template,
    chosenContentTone: build.chosen_content_tone,
    contentTemplatesChosen: !!build.chosen_content_template,
    // Logo
    logoPacks: build.logo_options,
    chosenLogoUrl: build.chosen_logo_url,
    logoPacksChosen: !!build.chosen_logo_url,
    // Brand
    brandPacks: build.brand_packs,
    chosenBrandImages: build.chosen_brand_images || [],
    brandPacksChosen: (build.chosen_brand_images || []).length > 0,
    // Website
    websiteContent: build.website_content,
    websiteImages: build.website_images,
    chosenWebsiteLayout: build.chosen_website_layout,
    chosenPalette: build.chosen_palette,
    designPacksChosen: !!build.chosen_website_layout,
    // Social
    socialMediaPack: build.social_media_pack,
    socialMediaChosen: visited.includes("social"),
    // Video
    videoPack: build.video_pack,
    videoChosen: visited.includes("video"),
    // System-build fields (web_app / ecommerce / platform)
    architecture: build.architecture,
    dataModel: build.data_model,
    uiSystem: build.ui_system,
    codeManifest: build.code_manifest,
    deployment: build.deployment,
  };
}

// ── WRITE: camelCase update payload → AutoBuild snake_case fields ───────
const USER_TO_BUILD = {
  contentTemplates: "content_templates",
  chosenContentTemplate: "chosen_content_template",
  chosenContentTone: "chosen_content_tone",
  logoPacks: "logo_options",
  chosenLogoUrl: "chosen_logo_url",
  brandPacks: "brand_packs",
  chosenBrandImages: "chosen_brand_images",
  socialMediaPack: "social_media_pack",
  videoPack: "video_pack",
  chosenWebsiteLayout: "chosen_website_layout",
  chosenPalette: "chosen_palette",
  websiteContent: "website_content",
  websiteImages: "website_images",
};

// Maps epoxyProfile camelCase → AutoBuild.profile snake_case
const PROFILE_FIELD_MAP = {
  primaryLocation: "primary_location",
  phone: "phone",
  email: "email",
  website: "website",
  address: "address",
  zip: "zip",
  radius: "radius",
  yearsInBusiness: "years_in_business",
  services: "services",
  tagline: "tagline",
  businessStage: "business_stage",
};

// Gate field → step key. When one of these is written, the corresponding step
// is marked complete in visited_steps.
const GATE_TO_STEP = {
  epoxyProfileSubmitted: "profile",
  contentTemplatesChosen: "content",
  chosenLogoUrl: "logo",
  chosenBrandImages: "brand",
  designPacksChosen: "website",
  socialMediaChosen: "social",
  videoChosen: "video",
};

export function userToBuildFields(data, currentBuild) {
  const mapped = {};

  // Simple field mappings
  for (const [userKey, buildKey] of Object.entries(USER_TO_BUILD)) {
    if (userKey in data) mapped[buildKey] = data[userKey];
  }

  // epoxyProfile → AutoBuild.profile (snake_case) + top-level business_name/industry
  if (data.epoxyProfile) {
    const existingProfile = currentBuild?.profile || {};
    const newProfile = { ...existingProfile };
    for (const [camel, snake] of Object.entries(PROFILE_FIELD_MAP)) {
      if (camel in data.epoxyProfile) newProfile[snake] = data.epoxyProfile[camel];
    }
    mapped.profile = newProfile;
    if (data.epoxyProfile.businessName) mapped.business_name = data.epoxyProfile.businessName;
    if (data.epoxyProfile.industry) mapped.industry = data.epoxyProfile.industry;
    if (data.epoxyProfile.subIndustry !== undefined) mapped.sub_industry = data.epoxyProfile.subIndustry;
  }

  // Derive visited_steps updates from gate-completing fields
  const visited = new Set(currentBuild?.visited_steps || []);
  let changed = false;
  for (const [gateField, stepKey] of Object.entries(GATE_TO_STEP)) {
    if (gateField in data && data[gateField]) {
      if (!visited.has(stepKey)) { visited.add(stepKey); changed = true; }
    }
  }
  // Also mark "names" as visited when profile is submitted — but ONLY for
  // marketing builds (system builds don't have a "names" step)
  if (data.epoxyProfileSubmitted && !visited.has("names") && !SYSTEM_PRODUCT_TYPES.includes(currentBuild?.product_type)) {
    visited.add("names"); changed = true;
  }
  if (changed) mapped.visited_steps = Array.from(visited);

  // Update current_step to the next unvisited step — use the correct pipeline
  // (SYSTEM_STEPS for system builds, MARKETING_STEPS for marketing builds)
  if (changed || "current_step" in data) {
    const productType = currentBuild?.product_type;
    const pipeline = SYSTEM_PRODUCT_TYPES.includes(productType) ? SYSTEM_STEPS : MARKETING_STEPS;
    const nextStep = pipeline.find((s) => !visited.has(s) && s !== "complete") || "complete";
    mapped.current_step = nextStep;
  }

  return mapped;
}