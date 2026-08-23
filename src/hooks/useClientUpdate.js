import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { userToBuildFields, buildToUser } from "@/lib/autoBuildSync";
import { mapUserToProject, hasProjectFields } from "@/lib/clientProjectSync";
import { useState, useCallback } from "react";

// Preview-safe + AutoBuild-aware write hook for client portal pages.
// - When an AutoBuild is active, writes go to the AutoBuild record (mapped
//   from camelCase to snake_case). No User or ClientProject writes.
// - When an admin is previewing as a specific client, writes go to the
//   CLIENT's User record (via asServiceRole.entities.User.update).
// - Otherwise, writes go to the authenticated user (via auth.updateMe) +
//   dual-writes creative fields to ClientProject.
export function useClientUpdate() {
  const { previewAsClient, previewClientEmail } = usePreview();
  const autoBuild = useAutoBuild();
  const [saving, setSaving] = useState(false);

  const update = useCallback(async (data) => {
    setSaving(true);
    try {
      // AutoBuild mode: write to the AutoBuild record
      if (autoBuild.isActive) {
        const mapped = userToBuildFields(data, autoBuild.build);
        const updated = await autoBuild.saveBuild(mapped);
        return updated ? buildToUser(updated) : null;
      }

      let email = previewClientEmail;
      if (previewAsClient && previewClientEmail) {
        const users = await base44.entities.User.filter({ email: previewClientEmail });
        const clientUser = users?.[0];
        if (clientUser) {
          await base44.entities.User.update(clientUser.id, data);
          return { ...clientUser, ...data };
        }
        throw new Error("Client not found for preview write");
      } else {
        await base44.auth.updateMe(data);
        try {
          const me = await base44.auth.me();
          email = me?.email || email;
        } catch {}
      }

      if (email && hasProjectFields(data)) {
        try {
          const projectData = mapUserToProject(data);
          if (Object.keys(projectData).length > 0) {
            const existing = await base44.entities.ClientProject.filter(
              { client_email: email }, "-created_date", 1
            );
            if (existing?.length > 0) {
              await base44.entities.ClientProject.update(existing[0].id, projectData);
            } else {
              await base44.entities.ClientProject.create({ client_email: email, ...projectData });
            }
          }
        } catch (dualWriteErr) {
          console.error("useClientUpdate: ClientProject dual-write failed", dualWriteErr?.message || dualWriteErr);
        }
      }

      return null;
    } finally {
      setSaving(false);
    }
  }, [previewAsClient, previewClientEmail, autoBuild.isActive, autoBuild.build]);

  return { update, saving, isPreview: previewAsClient, isAutoBuild: autoBuild.isActive };
}