import { useRef } from "react";
import { Image } from "@/components/ui/image";
import { useSize } from "@/hooks/use-size";
import { Phone, MapPin, Star, Shield, ArrowRight, Check, Menu, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Renders a single website layout (an ordered list of sections) with the
// client's real content, brand theme, and logo. Fluid width — fills its
// container; `mobile` switches the internal responsive layouts.

export function ScaledPreview({ designWidth, children, aspect = 0.6 }) {
  const ref = useRef(null);
  const size = useSize(ref);
  const w = size?.width || 320;
  const scale = w / designWidth;
  return (
    <div ref={ref} className="w-full overflow-hidden" style={{ height: w * aspect }}>
      <div style={{ width: designWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

export default function WebsitePreview({ layout, content, profile, theme, mobile, logoUrl, images, annotate, onSectionClick }) {
  const c = content || {};
  const p = profile || {};
  const businessName = p.businessName || "Your Epoxy Business";
  const phone = p.phone || "(555) 123-4567";
  const email = p.email || "info@yourepoxy.com";
  const location = p.primaryLocation || "Your City, ST";
  const rawServices = (c.services && c.services.length)
    ? c.services
    : (p.services || []).map((s) => ({ title: s, description: "" }));
  const services = rawServices.slice(0, 6);
  const faqs = c.faq || [];
  const differentiators = p.differentiators || [];
  const gallery = (images && images.length ? images : (p.galleryUrls || [])).slice(0, 6);
  const data = {
    businessName, phone, email, location, services, faqs, differentiators, gallery,
    heroHeadline: c.heroHeadline || `${services[0]?.title || "Epoxy Flooring"} in ${location}`,
    heroSubhead: c.heroSubhead || `${businessName} delivers durable, showroom-quality results for homes and businesses.`,
    aboutTitle: c.aboutTitle || `About ${businessName}`,
    aboutBody: c.aboutBody || "",
    localArea: c.localArea || "",
    ctaText: c.cta || "Get a Free Quote",
  };

  const sectionMap = { nav: Nav, hero: Hero, services: Services, about: About, gallery: Gallery, faq: Faq, cta: Cta, footer: Footer };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text }} className="text-sm">
      {layout.sections.map((s, i) => {
        const Comp = sectionMap[s.type];
        if (!Comp) return null;
        const inner = <Comp variant={s.variant} theme={theme} mobile={mobile} logoUrl={logoUrl} data={data} />;
        if (!annotate) return <div key={i}>{inner}</div>;
        return (
          <div
            key={i}
            className="group/sect relative cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onSectionClick?.(s.type, s.variant); }}
          >
            {inner}
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover/sect:opacity-100"
              style={{ outline: `2px dashed ${theme.accent}`, outlineOffset: -3, backgroundColor: `${theme.accent}1a` }}
            >
              <div
                className="absolute right-2 top-2 rounded-md px-2 py-1 text-[10px] font-semibold"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                ✎ Comment / Regenerate
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Logo({ theme, logoUrl, businessName }) {
  if (logoUrl) {
    return (
      <div className="flex items-center gap-2">
        <img src={logoUrl} alt={businessName} className="h-7 w-auto max-w-[140px] object-contain" style={{ filter: theme.isDark ? "brightness(1)" : "none" }} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold" style={{ backgroundColor: theme.accent, color: theme.accentText }}>
        {businessName.charAt(0)}
      </div>
      <span className="text-sm font-bold tracking-tight">{businessName}</span>
    </div>
  );
}

function SectionWrap({ theme, title, icon: Icon, children, surface2 }) {
  return (
    <section className="px-4 py-8" style={surface2 ? { backgroundColor: theme.surface2, borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}` } : undefined}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: theme.accent }} />
        <h2 className="text-base font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Nav({ variant, theme, mobile, logoUrl, data }) {
  const links = ["Services", "About", "Gallery", "FAQ", "Contact"];
  const CTA = (
    <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: theme.accent, color: theme.accentText }}>
      <Phone className="h-3.5 w-3.5" /> {mobile ? "Call" : data.phone}
    </a>
  );
  if (variant === "minimal") {
    return (
      <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <Logo theme={theme} logoUrl={logoUrl} businessName={data.businessName} />
        {mobile ? <Menu className="h-5 w-5" style={{ color: theme.text }} /> : CTA}
      </header>
    );
  }
  if (variant === "centered") {
    return (
      <header className="px-4 py-3 text-center" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex justify-center"><Logo theme={theme} logoUrl={logoUrl} businessName={data.businessName} /></div>
        {!mobile && (
          <nav className="mt-2 flex justify-center gap-5 text-xs" style={{ color: theme.muted }}>
            {links.map((l) => <span key={l}>{l}</span>)}
          </nav>
        )}
      </header>
    );
  }
  return (
    <header className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <Logo theme={theme} logoUrl={logoUrl} businessName={data.businessName} />
      {!mobile && (
        <nav className="ml-6 flex items-center gap-5 text-xs" style={{ color: theme.muted }}>
          {links.map((l) => <span key={l}>{l}</span>)}
        </nav>
      )}
      <div className="ml-auto">{CTA}</div>
    </header>
  );
}

function Hero({ variant, theme, mobile, data }) {
  const heroImg = data.gallery[0];
  const badge = (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider" style={{ backgroundColor: theme.accent, color: theme.accentText }}>
      <MapPin className="h-3 w-3" /> {data.location}
    </span>
  );
  const headline = <h1 className={cn("font-extrabold leading-[1.05] tracking-tight", mobile ? "text-2xl" : "text-5xl")}>{data.heroHeadline}</h1>;
  const sub = <p className="mt-3 max-w-md text-xs" style={{ color: theme.muted }}>{data.heroSubhead}</p>;
  const btns = (
    <div className={cn("mt-5 flex items-center gap-2", mobile && "flex-col items-stretch")}>
      <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-xs font-semibold" style={{ backgroundColor: theme.accent, color: theme.accentText }}>
        {data.ctaText} <ArrowRight className="h-3.5 w-3.5" />
      </a>
      <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-xs font-semibold" style={{ border: `1px solid ${theme.border}`, color: theme.text }}>
        <Phone className="h-3.5 w-3.5" /> {data.phone}
      </a>
    </div>
  );
  const diffs = data.differentiators.length > 0 && (
    <div className="mt-5 flex flex-wrap gap-1.5">
      {data.differentiators.slice(0, 4).map((d) => (
        <span key={d} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: theme.surface, color: theme.muted }}>
          <Check className="h-3 w-3" style={{ color: theme.accent }} /> {d}
        </span>
      ))}
    </div>
  );

  if (variant === "centered") {
    return (
      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="flex justify-center">{badge}</div>
          <div className="mt-3">{headline}</div>
          {sub}
          <div className="mt-5 flex justify-center">{btns}</div>
          {diffs}
        </div>
        {heroImg && (
          <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-xl" style={{ border: `1px solid ${theme.border}` }}>
            <Image src={heroImg} alt="" fittingType="fill" className="aspect-[16/9] w-full" />
          </div>
        )}
      </section>
    );
  }
  if (variant === "fullbleed") {
    return (
      <section className="relative overflow-hidden">
        {heroImg && (
          <div className="absolute inset-0">
            <img src={heroImg} alt="" className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${theme.bg}, transparent 70%)` }} />
          </div>
        )}
        <div className={cn("relative px-4", mobile ? "py-10" : "py-20")}>
          <div className={cn(mobile ? "max-w-full" : "max-w-xl")}>
            {badge}{headline}{sub}{btns}{diffs}
          </div>
        </div>
      </section>
    );
  }
  if (variant === "card") {
    return (
      <section className="relative overflow-hidden px-4 py-12">
        {heroImg && (
          <div className="absolute inset-0">
            <img src={heroImg} alt="" className="h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0" style={{ background: theme.bg, opacity: 0.55 }} />
          </div>
        )}
        <div className={cn("relative mx-auto rounded-xl p-6", mobile ? "max-w-full" : "max-w-2xl")} style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          {badge}{headline}{sub}{btns}{diffs}
        </div>
      </section>
    );
  }
  // split
  return (
    <section className="px-4 py-12">
      <div className={cn("grid items-center gap-6", mobile ? "grid-cols-1" : "grid-cols-2")}>
        <div>{badge}{headline}{sub}{btns}{diffs}</div>
        {heroImg && (
          <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${theme.border}` }}>
            <Image src={heroImg} alt="" fittingType="fill" className="aspect-[4/3] w-full" />
          </div>
        )}
      </div>
    </section>
  );
}

function Services({ variant, theme, mobile, data }) {
  const cols = mobile ? "grid-cols-1" : variant === "grid3" ? "grid-cols-3" : variant === "grid2" ? "grid-cols-2" : "grid-cols-1";
  const card = (s, i) => (
    <div className="rounded-lg p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
      <div className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold" style={{ backgroundColor: theme.accent, color: theme.accentText }}>{i + 1}</div>
      <h3 className="mt-2.5 text-xs font-semibold">{s.title}</h3>
      {s.description && <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>{s.description}</p>}
    </div>
  );
  if (variant === "rows") {
    return (
      <SectionWrap theme={theme} title="Our Services" icon={Star}>
        <div className="space-y-2">
          {data.services.map((s, i) => (
            <div key={i} className="flex gap-3 rounded-lg p-3" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold" style={{ backgroundColor: theme.accent, color: theme.accentText }}>{i + 1}</div>
              <div><h3 className="text-xs font-semibold">{s.title}</h3>{s.description && <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>{s.description}</p>}</div>
            </div>
          ))}
        </div>
      </SectionWrap>
    );
  }
  if (variant === "cards") {
    return (
      <SectionWrap theme={theme} title="Our Services" icon={Star}>
        <div className={cn("grid gap-3", cols)}>{data.services.map(card)}</div>
      </SectionWrap>
    );
  }
  return (
    <SectionWrap theme={theme} title="Our Services" icon={Star}>
      <div className={cn("grid gap-3", cols)}>
        {data.services.map((s, i) => (
          <div key={i} className="rounded-lg p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <h3 className="text-xs font-semibold">{s.title}</h3>
            {s.description && <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>{s.description}</p>}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function About({ variant, theme, mobile, data }) {
  if (variant === "stats") {
    const labels = ["Satisfaction", "Rated", "Estimates"];
    const big = ["100%", "5★", "Free"];
    return (
      <SectionWrap theme={theme} title={data.aboutTitle} icon={Shield} surface2>
        <div className={cn("grid gap-3", mobile ? "grid-cols-1" : "grid-cols-3")}>
          {big.map((b, i) => (
            <div key={i} className="rounded-lg p-4 text-center" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
              <div className="text-lg font-extrabold" style={{ color: theme.accent }}>{b}</div>
              <div className="mt-1 text-[11px]" style={{ color: theme.muted }}>{labels[i]}</div>
            </div>
          ))}
        </div>
        {data.aboutBody && <p className="mt-4 text-xs leading-relaxed" style={{ color: theme.muted }}>{data.aboutBody}</p>}
      </SectionWrap>
    );
  }
  if (variant === "story") {
    return (
      <SectionWrap theme={theme} title={data.aboutTitle} icon={Shield} surface2>
        <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>{data.aboutBody}</p>
        {data.localArea && <p className="mt-3 text-xs leading-relaxed" style={{ color: theme.muted }}>{data.localArea}</p>}
      </SectionWrap>
    );
  }
  return (
    <SectionWrap theme={theme} title={data.aboutTitle} icon={Shield} surface2>
      <div className="rounded-lg p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>{data.aboutBody}</p>
        {data.differentiators.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.differentiators.slice(0, 6).map((d) => (
              <span key={d} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: theme.surface2, color: theme.muted }}>
                <Check className="h-3 w-3" style={{ color: theme.accent }} /> {d}
              </span>
            ))}
          </div>
        )}
      </div>
    </SectionWrap>
  );
}

function Gallery({ variant, theme, mobile, data }) {
  if (data.gallery.length === 0) return null;
  const cols = mobile ? "grid-cols-2" : variant === "masonry" ? "grid-cols-2" : "grid-cols-4";
  return (
    <SectionWrap theme={theme} title="Recent Work" icon={Star}>
      <div className={cn("grid gap-2", cols)}>
        {data.gallery.map((url, i) => (
          <div key={i} className={cn("overflow-hidden rounded-md", variant === "masonry" && i % 2 === 0 ? "aspect-[3/4]" : "aspect-square")} style={{ border: `1px solid ${theme.border}` }}>
            <Image src={url} alt="" fittingType="fill" className="h-full w-full" />
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function Faq({ variant, theme, mobile, data }) {
  if (data.faqs.length === 0) return null;
  const cols = mobile ? "grid-cols-1" : variant === "twocol" ? "grid-cols-2" : "grid-cols-1";
  if (variant === "accordion") {
    return (
      <SectionWrap theme={theme} title="FAQ" icon={Star} surface2>
        <div className="space-y-2">
          {data.faqs.map((f, i) => (
            <details key={i} className="rounded-lg p-3" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold">
                {f.question} <ChevronDown className="h-3.5 w-3.5" style={{ color: theme.accent }} />
              </summary>
              <p className="mt-2 text-[11px]" style={{ color: theme.muted }}>{f.answer}</p>
            </details>
          ))}
        </div>
      </SectionWrap>
    );
  }
  return (
    <SectionWrap theme={theme} title="FAQ" icon={Star} surface2>
      <div className={cn("grid gap-3", cols)}>
        {data.faqs.map((f, i) => (
          <div key={i} className="rounded-lg p-3" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <h3 className="text-xs font-semibold">{f.question}</h3>
            <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>{f.answer}</p>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function Cta({ variant, theme, mobile, data }) {
  const btn = (
    <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-xs font-semibold" style={{ backgroundColor: theme.accent, color: theme.accentText }}>
      <Phone className="h-3.5 w-3.5" /> {data.phone}
    </a>
  );
  if (variant === "split") {
    return (
      <section className="px-4 py-10">
        <div className={cn("flex items-center gap-4 rounded-xl p-6", mobile && "flex-col text-center")} style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Ready to transform your floors?</h2>
            <p className="mt-1 text-xs" style={{ color: theme.muted }}>Serving {data.location}. Call now for a free, no-obligation quote.</p>
          </div>
          {btn}
        </div>
      </section>
    );
  }
  if (variant === "card") {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-md rounded-xl p-6 text-center" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <h2 className="text-lg font-bold">Ready to transform your floors?</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-xs" style={{ color: theme.muted }}>Serving {data.location}. Call now for a free quote.</p>
          <div className="mt-4 flex justify-center">{btn}</div>
          <p className="mt-2 text-[11px]" style={{ color: theme.muted }}>{data.email}</p>
        </div>
      </section>
    );
  }
  return (
    <section className="px-4 py-10 text-center">
      <h2 className="text-lg font-bold">Ready to transform your floors?</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-xs" style={{ color: theme.muted }}>Serving {data.location}. Call now for a free, no-obligation quote.</p>
      <div className="mt-4 flex justify-center">{btn}</div>
      <p className="mt-2 text-[11px]" style={{ color: theme.muted }}>{data.email}</p>
    </section>
  );
}

function Footer({ variant, theme, mobile, data }) {
  if (variant === "rich") {
    return (
      <footer className="px-4 py-8" style={{ borderTop: `1px solid ${theme.border}`, backgroundColor: theme.surface2 }}>
        <div className={cn("grid gap-4", mobile ? "grid-cols-1" : "grid-cols-3")}>
          <div>
            <div className="text-sm font-bold">{data.businessName}</div>
            <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>{data.location}</p>
          </div>
          <div>
            <div className="text-xs font-semibold">Services</div>
            <ul className="mt-1 space-y-0.5 text-[11px]" style={{ color: theme.muted }}>
              {data.services.slice(0, 5).map((s) => <li key={s.title}>{s.title}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold">Contact</div>
            <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>{data.phone}<br />{data.email}</p>
          </div>
        </div>
        <p className="mt-4 text-center text-[10px]" style={{ color: theme.muted }}>© {new Date().getFullYear()} {data.businessName}</p>
      </footer>
    );
  }
  return (
    <footer className="px-4 py-5 text-center text-[10px]" style={{ borderTop: `1px solid ${theme.border}`, color: theme.muted }}>
      © {new Date().getFullYear()} {data.businessName} · {data.location}
    </footer>
  );
}