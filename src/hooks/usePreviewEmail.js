import { usePreview } from "@/lib/PreviewContext";
import { useAutoBuild } from "@/lib/AutoBuildContext";

// Resolves the effective email for client-data scoping.
// - In AutoBuild mode, returns the build's email (or a placeholder) so
//   approval/esign queries don't collide with real client data.
// - When an admin is previewing as a client, returns the preview client email.
// - Otherwise, returns the user's email.
export function usePreviewEmail(user) {
  const { previewAsClient, previewClientEmail } = usePreview();
  const autoBuild = useAutoBuild();

  if (autoBuild.isActive) {
    const email = autoBuild.build?.profile?.email || `autobuild-${autoBuild.activeBuildId}@auto.local`;
    return { effectiveEmail: email, isPreviewing: false, isScoped: false, adminScoped: false, isAutoBuild: true };
  }

  const isPreviewing = !!previewAsClient;
  const isScoped = isPreviewing && !!previewClientEmail;
  const adminScoped = isPreviewing && !previewClientEmail;
  const effectiveEmail = isScoped ? previewClientEmail : user?.email;
  return { effectiveEmail, isPreviewing, isScoped, adminScoped, isAutoBuild: false };
}