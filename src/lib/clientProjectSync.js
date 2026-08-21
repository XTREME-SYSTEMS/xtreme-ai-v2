// G1 — Maps User record camelCase fields to ClientProject snake_case fields.
// Used by useClientUpdate to dual-write creative data to both the User record
// (backward compat — all current reads come from User) and the ClientProject
// entity (the new offload target for creative work, keyed by client_email).

const USER_TO_PROJECT_FIELDS = {
  contentTemplates: "content_templates",
  chosenContentTemplate: "chosen_content_template",
  contentTemplatesChosen: "content_templates_chosen",
  logoPacks: "logo_options",
  chosenLogoUrl: "chosen_logo_url",
  brandPacks: "brand_packs",
  chosenBrandImages: "chosen_brand_images",
  designPacksChosen: "design_packs_chosen",
  socialMediaPack: "social_media_pack",
  socialMediaChosen: "social_media_chosen",
  videoPack: "video_pack",
  videoChosen: "video_chosen",
  chosenWebsiteLayout: "chosen_website_layout",
  chosenPalette: "chosen_palette",
  websiteContent: "website_content",
  websiteImages: "website_images",
  enhancements: "enhancements",
  enhancementsTotal: "enhancements_total",
  enhancementsChosen: "enhancements_chosen",
  epoxyProfile: "profile",
};

// Maps a User-record update payload to a ClientProject update payload.
// Only includes keys that exist in the source data (so unset fields don't
// get written as undefined).
export function mapUserToProject(data) {
  const mapped = {};
  for (const [userKey, projectKey] of Object.entries(USER_TO_PROJECT_FIELDS)) {
    if (userKey in data) {
      mapped[projectKey] = data[userKey];
    }
  }
  return mapped;
}

// Returns true if the data payload contains any fields that map to ClientProject.
export function hasProjectFields(data) {
  return Object.keys(USER_TO_PROJECT_FIELDS).some((k) => k in data);
}