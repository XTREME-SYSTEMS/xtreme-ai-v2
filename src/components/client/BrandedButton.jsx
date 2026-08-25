import { cn } from "@/lib/utils";
import { MapPin, Loader2, Check, ArrowRight } from "lucide-react";

// Branded mobile-first CTA button. Full-width on mobile, auto-width on
// desktop. Lime green with bold black text, min 48px touch height, active
// scale animation. Pass `showLogo` to prefix the MapPin brand mark.
// The revision / secondary buttons on each step are untouched — this only
// styles the primary "approve / continue" action.
export default function BrandedButton({
  children,
  onClick,
  disabled,
  loading,
  saved,
  savedLabel = "Saved",
  loadingLabel = "Saving…",
  icon: Icon,
  trailingIcon: TrailingIcon = ArrowRight,
  showLogo = false,
  className,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-bold text-black transition-all hover:bg-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 sm:w-auto sm:px-6",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {loadingLabel}
        </>
      ) : saved ? (
        <>
          <Check className="h-4 w-4" /> {savedLabel}
        </>
      ) : (
        <>
          {showLogo && <MapPin className="h-4 w-4 shrink-0" />}
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {children}
          {TrailingIcon && <TrailingIcon className="h-4 w-4 shrink-0" />}
        </>
      )}
    </button>
  );
}