import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";
import { useState, useCallback } from "react";

// Preview-safe write hook for client portal pages.
// When an admin is previewing as a specific client, writes go to the CLIENT's
// User record (via asServiceRole.entities.User.update). When not previewing,
// writes go to the authenticated user (via auth.updateMe).
// This fixes the critical bug where preview-mode interactions corrupted the
// admin's own profile.
export function useClientUpdate() {
  const { previewAsClient, previewClientEmail } = usePreview();
  const [saving, setSaving] = useState(false);

  const update = useCallback(async (data) => {
    setSaving(true);
    try {
      if (previewAsClient && previewClientEmail) {
        // Preview mode: write to the client's record via service role
        const users = await base44.entities.User.filter({ email: previewClientEmail });
        const clientUser = users?.[0];
        if (clientUser) {
          await base44.entities.User.update(clientUser.id, data);
          return { ...clientUser, ...data };
        }
        throw new Error("Client not found for preview write");
      } else {
        // Normal mode: write to self
        await base44.auth.updateMe(data);
        return null;
      }
    } finally {
      setSaving(false);
    }
  }, [previewAsClient, previewClientEmail]);

  return { update, saving, isPreview: previewAsClient };
}