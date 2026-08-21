import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";

// Loads or creates a ClientProject for the effective user (client or previewed
// client). ClientProject offloads creative work from the User record. Falls
// back to the User record's fields if no project exists yet (backward compat).
//
// Returns { project, loading, saveProject } where saveProject upserts the
// project (creates if missing, updates if exists).
export function useClientProject(user) {
  const { previewAsClient, previewClientEmail } = usePreview();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const effectiveEmail = previewAsClient ? previewClientEmail : user?.email;

  const load = useCallback(async () => {
    if (!effectiveEmail) {
      setLoading(false);
      return;
    }
    try {
      const existing = await base44.entities.ClientProject.filter(
        { client_email: effectiveEmail },
        "-created_date",
        1
      );
      if (existing && existing.length > 0) {
        setProject(existing[0]);
      } else {
        setProject(null);
      }
    } catch (e) {
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [effectiveEmail]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProject = useCallback(async (data) => {
    if (!effectiveEmail) return null;
    try {
      if (project?.id) {
        const updated = await base44.entities.ClientProject.update(project.id, data);
        setProject(updated);
        return updated;
      } else {
        const created = await base44.entities.ClientProject.create({
          client_email: effectiveEmail,
          ...data,
        });
        setProject(created);
        return created;
      }
    } catch (e) {
      return null;
    }
  }, [project, effectiveEmail]);

  return { project, loading, saveProject, reload: load };
}