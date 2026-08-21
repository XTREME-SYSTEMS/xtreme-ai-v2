// Brand palettes + 10 distinct website layout definitions for the Website
// Design Studio. Each layout is a different arrangement of reusable
// sections; the studio renders them with the client's real onboarding
// content, chosen logo, and brand palette so what they approve is exactly
// what they get.

export const PALETTES = [
  {
    id: "charcoal-lime",
    name: "Charcoal · Lime",
    dark: { bg: "#0a0a0a", surface: "rgba(255,255,255,0.06)", surface2: "rgba(255,255,255,0.04)", text: "#ffffff", muted: "rgba(255,255,255,0.65)", border: "rgba(255,255,255,0.12)", accent: "#d4ff4d", accentText: "#0a0a0a" },
    light: { bg: "#ffffff", surface: "#f4f4f5", surface2: "#fafafa", text: "#0a0a0a", muted: "rgba(0,0,0,0.6)", border: "rgba(0,0,0,0.10)", accent: "#84cc16", accentText: "#ffffff" },
  },
  {
    id: "navy-gold",
    name: "Navy · Gold",
    dark: { bg: "#0b1f3a", surface: "rgba(255,255,255,0.06)", surface2: "rgba(255,255,255,0.04)", text: "#ffffff", muted: "rgba(255,255,255,0.65)", border: "rgba(255,255,255,0.14)", accent: "#c9a227", accentText: "#0b1f3a" },
    light: { bg: "#f8fafc", surface: "#eef2f7", surface2: "#ffffff", text: "#0b1f3a", muted: "rgba(11,31,58,0.6)", border: "rgba(11,31,58,0.12)", accent: "#b8860b", accentText: "#ffffff" },
  },
  {
    id: "white-teal",
    name: "White · Teal",
    dark: { bg: "#0f172a", surface: "rgba(255,255,255,0.06)", surface2: "rgba(255,255,255,0.04)", text: "#ffffff", muted: "rgba(255,255,255,0.65)", border: "rgba(255,255,255,0.12)", accent: "#2dd4bf", accentText: "#0f172a" },
    light: { bg: "#ffffff", surface: "#f0fdfa", surface2: "#ffffff", text: "#0f172a", muted: "rgba(15,23,42,0.6)", border: "rgba(15,23,42,0.10)", accent: "#0d9488", accentText: "#ffffff" },
  },
  {
    id: "black-orange",
    name: "Black · Orange",
    dark: { bg: "#111111", surface: "rgba(255,255,255,0.06)", surface2: "rgba(255,255,255,0.04)", text: "#ffffff", muted: "rgba(255,255,255,0.65)", border: "rgba(255,255,255,0.12)", accent: "#ff6b1a", accentText: "#111111" },
    light: { bg: "#ffffff", surface: "#fff7ed", surface2: "#ffffff", text: "#111111", muted: "rgba(17,17,17,0.6)", border: "rgba(17,17,17,0.10)", accent: "#ea580c", accentText: "#ffffff" },
  },
  {
    id: "slate-cyan",
    name: "Slate · Cyan",
    dark: { bg: "#1e293b", surface: "rgba(255,255,255,0.06)", surface2: "rgba(255,255,255,0.04)", text: "#ffffff", muted: "rgba(255,255,255,0.65)", border: "rgba(255,255,255,0.12)", accent: "#22d3ee", accentText: "#1e293b" },
    light: { bg: "#f1f5f9", surface: "#e2e8f0", surface2: "#ffffff", text: "#1e293b", muted: "rgba(30,41,59,0.6)", border: "rgba(30,41,59,0.10)", accent: "#0891b2", accentText: "#ffffff" },
  },
  {
    id: "cream-green",
    name: "Cream · Green",
    dark: { bg: "#1f2e1f", surface: "rgba(255,255,255,0.06)", surface2: "rgba(255,255,255,0.04)", text: "#ffffff", muted: "rgba(255,255,255,0.65)", border: "rgba(255,255,255,0.12)", accent: "#84cc16", accentText: "#1f2e1f" },
    light: { bg: "#f5f1e8", surface: "#ece6d6", surface2: "#ffffff", text: "#1f2e1f", muted: "rgba(31,46,31,0.6)", border: "rgba(31,46,31,0.12)", accent: "#4d7c0f", accentText: "#ffffff" },
  },
];

export function buildTheme(palette, light) {
  const t = light ? palette.light : palette.dark;
  return { ...t, isDark: !light };
}

// 10 distinct layouts. `sections` is an ordered list of { type, variant }.
export const WEBSITE_LAYOUTS = [
  { id: "industrial", name: "Bold Industrial", tagline: "Full-bleed hero · 3-col services", sections: [
    { type: "nav", variant: "split" }, { type: "hero", variant: "fullbleed" }, { type: "services", variant: "grid3" },
    { type: "about", variant: "stats" }, { type: "gallery", variant: "grid" }, { type: "faq", variant: "plain" },
    { type: "cta", variant: "banner" }, { type: "footer", variant: "simple" },
  ]},
  { id: "minimal", name: "Clean Minimal", tagline: "Centered hero · 2-col services", sections: [
    { type: "nav", variant: "minimal" }, { type: "hero", variant: "centered" }, { type: "services", variant: "grid2" },
    { type: "about", variant: "panel" }, { type: "gallery", variant: "strip" }, { type: "faq", variant: "twocol" },
    { type: "cta", variant: "card" }, { type: "footer", variant: "simple" },
  ]},
  { id: "premium", name: "Premium Dark", tagline: "Card hero · row services · rich footer", sections: [
    { type: "nav", variant: "centered" }, { type: "hero", variant: "card" }, { type: "services", variant: "rows" },
    { type: "about", variant: "story" }, { type: "gallery", variant: "masonry" }, { type: "faq", variant: "accordion" },
    { type: "cta", variant: "split" }, { type: "footer", variant: "rich" },
  ]},
  { id: "wide", name: "Wide Hero", tagline: "Full-bleed hero · card services", sections: [
    { type: "nav", variant: "split" }, { type: "hero", variant: "fullbleed" }, { type: "services", variant: "cards" },
    { type: "about", variant: "panel" }, { type: "gallery", variant: "grid" }, { type: "faq", variant: "plain" },
    { type: "cta", variant: "banner" }, { type: "footer", variant: "rich" },
  ]},
  { id: "sidebar", name: "Sidebar Services", tagline: "Split hero · row services", sections: [
    { type: "nav", variant: "minimal" }, { type: "hero", variant: "split" }, { type: "services", variant: "rows" },
    { type: "about", variant: "stats" }, { type: "gallery", variant: "strip" }, { type: "faq", variant: "twocol" },
    { type: "cta", variant: "card" }, { type: "footer", variant: "simple" },
  ]},
  { id: "magazine", name: "Magazine", tagline: "Centered hero · story about · masonry", sections: [
    { type: "nav", variant: "centered" }, { type: "hero", variant: "centered" }, { type: "services", variant: "grid2" },
    { type: "about", variant: "story" }, { type: "gallery", variant: "masonry" }, { type: "faq", variant: "plain" },
    { type: "cta", variant: "split" }, { type: "footer", variant: "rich" },
  ]},
  { id: "studio", name: "Studio Grid", tagline: "Card hero · 3-col services · accordion FAQ", sections: [
    { type: "nav", variant: "split" }, { type: "hero", variant: "card" }, { type: "services", variant: "grid3" },
    { type: "about", variant: "panel" }, { type: "gallery", variant: "grid" }, { type: "faq", variant: "accordion" },
    { type: "cta", variant: "banner" }, { type: "footer", variant: "simple" },
  ]},
  { id: "compact", name: "Compact Local", tagline: "Split hero · 2-col services", sections: [
    { type: "nav", variant: "minimal" }, { type: "hero", variant: "split" }, { type: "services", variant: "grid2" },
    { type: "about", variant: "stats" }, { type: "gallery", variant: "strip" }, { type: "faq", variant: "twocol" },
    { type: "cta", variant: "card" }, { type: "footer", variant: "simple" },
  ]},
  { id: "editorial", name: "Editorial", tagline: "Full-bleed hero · story about · accordion", sections: [
    { type: "nav", variant: "centered" }, { type: "hero", variant: "fullbleed" }, { type: "services", variant: "rows" },
    { type: "about", variant: "story" }, { type: "gallery", variant: "masonry" }, { type: "faq", variant: "accordion" },
    { type: "cta", variant: "split" }, { type: "footer", variant: "rich" },
  ]},
  { id: "modern", name: "Modern Bold", tagline: "Centered hero · card services · rich footer", sections: [
    { type: "nav", variant: "split" }, { type: "hero", variant: "centered" }, { type: "services", variant: "cards" },
    { type: "about", variant: "panel" }, { type: "gallery", variant: "grid" }, { type: "faq", variant: "plain" },
    { type: "cta", variant: "banner" }, { type: "footer", variant: "rich" },
  ]},
];