import { useState } from "react";
import { Image } from "@/components/ui/image";
import { X, Monitor, Smartphone, Check, Palette, Phone, MapPin, Star, ArrowRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// Full-screen preview of a single design pack rendered as a mock epoxy
// contractor website, auto-filled with the client's Business Profile data.
// The client can toggle desktop/mobile, toggle a dark/light color theme, and
// select the pack — all so they can see their finished product before choosing.

const DEFAULT_SERVICES = ["Epoxy Floor Coatings", "Polished Concrete", "Garage Floor Coatings"];

export default function DesignPackPreview({ pack, profile, selected, onSelect, onClose }) {
  const [device, setDevice] = useState("desktop"); // "desktop" | "mobile"
  const [light, setLight] = useState(false); // color toggle

  const p = profile || {};
  const businessName = p.businessName || "Your Epoxy Business";
  const phone = p.phone || "(555) 123-4567";
  const email = p.email || "info@yourepoxy.com";
  const location = p.primaryLocation || "Your City, ST";
  const services = (p.services && p.services.length ? p.services : DEFAULT_SERVICES).slice(0, 6);
  const differentiators = p.differentiators || [];
  const years = p.yearsInBusiness || "";
  const gallery = (p.galleryUrls || []).slice(0, 4);

  const accent = pack.colors[1] || pack.colors[0];
  const theme = {
    bg: light ? "#ffffff" : pack.colors[0],
    surface: light ? "#f4f4f5" : "rgba(255,255,255,0.06)",
    surface2: light ? "#ffffff" : "rgba(255,255,255,0.04)",
    text: light ? "#18181b" : "#ffffff",
    muted: light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)",
    border: light ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.12)",
    accent,
    accentText: "#ffffff",
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-zinc-950 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-lime-400" />
          <span className="text-sm font-semibold text-white">{pack.name}</span>
          <span className="hidden text-xs text-white/40 sm:inline">Live preview</span>
        </div>

        {/* Device toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 p-0.5">
          <ToggleBtn on={device === "desktop"} onClick={() => setDevice("desktop")} icon={Monitor} label="Desktop" />
          <ToggleBtn on={device === "mobile"} onClick={() => setDevice("mobile")} icon={Smartphone} label="Mobile" />
        </div>

        {/* Color toggle */}
        <button
          type="button"
          onClick={() => setLight((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/5"
        >
          <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: light ? "#ffffff" : pack.colors[0] }} />
          {light ? "Light" : "Dark"}
        </button>

        <button
          type="button"
          onClick={() => onSelect()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            selected ? "border border-lime-400 bg-lime-400/10 text-lime-300" : "bg-lime-400 text-black hover:bg-lime-300"
          )}
        >
          {selected ? <><Check className="h-3.5 w-3.5" /> Selected</> : <>Select this look</>}
        </button>

        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/5 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Preview stage */}
      <div className="flex-1 overflow-auto bg-zinc-900 p-3 sm:p-6">
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-xl border shadow-2xl transition-all",
            device === "mobile" ? "w-[390px] rounded-[2rem] border-zinc-700" : "w-full max-w-5xl border-white/10"
          )}
        >
          {device === "mobile" && (
            <div className="flex justify-center bg-zinc-800 py-2">
              <div className="h-1.5 w-24 rounded-full bg-zinc-600" />
            </div>
          )}
          <MockSite theme={theme} pack={pack} mobile={device === "mobile"} data={{ businessName, phone, email, location, services, differentiators, years, gallery }} />
        </div>
      </div>
    </div>
  );
}

function ToggleBtn({ on, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        on ? "bg-lime-400 text-black" : "text-white/60 hover:text-white"
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function MockSite({ theme, pack, mobile, data }) {
  const { businessName, phone, email, location, services, differentiators, years, gallery } = data;
  const heroImg = gallery[0] || pack.img;
  const cols = mobile ? "grid-cols-1" : "grid-cols-3";

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text }} className="text-sm">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold" style={{ backgroundColor: theme.accent, color: theme.accentText }}>
            {businessName.charAt(0)}
          </div>
          <span className="text-sm font-bold tracking-tight">{businessName}</span>
        </div>
        {!mobile && (
          <nav className="ml-6 flex items-center gap-5 text-xs" style={{ color: theme.muted }}>
            <span>Services</span>
            <span>About</span>
            <span>Gallery</span>
            <span>Contact</span>
          </nav>
        )}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
          style={{ backgroundColor: theme.accent, color: theme.accentText }}
        >
          <Phone className="h-3.5 w-3.5" /> {mobile ? "Call" : phone}
        </a>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${theme.bg}, transparent 70%)` }} />
        </div>
        <div className={cn("relative px-4", mobile ? "py-10" : "py-20")}>
          <div className={cn(mobile ? "max-w-full" : "max-w-xl")}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: theme.accent, color: theme.accentText }}
            >
              <MapPin className="h-3 w-3" /> {location}
            </span>
            <h1 className={cn("mt-3 font-extrabold leading-[1.05] tracking-tight", mobile ? "text-2xl" : "text-5xl")}>
              {services[0]} <br /> in {location}
            </h1>
            <p className="mt-3 max-w-md text-xs" style={{ color: theme.muted }}>
              {businessName} delivers durable, showroom-quality {services[0].toLowerCase()} for homes and businesses
              {years ? ` — ${years} of trusted craftsmanship` : ""}.
            </p>
            <div className={cn("mt-5 flex items-center gap-2", mobile && "flex-col items-stretch")}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-xs font-semibold"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                Get a Free Quote <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-xs font-semibold"
                style={{ border: `1px solid ${theme.border}`, color: theme.text }}
              >
                <Phone className="h-3.5 w-3.5" /> {phone}
              </a>
            </div>
            {differentiators.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {differentiators.slice(0, 4).map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: theme.surface, color: theme.muted }}>
                    <Check className="h-3 w-3" style={{ color: theme.accent }} /> {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="px-4 py-8">
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-4 w-4" style={{ color: theme.accent }} />
          <h2 className="text-base font-bold">Our Services</h2>
        </div>
        <div className={cn("grid gap-3", cols)}>
          {services.map((s, i) => (
            <div key={s} className="rounded-lg p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold" style={{ backgroundColor: theme.accent, color: theme.accentText }}>
                {i + 1}
              </div>
              <h3 className="mt-2.5 text-xs font-semibold">{s}</h3>
              <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>
                Professional {s.toLowerCase()} built to last — backed by {businessName}'s quality guarantee.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      {differentiators.length > 0 && (
        <section className="px-4 py-8" style={{ backgroundColor: theme.surface2, borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}` }}>
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: theme.accent }} />
            <h2 className="text-base font-bold">Why Choose {businessName}</h2>
          </div>
          <div className={cn("grid gap-2", mobile ? "grid-cols-1" : "grid-cols-2")}>
            {differentiators.map((d) => (
              <div key={d} className="flex items-center gap-2 rounded-md p-2" style={{ backgroundColor: theme.surface }}>
                <Check className="h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                <span className="text-xs font-medium">{d}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="px-4 py-8">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-4 w-4" style={{ color: theme.accent }} />
            <h2 className="text-base font-bold">Recent Work</h2>
          </div>
          <div className={cn("grid gap-2", mobile ? "grid-cols-2" : "grid-cols-4")}>
            {gallery.map((url) => (
              <div key={url} className="aspect-square overflow-hidden rounded-md" style={{ border: `1px solid ${theme.border}` }}>
                <Image src={url} alt="" fittingType="fill" className="h-full w-full" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact / CTA */}
      <section className="px-4 py-10 text-center">
        <h2 className="text-lg font-bold">Ready to transform your floors?</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-xs" style={{ color: theme.muted }}>
          Serving {location}. Call now for a free, no-obligation quote.
        </p>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-xs font-semibold"
          style={{ backgroundColor: theme.accent, color: theme.accentText }}
        >
          <Phone className="h-3.5 w-3.5" /> {phone}
        </a>
        <p className="mt-2 text-[11px]" style={{ color: theme.muted }}>{email}</p>
      </section>

      {/* Footer */}
      <footer className="px-4 py-5 text-center text-[10px]" style={{ borderTop: `1px solid ${theme.border}`, color: theme.muted }}>
        © {new Date().getFullYear()} {businessName} · {location}
      </footer>
    </div>
  );
}