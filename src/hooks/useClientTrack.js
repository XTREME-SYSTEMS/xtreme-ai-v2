import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getTrack, TRACKS, PRODUCT_TO_TRACK, PRIORITY } from "@/lib/onboardingTracks";

// Resolves the onboarding track AND the active productId for a client based
// on their paid purchases. The productId drives the universal portal —
// portalSteps.js maps it to the exact steps the client sees.
// Falls back to user.plan (set by grantStarterAccess) when there are no
// purchases yet.
// Pass `null` for users who shouldn't trigger a fetch (e.g. admins).
export function useClientTrack(user) {
  const [track, setTrack] = useState(TRACKS.default);
  const [productId, setProductId] = useState(null);
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
        if (cancelled) return;
        setTrack(getTrack(purchases));

        // Resolve the active productId from purchases (highest-priority track wins)
        const keys = (purchases || []).map((p) => PRODUCT_TO_TRACK[p.productId]).filter(Boolean);
        const topTrack = PRIORITY.find((k) => keys.includes(k));
        if (topTrack) {
          const topPurchase = (purchases || []).find((p) => PRODUCT_TO_TRACK[p.productId] === topTrack);
          setProductId(topPurchase?.productId || null);
        } else if (user.plan === "elite" || user.role === "admin") {
          setProductId("elite-monthly");
        } else if (user.plan === "pro") {
          setProductId("pro-monthly");
        } else {
          setProductId(null); // getVisibleSteps falls back to DEFAULT_STEPS
        }
      } catch (e) {
        if (!cancelled) setTrack(getTrack([]));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { track, productId, loading };
}