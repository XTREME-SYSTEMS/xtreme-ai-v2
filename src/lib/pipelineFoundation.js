// Derives the strategic foundation (vision, strategy, chosen name, tagline,
// content tone, brand essence) from the client project + user record so every
// downstream generator step builds on the choices made in prior steps.
//
// Used by the client-portal generator pages to pass the foundation into their
// backend invoke calls — so content, website, social, video, logo, and brand
// all reflect the approved vision + strategy + name instead of working in
// isolation.

function truncate(s, n) {
  const t = String(s || "").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

export function deriveFoundation(project, user) {
  const profile = user?.epoxyProfile || {};
  const vision = project?.vision || null;
  const strategy = project?.strategy || null;
  const chosenName =
    profile?.businessName || project?.business_name || "";
  const tagline = profile?.tagline || project?.profile?.tagline || "";
  const contentTone = user?.chosenContentTone || "";

  // Short brand-essence clause appended to image prompts (logo/brand) so the
  // visual identity reflects the approved positioning + tagline.
  const essenceParts = [];
  if (tagline) essenceParts.push(`tagline "${tagline}"`);
  if (strategy?.differentiation)
    essenceParts.push(`positioning: ${truncate(strategy.differentiation, 120)}`);
  else if (strategy?.competitive_positioning)
    essenceParts.push(`positioning: ${truncate(strategy.competitive_positioning, 120)}`);
  if (strategy?.pricing_strategy)
    essenceParts.push(`pricing: ${truncate(strategy.pricing_strategy, 80)}`);
  const brandEssence = essenceParts.length
    ? `. Brand essence — ${essenceParts.join("; ")}.`
    : "";

  return { vision, strategy, chosenName, tagline, contentTone, brandEssence };
}