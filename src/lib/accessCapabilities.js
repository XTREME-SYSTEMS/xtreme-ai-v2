// Access capabilities for employees — defines what tools/pages each employee
// can access. Used by the EmployeeInvitePanel (admin selects capabilities),
// the Layout (filters nav items), and the inviteEmployeeWithAccess backend
// function (determines the landing page for the email link).

// Preset bundles — quick-select options for the admin
export const ACCESS_PRESETS = [
  {
    id: "all",
    label: "Full Access (All Capabilities)",
    description: "AI Chief Architect, Vision Cortex, Pipeline Catalog, Queue System, Auto Builder, and all tools",
    capabilities: ["all"],
  },
  {
    id: "auto_builder",
    label: "Auto Builder System",
    description: "Full builder pipeline: profile → vision → strategy → architecture → codegen → deploy → review",
    capabilities: [
      "/auto-builder", "/business-profile", "/vision", "/strategy",
      "/business-name-studio", "/content-generator", "/logo-generator",
      "/brand-generator", "/design-direction", "/social-media",
      "/video-generator", "/your-designs", "/enhancements",
      "/system-architecture", "/data-model", "/ui-system", "/codegen",
      "/deploy", "/system-review",
    ],
  },
];

// Individual capabilities — each maps to a page route
export const INDIVIDUAL_CAPABILITIES = [
  { path: "/architect", label: "AI Chief Architect", description: "AI chat that operates the system", group: "Pipeline" },
  { path: "/vision-cortex", label: "Vision Cortex", description: "Finds ideas for websites & systems", group: "Pipeline" },
  { path: "/pipeline-catalog", label: "Pipeline Catalog", description: "Browse packages, templates & tools", group: "Pipeline" },
  { path: "/build-queue", label: "Queue System", description: "Ideas queued for building", group: "Pipeline" },
  { path: "/auto-builder", label: "Auto Builder", description: "Full builder pipeline", group: "Builder" },
  { path: "/business-name-studio", label: "Business Name Studio", description: "Research business names", group: "Builder" },
  { path: "/content-generator", label: "Content Generator", description: "Generate content templates", group: "Builder" },
  { path: "/logo-generator", label: "Logo Generator", description: "Generate logo options", group: "Builder" },
  { path: "/brand-generator", label: "Brand Generator", description: "Generate brand packs", group: "Builder" },
  { path: "/design-direction", label: "Design Direction", description: "Choose design direction", group: "Builder" },
  { path: "/social-media", label: "Social Media Generator", description: "Generate social media packs", group: "Builder" },
  { path: "/video-generator", label: "Video Generator", description: "Generate video content", group: "Builder" },
  { path: "/your-designs", label: "Your Designs", description: "View saved designs", group: "Builder" },
  { path: "/enhancements", label: "Enhancements", description: "Add enhancements", group: "Builder" },
  { path: "/system-architecture", label: "System Architecture", description: "Generate system architecture", group: "System" },
  { path: "/data-model", label: "Data Model", description: "Generate data model", group: "System" },
  { path: "/ui-system", label: "UI System", description: "Generate UI design system", group: "System" },
  { path: "/codegen", label: "Codegen", description: "Generate code manifest", group: "System" },
  { path: "/deploy", label: "Deploy", description: "Deploy the build", group: "System" },
  { path: "/system-review", label: "System Review", description: "Review and finalize", group: "System" },
];

// Determine the landing page for a user based on their access capabilities
export function getLandingPage(capabilities) {
  if (!capabilities || capabilities.length === 0) return "/auto-builder";
  if (capabilities.includes("all")) return "/auto-builder";
  if (capabilities.includes("/auto-builder")) return "/auto-builder";
  if (capabilities.includes("/architect")) return "/architect";
  // Return the first capability that's a valid path
  const first = capabilities.find((c) => c.startsWith("/"));
  return first || "/auto-builder";
}

// Check if a user has access to a specific page path
export function hasAccessToPage(capabilities, pagePath) {
  if (!capabilities || capabilities.length === 0) return true; // default: allow (for admins)
  if (capabilities.includes("all")) return true;
  // Exact match
  if (capabilities.includes(pagePath)) return true;
  // Sub-path match (e.g., "/auto-builder" allows "/auto-builder/anything")
  return capabilities.some((cap) => cap.startsWith("/") && pagePath.startsWith(cap));
}