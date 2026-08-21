import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Package, LayoutTemplate, FileSignature, MessageCircle, Download, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Mobile-only bottom navigation bar with the most important quick-access
// buttons for clients in the build pipeline. Fixed to the bottom of the
// screen, hidden on desktop. Includes a branded PWA download button so
// users can install the app directly from the nav.
export default function MobileBottomNav() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    const installedHandler = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    const ua = navigator.userAgent || "";
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !window.MSStream);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert("To install: tap the Share button in Safari, then select 'Add to Home Screen'.");
    }
  };

  const navItems = [
    { to: "/my-package", label: "Package", icon: Package },
    { to: "/your-designs", label: "Designs", icon: LayoutTemplate },
    { to: "/signatures", label: "Sign", icon: FileSignature },
    { to: "/assistant", label: "Help", icon: MessageCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-lime-400/20 bg-zinc-950/95 backdrop-blur-md md:hidden">
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                isActive ? "text-lime-400" : "text-white/50 hover:text-white/80"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
        {/* Branded PWA download / install button */}
        <button
          type="button"
          onClick={handleInstall}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
            installed ? "text-lime-400" : "text-lime-400 hover:text-lime-300"
          )}
        >
          {installed ? <Check className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          <span className="text-[10px] font-medium">{installed ? "Installed" : "Download"}</span>
        </button>
      </div>
    </nav>
  );
}