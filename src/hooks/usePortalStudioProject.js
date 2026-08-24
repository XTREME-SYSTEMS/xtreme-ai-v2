import { usePortalStudio } from "@/lib/PortalStudioContext";

// Returns the active Portal Studio sandbox project + save function.
// In Portal Studio mode, this replaces useClientProject — all step pages
// read/write the PortalStudioProject record instead of ClientProject.
export function usePortalStudioProject() {
  const { project, loading, saveProject, reload, isActive } = usePortalStudio();
  return { project, loading, saveProject, reload, isActive };
}