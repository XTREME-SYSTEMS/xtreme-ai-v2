import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getTrack, TRACKS, PRODUCT_TO_TRACK, PRIORITY } from "@/lib/onboardingTracks";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";

// L1 — Uses React Query for automatic deduplication: ClientTimeline and
// StepCoach both call this hook, but the purchase fetch only runs once
// per cache window (60s staleTime).
// C2 — Filters purchases by the effective email (client or previewed client)
// so admin preview resolves the correct product, not all purchases.
export function useClientTrack(user) {
  const { effectiveEmail, isScoped } = usePreviewEmail(user);
  const email = effectiveEmail || user?.email;

  const query = useQuery({
    queryKey: ["clientTrack", email, isScoped],
    queryFn: async () => {
      const query = { status: "paid" };
      if (email) query.buyerEmail = email;
      const purchases = await base44.entities.Base44Purchase.filter(query, "-created_date", 20);
      const track = getTrack(purchases);

      // Resolve the active productId from purchases (highest-priority track wins)
      const keys = (purchases || []).map((p) => PRODUCT_TO_TRACK[p.productId]).filter(Boolean);
      const topTrack = PRIORITY.find((k) => keys.includes(k));
      let productId = null;
      if (topTrack) {
        const topPurchase = (purchases || []).find((p) => PRODUCT_TO_TRACK[p.productId] === topTrack);
        productId = topPurchase?.productId || null;
      } else if (user.plan === "elite" || user.role === "admin") {
        productId = "elite-monthly";
      } else if (user.plan === "pro") {
        productId = "pro-monthly";
      }

      return { track, productId };
    },
    enabled: !!user,
    staleTime: 60000,
  });

  return {
    track: query.data?.track || TRACKS.default,
    productId: query.data?.productId || null,
    loading: query.isLoading,
  };
}