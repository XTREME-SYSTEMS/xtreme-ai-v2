import { X, Share, Download, Chrome, Smartphone } from "lucide-react";
import { Image } from "@/components/ui/image";
import { LOGO_ICON } from "@/lib/brandAssets";

// Platform-specific install instructions shown when the browser doesn't
// support the automated beforeinstallprompt event (iOS Safari, Firefox, or
// environments like the builder preview where no service worker is registered).
export default function InstallInstructionsModal({ onClose }) {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  const isAndroid = /Android/.test(ua);
  const isEdge = /Edg/.test(ua);

  const steps = isIOS
    ? [
        { icon: Share, text: "Tap the Share button at the bottom of the screen" },
        { icon: Download, text: 'Select \u201CAdd to Home Screen\u201D' },
        { icon: Smartphone, text: 'Tap \u201CAdd\u201D \u2014 the app appears on your home screen' },
      ]
    : isAndroid
    ? [
        { icon: Chrome, text: "Tap the browser menu (three dots, top right)" },
        { icon: Download, text: 'Select \u201CInstall app\u201D or \u201CAdd to Home screen\u201D' },
        { icon: Smartphone, text: "Confirm \u2014 the app installs to your device" },
      ]
    : [
        { icon: Chrome, text: `Look for the install icon in the ${isEdge ? "Edge" : "Chrome"} address bar` },
        { icon: Download, text: 'Click it, or use Menu \u2192 \u201CInstall this site as an app\u201D' },
        { icon: Smartphone, text: "Confirm the prompt \u2014 the app opens in its own window" },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in" onClick={onClose}>
      <div
        className="relative w-[min(92vw,420px)] rounded-2xl border border-amber-400/40 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-90"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-3 top-3 rounded-md p-1.5 text-white/40 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-black ring-1 ring-amber-400/40">
            <Image src={LOGO_ICON} alt="Xtreme AI" fittingType="fit" className="h-16 w-16" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">Install the App</h3>
          <p className="mt-1 text-sm text-white/60">
            {isIOS ? "Follow these steps on your iPhone or iPad:" : "Follow these steps to install:"}
          </p>
          <div className="mt-5 w-full space-y-3 text-left">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-xs font-bold text-amber-400">
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-2 pt-0.5 text-sm text-white/80">
                    <Icon className="h-4 w-4 shrink-0 text-amber-400" /> {step.text}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-300"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}