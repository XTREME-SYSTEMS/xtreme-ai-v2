import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { buildProjectName } from "@/lib/projectReset";

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
      // Fetch recent projects and pick the most recent non-archived one as the
      // "current" project. Archived projects are preserved for resume later.
      const existing = await base44.entities.ClientProject.filter(
        { client_email: effectiveEmail }, "-created_date", 20
      );
      const active = (existing || []).find((p) => p.archived !== true);
      setProject(active || null);
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
      // Auto-generate a project name for organization if none is set, or
      // refresh it when a business name / location becomes available.
      const withName = { ...data };
      const incomingName = data.business_name || data.profile?.primary_location;
      const existingName = project?.project_name;
      const looksAuto = !existingName || existingName.startsWith("Untitled Project");
      if (!withName.project_name && (looksAuto || incomingName)) {
        withName.project_name = buildProjectName({
          businessName: data.business_name || project?.business_name,
          primaryLocation: data.profile?.primary_location || project?.profile?.primary_location,
          industry: data.industry || project?.industry,
        });
      }
      if (project?.id) {
        const updated = await base44.entities.ClientProject.update(project.id, withName);
        setProject(updated);
        return updated;
      } else {
        const created = await base44.entities.ClientProject.create({
          client_email: effectiveEmail,
          project_name: withName.project_name || buildProjectName({}),
          ...withName,
        });
        setProject(created);
        return created;
      }
    } catch { return null; }
  }, [project, effectiveEmail, autoBuild.isActive, autoBuild.saveBuild]);

  return { project, loading, saveProject, reload: load };
}