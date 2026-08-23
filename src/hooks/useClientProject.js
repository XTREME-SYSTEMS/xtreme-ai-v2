import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";
import { useAutoBuild } from "@/lib/AutoBuildContext";

// Loads or creates a ClientProject for the effective user (client or previewed
// client). In AutoBuild mode, returns the AutoBuild record as the "project"
// so all client portal pages that read project-level data work transparently.
export function useClientProject(user) {
  const { previewAsClient, previewClientEmail } = usePreview();
  const autoBuild = useAutoBuild();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const effectiveEmail = previewAsClient ? previewClientEmail : user?.email;

  // AutoBuild mode: the AutoBuild record IS the project
  useEffect(() => {
    if (autoBuild.isActive) {
      setProject(autoBuild.build);
      setLoading(autoBuild.loading);
      return;
    }
  }, [autoBuild.isActive, autoBuild.build, autoBuild.loading]);

  const load = useCallback(async () => {
    if (autoBuild.isActive) return; // AutoBuild mode handles its own state
    if (!effectiveEmail) { setLoading(false); return; }
    try {
      const existing = await base44.entities.ClientProject.filter(
        { client_email: effectiveEmail }, "-created_date", 1
      );
      if (existing && existing.length > 0) setProject(existing[0]);
      else setProject(null);
    } catch { setProject(null); }
    finally { setLoading(false); }
  }, [effectiveEmail, autoBuild.isActive]);

  useEffect(() => {
    if (autoBuild.isActive) return;
    load();
  }, [load, location.pathname]);

  const saveProject = useCallback(async (data) => {
    if (autoBuild.isActive) return await autoBuild.saveBuild(data);
    if (!effectiveEmail) return null;
    try {
      if (project?.id) {
        const updated = await base44.entities.ClientProject.update(project.id, data);
        setProject(updated);
        return updated;
      } else {
        const created = await base44.entities.ClientProject.create({
          client_email: effectiveEmail, ...data,
        });
        setProject(created);
        return created;
      }
    } catch { return null; }
  }, [project, effectiveEmail, autoBuild.isActive, autoBuild.saveBuild]);

  return { project, loading, saveProject, reload: load };
}