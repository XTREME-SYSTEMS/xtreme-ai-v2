import { base44 } from "@/api/base44Client";

// Builds an auto-generated project name from the available business context.
// Format: "BusinessName · Location · Date" — falls back to "Untitled Project · Date".
export function buildProjectName(opts = {}) {
  const { businessName, primaryLocation, industry } = opts;
  const date = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const parts = [];
  if (businessName) parts.push(businessName);
  else if (industry) parts.push(industry);
  if (primaryLocation) parts.push(primaryLocation);
  if (parts.length === 0) parts.push("Untitled Project");
  parts.push(date);
  return parts.join(" · ");
}

// Pipeline-generated fields stored on the User record (mirrored to the
// ClientProject via useClientUpdate). These are wiped on "Start New Project"
// so old generated content never leaks into a fresh project.
export const PIPELINE_USER_FIELDS = {
  epoxyProfile: {},
  contentTemplates: null,
  chosenContentTemplate: null,
  chosenContentTone: null,
  contentTemplatesChosen: false,
  logoOptions: null,
  chosenLogoUrl: null,
  brandPacks: null,
  chosenBrandImages: null,
  websiteContent: null,
  websiteImages: null,
  chosenWebsiteLayout: null,
  chosenPalette: null,
  designPacksChosen: false,
  socialMediaPack: null,
  socialMediaChosen: false,
  videoPack: null,
  videoChosen: false,
  enhancements: null,
  enhancementsTotal: 0,
  enhancementsChosen: false,
};

// Clears every localStorage coach:done / coach:intro key so the step timeline
// resets visually as well as in the database.
export function clearStepCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("coach:done:") || k.startsWith("coach:intro:"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// Full reset: wipes the user's pipeline-generated fields, deletes the current
// ClientProject (so a fresh one is created next visit), and clears the local
// step cache. The user keeps their account + plan, but all project data is gone.
export async function resetCurrentProject(user, project) {
  // 1. Wipe pipeline fields from the user record.
  try {
    await base44.auth.updateMe(PIPELINE_USER_FIELDS);
  } catch (e) {
    // Non-fatal — the project delete below is the real reset.
  }

  // 2. Delete the ClientProject so the next save creates a fresh one.
  if (project?.id) {
    try {
      await base44.entities.ClientProject.delete(project.id);
    } catch (e) {
      // If RLS blocks delete (client_email guard), fall back to wiping fields.
      try {
        await base44.entities.ClientProject.update(project.id, {
          vision: null,
          strategy: null,
          content_templates: null,
          chosen_content_template: null,
          content_templates_chosen: false,
          logo_options: null,
          chosen_logo_url: null,
          brand_packs: null,
          chosen_brand_images: null,
          website_content: null,
          website_images: null,
          chosen_website_layout: null,
          chosen_palette: null,
          design_packs_chosen: false,
          social_media_pack: null,
          social_media_chosen: false,
          video_pack: null,
          video_chosen: false,
          enhancements: null,
          enhancements_total: 0,
          enhancements_chosen: false,
          current_step: null,
          visited_steps: [],
          status: "draft",
        });
      } catch {}
    }
  }

  // 3. Clear local step cache.
  clearStepCache();
  return true;
}