import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getTrack, TRACKS } from "@/lib/onboardingTracks";

// Resolves the onboarding track for a client based on their paid purchases.
// Pass `null` for users who shouldn't trigger a fetch (e.g. admins).
export function useClientTrack(user) {
  const [track, setTrack] = useState(TRACKS.default);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const purchases = await base44.entities.Base44Purchase.filter({ status: "paid" }, "-created_date", 20);
        if (!cancelled) setTrack(getTrack(purchases));
      } catch (e) {
        if (!cancelled) setTrack(getTrack([]));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { track, loading };
}