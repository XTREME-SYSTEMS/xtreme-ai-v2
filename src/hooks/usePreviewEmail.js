import { usePreview } from "@/lib/PreviewContext";

// Resolves the effective email for client-data scoping when an admin is
// previewing as a client. Returns:
//   effectiveEmail  — the email to filter client data by (preview client or real user)
//   isPreviewing    — true when an admin is in preview mode
//   isScoped        — true when previewing AND a specific client was chosen
//   adminScoped     — true when previewing WITHOUT a chosen client (admin sees all)
export function usePreviewEmail(user) {
  const { previewAsClient, previewClientEmail } = usePreview();
  const isPreviewing = !!previewAsClient;
  const isScoped = isPreviewing && !!previewClientEmail;
  const adminScoped = isPreviewing && !previewClientEmail;
  const effectiveEmail = isScoped ? previewClientEmail : user?.email;
  return { effectiveEmail, isPreviewing, isScoped, adminScoped };
}