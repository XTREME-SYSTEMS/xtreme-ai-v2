import { Image } from "@/components/ui/image";
import { LOGO_ICON } from "@/lib/brandAssets";

// Branded full-screen loader — the Xtreme AI emblem (same icon shown in the
// top-left of the dashboard) inside a spinning ring. Replaces the old plain
// spinner that flashed/glitched on mobile because it had no background and
// used light-theme slate colors. The solid black background matches the app
// shell so there's no white flash before content mounts.
export default function BrandLoader({ fullScreen = true }) {
  return (
    <div className={`${fullScreen ? "fixed inset-0 " : "flex h-screen w-full "}flex items-center justify-center bg-black`}>
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-amber-400" />
        <Image
          src={LOGO_ICON}
          alt="Xtreme AI"
          fittingType="fit"
          className="absolute inset-2 h-12 w-12"
        />
      </div>
    </div>
  );
}