import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";
import { useState, useCallback } from "react";
import { mapUserToProject, hasProjectFields } from "@/lib/clientProjectSync";

// Preview-safe write hook for client portal pages.
// When an admin is previewing as a specific client, writes go to the CLIENT's
// User record (via asServiceRole.entities.User.update). When not previewing,
// writes go to the authenticated user (via auth.updateMe).
// This fixes the critical bug where preview-mode interactions corrupted the
// admin's own profile.
//
// G1 — Also dual-writes creative fields to the ClientProject entity so it
// stays in sync with the User record (backward compat: reads still come from
// User; ClientProject is the offload target for future migration).
export function useClientUpdate() {
  const { previewAsClient, previewClientEmail } = usePreview();
  const [saving, setSaving] = useState(false);

  const update = useCallback(async (data) => {
    setSaving(true);
    try {
      let email = previewClientEmail;
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
        // Get email for ClientProject dual-write
        try {
          const me = await base44.auth.me();
          email = me?.email || email;
        } catch {}
      }

      // G1 — Dual-write to ClientProject (best effort, non-blocking)
      if (email && hasProjectFields(data)) {
        try {
          const projectData = mapUserToProject(data);
          if (Object.keys(projectData).length > 0) {
            const existing = await base44.entities.ClientProject.filter(
              { client_email: email },
              "-created_date",
              1
            );
            if (existing?.length > 0) {
              await base44.entities.ClientProject.update(existing[0].id, projectData);
            } else {
              await base44.entities.ClientProject.create({
                client_email: email,
                ...projectData,
              });
            }
          }
        } catch {}
      }

      return null;
    } finally {
      setSaving(false);
    }
  }, [previewAsClient, previewClientEmail]);

  return { update, saving, isPreview: previewAsClient };
}