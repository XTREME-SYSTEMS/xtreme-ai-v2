import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// AutoBuildContext — when active, the client portal's shared hooks
// (useClientUser, useClientUpdate, useClientProject, useClientTrack,
// usePreviewEmail) transparently read/write the selected AutoBuild record
// instead of the User/ClientProject. This lets the admin walk the exact
// same client portal pages (timeline, StepCoach, generators) against an
// AutoBuild, so the Auto Builder looks and operates identically to the
// client portal.
const AutoBuildContext = createContext(null);

export function AutoBuildProvider({ children }) {
  const [activeBuildId, setActiveBuildId] = useState(null);
  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load the build when activeBuildId changes
  useEffect(() => {
    if (!activeBuildId) { setBuild(null); return; }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const b = await base44.entities.AutoBuild.get(activeBuildId);
        if (!cancelled) setBuild(b);
      } catch {
        if (!cancelled) setBuild(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeBuildId]);

  // Subscribe to realtime updates so the timeline reflects writes immediately
  useEffect(() => {
    if (!activeBuildId) return;
    const unsub = base44.entities.AutoBuild.subscribe((event) => {
      if (event?.id === activeBuildId && event?.type === "update") {
        base44.entities.AutoBuild.get(activeBuildId).then(setBuild).catch(() => {});
      }
    });
    return unsub;
  }, [activeBuildId]);

  const reload = useCallback(async () => {
    if (!activeBuildId) return;
    try {
      const b = await base44.entities.AutoBuild.get(activeBuildId);
      setBuild(b);
    } catch {}
  }, [activeBuildId]);

  const saveBuild = useCallback(async (data) => {
    if (!activeBuildId) return null;
    try {
      const updated = await base44.entities.AutoBuild.update(activeBuildId, data);
      setBuild(updated);
      return updated;
    } catch (e) {
      return null;
    }
  }, [activeBuildId]);

  const clearActiveBuild = useCallback(() => {
    setActiveBuildId(null);
    setBuild(null);
  }, []);

  const value = {
    activeBuildId,
    build,
    loading,
    isActive: !!activeBuildId,
    setActiveBuildId,
    clearActiveBuild,
    saveBuild,
    reload,
  };

  return <AutoBuildContext.Provider value={value}>{children}</AutoBuildContext.Provider>;
}

export function useAutoBuild() {
  const ctx = useContext(AutoBuildContext);
  return ctx || { isActive: false, activeBuildId: null, build: null, loading: false, setActiveBuildId: () => {}, clearActiveBuild: () => {}, saveBuild: () => null, reload: () => {} };
}