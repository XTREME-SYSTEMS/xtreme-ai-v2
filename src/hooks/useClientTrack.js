import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getTrack, TRACKS, PRODUCT_TO_TRACK, PRIORITY } from "@/lib/onboardingTracks";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";

// Resolves the active onboarding track + productId for the user.
// In AutoBuild mode, returns the "demo" track (full build with social + video)
// so the timeline shows every step — no purchase fetch needed.
export function useClientTrack(user) {
  const { effectiveEmail, isScoped, isAutoBuild } = usePreviewEmail(user);
  const email = effectiveEmail || user?.email;

  const query = useQuery({
    queryKey: ["clientTrack", email, isScoped],
    queryFn: async () => {
      const query = { status: "paid" };
      if (email) query.buyerEmail = email;
      const purchases = await base44.entities.Base44Purchase.filter(query, "-created_date", 20);
      const track = getTrack(purchases);

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
      } else if (user.plan === "demo") {
        productId = "demo";
      }

      return { track, productId };
    },
    enabled: !!user && !isAutoBuild,
    staleTime: 60000,
  });

  // AutoBuild mode: return the demo track directly (full build with social + video)
  if (isAutoBuild) {
    return { track: TRACKS.demo, productId: "demo", loading: false };
  }

  return {
    track: query.data?.track || TRACKS.default,
    productId: query.data?.productId || null,
    loading: query.isLoading,
  };
}