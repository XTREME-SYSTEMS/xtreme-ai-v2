import { X, Check, Plus, Minus, Star, Play, Phone, Calendar, ShoppingCart, Megaphone, FileText, Shield, MessageCircle, Camera, MapPin, Zap, Mail, Video, Globe } from "lucide-react";
import { PALETTES, buildTheme } from "@/components/website/websiteLayouts";

// Branded live demo for a single enhancement. Renders a browser-frame mockup
// of the enhancement applied to the client's actual website — their logo,
// business name, and brand palette — so every demo matches their system.
// `selected` + `onToggle` let the user add the enhancement to their contract
// from inside the demo.
export default function EnhancementDemoModal({ enhancement, user, selected, onToggle, onClose }) {
  if (!enhancement) return null;
  const profile = user?.epoxyProfile || {};
  const businessName = profile.businessName || "Your Business";
  const domain = (businessName || "yourbusiness").toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  const logoUrl = user?.chosenLogoUrl || "";
  const palette = PALETTES.find((p) => p.id === user?.chosenPalette) || PALETTES[0];
  const theme = buildTheme(palette, false);
  const accent = theme.accent;
  const accentText = theme.accentText;
  const on = selected;

  const Icon = enhancement.icon;
  const priceLabel = enhancement.price === 0 ? "Free" : `+$${enhancement.price}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: accent + "22", color: accent }}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-white">{enhancement.name}</h2>
            <p className="truncate text-[11px] text-white/40">Live demo · branded for {businessName}</p>
          </div>
          <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: accent, color: accentText }}>{priceLabel}</span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {/* Browser frame */}
        <div className="flex-1 overflow-y-auto bg-zinc-900 p-3 sm:p-5">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-black/10 bg-zinc-100 px-3 py-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="ml-2 flex-1 truncate rounded-md bg-white px-2.5 py-1 text-[11px] text-zinc-500">https://{domain}</div>
            </div>

            {/* Brand header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: theme.bg, color: theme.text }}>
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={businessName} className="h-7 w-auto object-contain" style={{ maxHeight: 28 }} />
                ) : (
                  <span className="rounded px-2 py-1 text-xs font-bold" style={{ background: accent, color: accentText }}>{businessName.slice(0, 2).toUpperCase()}</span>
                )}
                <span className="text-sm font-bold">{businessName}</span>
              </div>
              <span className="hidden text-xs sm:inline" style={{ color: theme.muted }}>Demo Preview</span>
            </div>

            {/* Demo content by type */}
            <DemoContent demoType={enhancement.demoType} theme={theme} businessName={businessName} accent={accent} accentText={accentText} />
          </div>

          <p className="mt-3 text-xs text-white/50">{enhancement.description}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-white/10 bg-zinc-950 px-4 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            style={on ? { background: accent, color: accentText } : { background: "transparent", color: accent, border: `1px solid ${accent}` }}
          >
            {on ? <><Check className="h-4 w-4" /> Added to contract</> : <><Plus className="h-4 w-4" /> Add to contract — {priceLabel}</>}
          </button>
          <button onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5">Close</button>
        </div>
      </div>
    </div>
  );
}

// Renders the enhancement-specific mockup inside the browser frame, all using
// the client's brand palette so it looks like part of their actual site.
function DemoContent({ demoType, theme, businessName, accent, accentText }) {
  const t = theme;
  const card = { background: t.surface, border: `1px solid ${t.border}`, color: t.text };
  const btn = { background: accent, color: accentText };
  const muted = { color: t.muted };

  switch (demoType) {
    case "faq":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-base font-bold" style={{ color: t.text }}>Frequently Asked Questions</h3>
          <div className="mt-3 space-y-2">
            {["How much does a typical project cost?", "How long does installation take?", "Do you offer free estimates?", "What areas do you serve?"].map((q, i) => (
              <div key={i} className="rounded-lg p-3" style={card}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{q}</span>
                  <span className="text-xs" style={{ color: accent }}>＋</span>
                </div>
                {i === 0 && <p className="mt-1.5 text-[11px]" style={muted}>Every project is unique — most fall between $2,500–$8,000 depending on size and scope. We offer free on-site estimates…</p>}
              </div>
            ))}
          </div>
        </div>
      );
    case "legal":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <div className="rounded-lg p-4" style={card}>
            <h3 className="text-sm font-bold" style={{ color: t.text }}>Privacy Policy — {businessName}</h3>
            <div className="mt-2 space-y-1.5 text-[11px]" style={muted}>
              <p><span style={{ color: t.text }}>1. Information We Collect.</span> We collect information you provide when you request a quote, schedule a service, or contact us…</p>
              <p><span style={{ color: t.text }}>2. How We Use Information.</span> To provide and improve our services, respond to inquiries, and send appointment reminders…</p>
              <p><span style={{ color: t.text }}>3. Data Security.</span> We implement industry-standard safeguards to protect your personal information…</p>
            </div>
            <button className="mt-3 rounded px-3 py-1.5 text-[11px] font-semibold" style={btn}>Download PDF</button>
          </div>
        </div>
      );
    case "widget":
      return (
        <div className="relative px-5 py-8" style={{ background: t.bg }}>
          <div className="text-center text-xs" style={muted}>Your website content here…</div>
          <div className="mx-auto mt-4 max-w-xs space-y-2">
            <div className="h-3 rounded" style={{ background: t.surface2 }} />
            <div className="h-3 rounded w-3/4" style={{ background: t.surface2 }} />
          </div>
          <div className="fixed-demo-btn" style={{ position: "absolute", right: 16, bottom: 16 }}>
            <div className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold shadow-lg" style={btn}>
              <MessageCircle className="h-4 w-4" /> Chat / Call
            </div>
          </div>
        </div>
      );
    case "page":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <span className="text-[10px] font-semibold uppercase" style={{ color: accent }}>Services</span>
          <h3 className="mt-1 text-base font-bold" style={{ color: t.text }}>Commercial Epoxy Flooring</h3>
          <p className="mt-1 text-[11px]" style={muted}>Durable, seamless coatings engineered for high-traffic commercial and industrial spaces.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[1, 2].map((i) => <div key={i} className="aspect-video rounded-lg" style={{ background: t.surface2 }} />)}
          </div>
          <button className="mt-3 rounded px-3 py-1.5 text-[11px] font-semibold" style={btn}>Get a Free Quote</button>
        </div>
      );
    case "call":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>Call Tracking Dashboard</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[["Calls", "47"], ["Answered", "39"], ["Missed", "8"]].map(([l, v]) => (
              <div key={l} className="rounded-lg p-2.5 text-center" style={card}>
                <div className="text-lg font-bold" style={{ color: accent }}>{v}</div>
                <div className="text-[10px]" style={muted}>{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg p-3" style={card}>
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: t.text }}>(555) 010-2938</span>
              <span style={muted}>2:14 min · Recorded</span>
            </div>
            <div className="mt-2 flex gap-1">
              {[40, 65, 30, 80, 55, 90, 70].map((h, i) => <div key={i} className="flex-1 rounded-sm" style={{ height: h / 2, background: accent + "66" }} />)}
            </div>
          </div>
        </div>
      );
    case "gallery":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>Before &amp; After</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg" style={card}>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-[10px]" style={{ background: t.surface2, color: t.muted }}>Before</div>
                  <div className="flex-1 p-3 text-center text-[10px]" style={{ background: accent + "22", color: accentText }}>After</div>
                </div>
                <div className="h-20" style={{ background: `linear-gradient(90deg, ${t.surface2} 50%, ${accent}33 50%)` }} />
              </div>
            ))}
          </div>
        </div>
      );
    case "gbp":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <div className="rounded-lg p-4" style={card}>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={btn}><MapPin className="h-4 w-4" /></div>
              <div>
                <div className="text-sm font-bold" style={{ color: t.text }}>{businessName}</div>
                <div className="flex items-center gap-1 text-[11px]" style={{ color: accent }}>
                  {[0,1,2,3,4].map((s) => <Star key={s} className="h-3 w-3 fill-current" />)}
                  <span style={muted}>· 5.0 (128 reviews)</span>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-[11px]" style={muted}>
              <div>⭐ Top-rated in your service area</div>
              <div>📍 Verified business · Open now</div>
            </div>
            <button className="mt-3 rounded px-3 py-1.5 text-[11px] font-semibold" style={btn}>View on Google</button>
          </div>
        </div>
      );
    case "reviews":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>Review Request Flow</h3>
          <div className="mt-3 rounded-lg p-3" style={card}>
            <div className="text-[11px]" style={muted}>Text message sent after job completion:</div>
            <div className="mt-2 rounded-lg p-2.5 text-[11px]" style={{ background: t.surface2, color: t.text }}>
              Hi John! Thanks for choosing {businessName}. How was your experience? Tap to leave a quick review: ⭐→
            </div>
            <div className="mt-2 flex gap-1">
              {[0,1,2,3,4].map((s) => <Star key={s} className="h-4 w-4" style={{ color: accent }} />)}
            </div>
          </div>
        </div>
      );
    case "quote":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>Instant Quote Calculator</h3>
          <div className="mt-3 space-y-3 rounded-lg p-3" style={card}>
            <div>
              <div className="flex justify-between text-[11px]"><span style={muted}>Square footage</span><span style={{ color: t.text }}>850 sq ft</span></div>
              <div className="mt-1 h-1.5 rounded-full" style={{ background: t.surface2 }}><div className="h-1.5 rounded-full" style={{ width: "60%", background: accent }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-[11px]"><span style={muted}>Material grade</span><span style={{ color: t.text }}>Premium</span></div>
              <div className="mt-1 h-1.5 rounded-full" style={{ background: t.surface2 }}><div className="h-1.5 rounded-full" style={{ width: "80%", background: accent }} /></div>
            </div>
            <div className="border-t pt-2" style={{ borderColor: t.border }}>
              <div className="flex justify-between"><span className="text-xs font-semibold" style={muted}>Estimated total</span><span className="text-base font-bold" style={{ color: accent }}>$4,250</span></div>
            </div>
          </div>
        </div>
      );
    case "rush":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>Priority Rush Timeline</h3>
          <div className="mt-4 flex items-center gap-2">
            {["Day 1", "Day 2", "Day 3"].map((d, i) => (
              <div key={d} className="flex-1 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold" style={btn}>{i + 1}</div>
                <div className="mt-1.5 text-[10px]" style={muted}>{d}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg p-3 text-[11px]" style={card}>
            <div className="font-semibold" style={{ color: t.text }}>Standard: 2 weeks → Rush: 3 business days</div>
            <p className="mt-1" style={muted}>Your project jumps to the front of the queue with dedicated build resources.</p>
          </div>
        </div>
      );
    case "booking":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>Book an Appointment</h3>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} className="text-center text-[10px]" style={muted}>{d}</div>
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="aspect-square rounded text-[10px] flex items-center justify-center"
                style={i === 9 ? btn : { background: t.surface, color: t.muted, border: `1px solid ${t.border}` }}>{i + 1}</div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            {["9:00 AM", "11:30 AM", "2:00 PM"].map((tm, i) => (
              <button key={tm} className="rounded px-2.5 py-1.5 text-[11px] font-semibold" style={i === 1 ? btn : card}>{tm}</button>
            ))}
          </div>
        </div>
      );
    case "landing":
      return (
        <div className="px-5 py-8 text-center" style={{ background: t.bg }}>
          <span className="text-[10px] font-semibold uppercase" style={{ color: accent }}>Limited Time</span>
          <h3 className="mt-1 text-lg font-bold" style={{ color: t.text }}>Get 15% Off Your Project</h3>
          <p className="mt-1 text-[11px]" style={muted}>Book this month and save on premium {businessName} services.</p>
          <button className="mt-3 rounded-lg px-4 py-2 text-xs font-bold" style={btn}>Claim Offer</button>
        </div>
      );
    case "blog":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <span className="text-[10px] font-semibold uppercase" style={{ color: accent }}>Blog</span>
          <h3 className="mt-1 text-sm font-bold" style={{ color: t.text }}>5 Signs It's Time to Refinish Your Floor</h3>
          <div className="mt-2 aspect-video rounded-lg" style={{ background: t.surface2 }} />
          <p className="mt-2 text-[11px]" style={muted}>If you've noticed cracking, peeling, or dullness in your current coating, it may be time for a refresh. Here's what to look for…</p>
          <div className="mt-2 flex gap-2 text-[10px]" style={muted}><span>4 min read</span><span>·</span><span>Local tips</span></div>
        </div>
      );
    case "social":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>3-Month Content Calendar</h3>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded flex items-center justify-center text-[9px] font-bold"
                style={i % 3 === 0 ? btn : { background: t.surface, color: t.muted, border: `1px solid ${t.border}` }}>{i + 1}</div>
            ))}
          </div>
          <p className="mt-2 text-[11px]" style={muted}>12 posts scheduled across Instagram, Facebook & Google — written, designed, and posted for you.</p>
        </div>
      );
    case "email":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <div className="rounded-lg p-4" style={card}>
            <div className="text-[10px]" style={muted}>Monthly Newsletter · From {businessName}</div>
            <h3 className="mt-1 text-sm font-bold" style={{ color: t.text }}>This Month: Seasonal Maintenance Tips</h3>
            <div className="mt-2 space-y-1.5">
              <div className="h-2 rounded" style={{ background: t.surface2 }} />
              <div className="h-2 rounded w-3/4" style={{ background: t.surface2 }} />
            </div>
            <button className="mt-3 rounded px-3 py-1.5 text-[11px] font-semibold" style={btn}>Read More</button>
          </div>
        </div>
      );
    case "ecommerce":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>Shop</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["$29", "$45", "$120"].map((p, i) => (
              <div key={i} className="rounded-lg p-2" style={card}>
                <div className="aspect-square rounded" style={{ background: t.surface2 }} />
                <div className="mt-1.5 text-[10px] font-semibold" style={{ color: t.text }}>Product {i + 1}</div>
                <div className="text-[11px] font-bold" style={{ color: accent }}>{p}</div>
              </div>
            ))}
          </div>
          <button className="mt-3 inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-semibold" style={btn}><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</button>
        </div>
      );
    case "video_testimonial":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>Customer Story</h3>
          <div className="relative mt-3 aspect-video overflow-hidden rounded-lg" style={{ background: t.surface2 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={btn}><Play className="h-5 w-5 fill-current" /></div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px]" style={{ color: accent }}>
            {[0,1,2,3,4].map((s) => <Star key={s} className="h-3 w-3 fill-current" />)}
            <span style={muted}>· "They transformed our garage — best in the area."</span>
          </div>
        </div>
      );
    case "multi_loc":
      return (
        <div className="px-5 py-6" style={{ background: t.bg }}>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>Service Areas</h3>
          <div className="mt-3 space-y-2">
            {["Downtown", "Northside", "West End", "Suburbs"].map((loc, i) => (
              <div key={loc} className="flex items-center justify-between rounded-lg p-2.5" style={card}>
                <span className="text-xs font-semibold" style={{ color: t.text }}>{businessName} — {loc}</span>
                <span className="text-[10px]" style={{ color: accent }}>SEO-optimized page →</span>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="px-5 py-10 text-center" style={{ background: t.bg }}>
          <p className="text-xs" style={muted}>This enhancement will be applied to your website with your logo, brand colors, and content.</p>
        </div>
      );
  }
}