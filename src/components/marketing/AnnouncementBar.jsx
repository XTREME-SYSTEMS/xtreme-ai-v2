import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <Link to="/coupon" className="block w-full bg-lime-400 text-black transition-colors hover:bg-lime-300">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-xs font-bold sm:text-sm">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">10% OFF AI-Optimized Websites — Claim Your Coupon</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
      </div>
    </Link>
  );
}