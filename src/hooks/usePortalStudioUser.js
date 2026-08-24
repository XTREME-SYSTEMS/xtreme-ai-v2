import { useMemo } from "react";
import { usePortalStudio } from "@/lib/PortalStudioContext";

// Derives a synthetic "user" from the active Portal Studio sandbox project.
// This lets cloned step pages that read user.epoxyProfile / user.email work
// transparently against the sandbox project — no real User entity needed.
export function usePortalStudioUser() {
  const { project, loading, isActive } = usePortalStudio();

  const user = useMemo(() => {
    if (!isActive || !project) return null;
    const profile = project.profile || {};
    return {
      id: `studio-${project.id}`,
      email: profile.email || `studio@portal.local`,
      full_name: project.name || "Portal Studio",
      role: "user",
      plan: "demo",
      epoxyProfile: {
        industry: project.industry || profile.industry,
        primaryLocation: profile.profile?.primary_location || profile.primary_location,
        businessStage: project.business_stage || profile.business_stage,
        services: profile.services || [],
      },
      epoxyProfileSubmitted: !!(project.profile && Object.keys(project.profile).length > 0),
      chosenLogoUrl: project.chosen_logo_url,
      chosenBrandImages: project.chosen_brand_images,
      designPacksChosen: project.design_packs_chosen,
      contentTemplatesChosen: project.content_templates_chosen,
      socialMediaChosen: project.social_media_chosen,
      videoChosen: project.video_chosen,
    };
  }, [isActive, project]);

  return { user, loading };
}