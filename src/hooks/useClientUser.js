import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { buildToUser } from "@/lib/autoBuildSync";

// Returns the effective user for client-portal pages.
// - When an AutoBuild is active (Auto Builder mode), returns a synthetic user
//   built from the AutoBuild record so all client portal pages operate on
//   the build transparently.
// - When an admin is previewing as a specific client, fetches that client's
//   User entity record so every page displays the client's real data.
// - Otherwise, returns the current authenticated user via base44.auth.me().
export function useClientUser() {
  const { previewAsClient, previewClientEmail } = usePreview();
  const autoBuild = useAutoBuild();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // AutoBuild mode: derive synthetic user from the build record
  useEffect(() => {
    if (autoBuild.isActive) {
      setUser(buildToUser(autoBuild.build));
      setLoading(autoBuild.loading);
      return;
    }
  }, [autoBuild.isActive, autoBuild.build, autoBuild.loading]);

  useEffect(() => {
    if (autoBuild.isActive) return; // AutoBuild mode handles its own state
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (previewAsClient && previewClientEmail) {
          const users = await base44.entities.User.filter({ email: previewClientEmail });
          if (!cancelled) {
            setUser(users?.[0] || { email: previewClientEmail, role: "user" });
          }
        } else {
          const me = await base44.auth.me();
          if (!cancelled) setUser(me);
        }
      } catch (e) {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [previewAsClient, previewClientEmail, location.pathname, autoBuild.isActive]);

  return { user, loading };
}