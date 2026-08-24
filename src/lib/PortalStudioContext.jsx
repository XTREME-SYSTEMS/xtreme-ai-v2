import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// PortalStudioContext — holds the active sandbox project. When active, the
// Portal Studio hooks (usePortalStudioUser, usePortalStudioProject,
// usePortalStudioPipeline) read/write the selected PortalStudioProject
// record instead of User/ClientProject. This gives the admin a fully
// isolated clone of the client portal experience.
const PortalStudioContext = createContext(null);

export function PortalStudioProvider({ children }) {
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load the project when activeProjectId changes
  useEffect(() => {
    if (!activeProjectId) { setProject(null); return; }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const p = await base44.entities.PortalStudioProject.get(activeProjectId);
        if (!cancelled) setProject(p);
      } catch {
        if (!cancelled) setProject(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeProjectId]);

  // Subscribe to realtime updates so the timeline reflects writes immediately
  useEffect(() => {
    if (!activeProjectId) return;
    const unsub = base44.entities.PortalStudioProject.subscribe((event) => {
      if (event?.id === activeProjectId && event?.type === "update") {
        base44.entities.PortalStudioProject.get(activeProjectId).then(setProject).catch(() => {});
      }
    });
    return unsub;
  }, [activeProjectId]);

  const reload = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const p = await base44.entities.PortalStudioProject.get(activeProjectId);
      setProject(p);
    } catch {}
  }, [activeProjectId]);

  const saveProject = useCallback(async (data) => {
    if (!activeProjectId) return null;
    try {
      const updated = await base44.entities.PortalStudioProject.update(activeProjectId, data);
      setProject(updated);
      return updated;
    } catch {
      return null;
    }
  }, [activeProjectId]);

  const clearActiveProject = useCallback(() => {
    setActiveProjectId(null);
    setProject(null);
  }, []);

  const value = {
    activeProjectId,
    project,
    loading,
    isActive: !!activeProjectId,
    setActiveProjectId,
    clearActiveProject,
    saveProject,
    reload,
  };

  return <PortalStudioContext.Provider value={value}>{children}</PortalStudioContext.Provider>;
}

export function usePortalStudio() {
  const ctx = useContext(PortalStudioContext);
  return ctx || { isActive: false, activeProjectId: null, project: null, loading: false, setActiveProjectId: () => {}, clearActiveProject: () => {}, saveProject: () => null, reload: () => {} };
}