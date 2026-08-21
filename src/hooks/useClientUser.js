import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";

// Returns the effective user for client-portal pages.
// - When an admin is previewing as a specific client, fetches that client's
//   User entity record so every page displays the client's real data
//   (profile, logos, brand packs, step completion, etc.).
// - Otherwise, returns the current authenticated user via base44.auth.me().
export function useClientUser() {
  const { previewAsClient, previewClientEmail } = usePreview();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (previewAsClient && previewClientEmail) {
          // Fetch the client's User record so the preview shows their real data
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
  }, [previewAsClient, previewClientEmail]);

  return { user, loading };
}