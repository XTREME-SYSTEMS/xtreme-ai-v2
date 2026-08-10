import { useState, useEffect } from "react";
import { MapPin, Download, X } from "lucide-react";

export default function PWAInstallBar() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    const installedHandler = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (installed || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-lime-400/30 bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-lime-300 via-lime-400 to-lime-600 shadow-lg shadow-lime-400/30">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black">
              <MapPin className="h-5 w-5 text-lime-400" />
            </div>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white">Lead Generation Near You</div>
            <div className="text-[11px] text-white/50">Install our app — leads in your pocket</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleInstall} className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-lime-300 hover:shadow-lg hover:shadow-lime-400/40">
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download App</span><span className="sm:hidden">Install</span>
          </button>
          <button onClick={() => setDismissed(true)} className="rounded-md p-1.5 text-white/40 hover:text-white" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}