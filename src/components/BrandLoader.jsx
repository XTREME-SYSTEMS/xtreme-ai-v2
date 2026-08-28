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
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* subtle gold pulse ring behind the emblem */}
        <div className="absolute inset-0 animate-ping rounded-full border border-amber-400/30" />
        <div className="absolute inset-2 rounded-full border border-amber-400/15" />
        {/* the shield + wings emblem — the hero */}
        <Image
          src={LOGO_ICON}
          alt="Xtreme AI"
          fittingType="fit"
          className="relative h-20 w-20"
        />
      </div>
    </div>
  );
}