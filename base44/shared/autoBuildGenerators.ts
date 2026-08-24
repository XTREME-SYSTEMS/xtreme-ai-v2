// ============================================================
// autoBuildGenerators.ts — shared generation logic
// ------------------------------------------------------------
// Extracted from the client-portal backend functions
// (recommendBusinessNames, generateContentTemplates,
// generateWebsiteContent, generateSocialMediaPack,
// generateVideoPack) + the frontend logo/brand prompts
// (designPrompts.js) so the Auto Builder uses the EXACT same
// generation logic as the client portal — one source of truth.
// ============================================================

import { compileBrief, briefText, photoStyleSuffix } from "./generatorBrief.ts";
import { researchBusinessNamesDeep } from "./businessNameResearcher.ts";

// ── Names (from recommendBusinessNames) ─────────────────────────────────
// Now uses the deep research pipeline (businessNameResearcher.ts) which
// combines AI generation, Browserbase Google scraping, OpenCorporates US
// state registry checks, RDAP domain verification, and AI re-scoring.
// Only returns names with 100% confirmed available .com domains.

export async function generateNamesWithResearch(base44: any, params: Record<string, any>) {
  return researchBusinessNamesDeep(base44, params);
}

// ── Legacy name generation (kept for backward compat, replaced by deep research above) ───

function getRdapUrl(domain: string): string {
  const tld = domain.split(".").pop();
  if (tld === "com") return `https://rdap.verisign.com/com/v1/domain/${domain}`;
  if (tld === "org") return `https://rdap.publicinterestregistry.org/rdap/domain/${domain}`;
  if (tld === "net") return `https://rdap.verisign.net/net/v1/domain/${domain}`;
  return `https://rdap.org/domain/${domain}`;
}

async function checkDomain(domain: string) {
  try {
    const response = await fetch(getRdapUrl(domain), {
      method: "GET",
      headers: { Accept: "application/rdap+json" },
      redirect: "follow",
    });
    if (response.status === 404) return { domain, available: true, status: "AVAILABLE" };
    if (response.status >= 200 && response.status < 400) return { domain, available: false, status: "REGISTERED" };
    return { domain, available: null, status: "UNKNOWN" };
  } catch {
    return { domain, available: null, status: "UNKNOWN" };
  }
}

export async function generateNames(base44: any, params: Record<string, any>) {
  // Delegate to the deep research pipeline — Browserbase + OpenCorporates + RDAP + AI re-scoring.
  const result = await researchBusinessNamesDeep(base44, params);
  return result.suggestions;
}

// ── Legacy implementation (unused — kept for reference) ──────────────────
async function _legacyGenerateNames(base44: any, params: Record<string, any>) {
  const { industry, location, keywords, businessType, businessName } = params;
  const prompt = `You are an expert brand strategist and domain investor. Generate 10 highly successful, potentially VIRAL business name suggestions for a ${businessType || "local service business"} in the "${industry}" industry${location ? ` serving ${location}` : ""}${keywords ? ` with these keywords/themes: ${keywords}` : ""}${businessName ? `. The current business name is "${businessName}" — use it as inspiration but generate alternatives too.` : ""}.

For EACH name, use your web search to:
1. Search Google for "[name] [industry] [location]" to see if a business with this exact name already exists
2. Search for "[name] business registration [state]" to check state business registries
3. Check if the .com domain is likely available

Score each name on THREE 0-100 scales:
- viral_score: memorability, brandability, emotional resonance, uniqueness, shareability
- local_seo_score: how well the name+domain supports ranking for "[industry] near [location]" / "[industry] [location]"
- searchability_score: how easily a potential customer searching Google or speaking to an AI assistant would find and recall this business

Also write customer_findability_notes: 1-2 sentences on how easy it will be for local customers to discover this name in search and AI answers.

Return JSON with this structure:
{
  "suggestions": [
    {
      "name": "Business Name",
      "domain": "businessname.com",
      "tagline": "short catchy tagline",
      "viral_score": 85,
      "local_seo_score": 80,
      "searchability_score": 78,
      "customer_findability_notes": "how easily local customers will find this name",
      "state_registry_status": "likely_available",
      "google_search_status": "unique",
      "rationale": "why this name could become viral and highly successful",
      "target_audience": "who this name appeals to"
    }
  ]
}

Guidelines: Short (1-3 words), memorable, easy to spell. Evokes trust, speed, quality, or proximity. Has viral potential. The .com domain should be short and brandable (no hyphens). Avoid trademarked names. Consider names with location hints or "near me" phrasing. Prioritize premium-sounding names. Each name must be distinct.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              domain: { type: "string" },
              tagline: { type: "string" },
              viral_score: { type: "number" },
              local_seo_score: { type: "number" },
              searchability_score: { type: "number" },
              customer_findability_notes: { type: "string" },
              state_registry_status: { type: "string" },
              google_search_status: { type: "string" },
              rationale: { type: "string" },
              target_audience: { type: "string" },
            },
          },
        },
      },
    },
  });

  const suggestions: any[] = result?.suggestions || [];
  const domains = suggestions.map((s: any) => s.domain).filter((d: string) => d);
  const availabilityMap: Record<string, string> = {};
  for (let i = 0; i < domains.length; i += 8) {
    const batch = domains.slice(i, i + 8);
    const results = await Promise.all(batch.map(checkDomain));
    for (const r of results) availabilityMap[r.domain] = r.status;
  }
  return suggestions
    .map((s: any) => ({
      ...s,
      domain_status: availabilityMap[s.domain] || "UNKNOWN",
      domain_available: availabilityMap[s.domain] === "AVAILABLE",
    }))
    .sort((a: any, b: any) => (b.viral_score || 0) - (a.viral_score || 0));
}

// ── Content (from generateContentTemplates) ──────────────────────────────

const cleanText = (v: any): any => {
  if (typeof v === "string") return v.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/https?:\/\/[^\s)]+/g, "").replace(/\s{2,}/g, " ").trim();
  if (Array.isArray(v)) return v.map(cleanText);
  if (v && typeof v === "object") { const o: any = {}; for (const k of Object.keys(v)) o[k] = cleanText(v[k]); return o; }
  return v;
};

export async function generateContent(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const briefBlock = briefText(brief);
  const ind = params.industry || brief.industry || "local service business";
  const loc = params.primaryLocation || brief.location || "your area";
  const site = params.website || brief.website || "";
  const fi = params.financialIntelligence;
  let finContext = "";
  if (fi) {
    const parts: string[] = [];
    if (fi.competitorPricing?.length) parts.push(`Competitor pricing: ${fi.competitorPricing.map((c: any) => `${c.name}: ${c.price || c.range || "N/A"}`).join("; ")}`);
    if (fi.averagePrice) parts.push(`Average market price: ${fi.averagePrice}`);
    if (fi.marketInsights) parts.push(`Market insights: ${fi.marketInsights}`);
    if (fi.recommendedPricing) parts.push(`Recommended pricing strategy: ${fi.recommendedPricing}`);
    if (parts.length) finContext = `\n\nFINANCIAL INTELLIGENCE:\n${parts.join("\n")}`;
  }

  const prompt = `You are a senior brand strategist and viral-marketing copywriter for local service businesses. A client needs website messaging for their ${ind} business.

CLIENT BRIEF:
${briefBlock}
EXISTING WEBSITE: ${site || "none"}${finContext}

STEP 1 — Research the market. Use real web data about ${loc}: the local ${ind} competition, typical pricing, what customers there care about, and what messaging the top competitors use. Note 3-5 key findings.

STEP 2 — Create exactly 10 DISTINCT content/tone templates. Each must be a genuinely different voice/approach (not just reworded) — e.g. direct/benefit-driven, local-proud, premium/luxury, urgent/problem-solver, story-driven, data-driven, contrarian, community-focused, aspirational, humorous. Each template includes a hero headline, hero subhead, a 2-sentence about summary, and a CTA — all in that tone. Make them specific to the ${ind} industry and ${loc} area.

STEP 3 — Score each template's VIRAL POTENTIAL (0-100) and its CONVERSION POTENTIAL (0-100).

STEP 4 — Recommend the SINGLE BEST template — the one most likely to go viral AND convert best for this specific business + market. Give a factual reason and an estimated outcome.

Return JSON:
{
  marketFindings: string,
  templates: [ { id, name, tone, heroHeadline, heroSubhead, aboutSummary, cta, whyRecommended, estimatedOutcome, viralScore, conversionScore } ] (exactly 10 items),
  recommendedIndex: number,
  recommendationReason: string
}`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: "gemini_3_1_pro",
    response_json_schema: {
      type: "object",
      properties: {
        marketFindings: { type: "string" },
        templates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              tone: { type: "string" },
              heroHeadline: { type: "string" },
              heroSubhead: { type: "string" },
              aboutSummary: { type: "string" },
              cta: { type: "string" },
              whyRecommended: { type: "string" },
              estimatedOutcome: { type: "string" },
              viralScore: { type: "number" },
              conversionScore: { type: "number" },
            },
          },
        },
        recommendedIndex: { type: "number" },
        recommendationReason: { type: "string" },
      },
    },
  });

  let result = cleanText(res);
  if (result && Array.isArray(result.templates)) {
    result.templates = result.templates.slice(0, 10).map((t: any, i: number) => ({
      id: t.id || `tpl-${String(i + 1).padStart(2, "0")}`,
      name: t.name || `Tone ${i + 1}`,
      tone: t.tone || "",
      heroHeadline: t.heroHeadline || "",
      heroSubhead: t.heroSubhead || "",
      aboutSummary: t.aboutSummary || "",
      cta: t.cta || "",
      whyRecommended: t.whyRecommended || "",
      estimatedOutcome: t.estimatedOutcome || "",
      viralScore: typeof t.viralScore === "number" ? t.viralScore : 0,
      conversionScore: typeof t.conversionScore === "number" ? t.conversionScore : 0,
    }));
    if (typeof result.recommendedIndex !== "number" || result.recommendedIndex < 0 || result.recommendedIndex >= result.templates.length) {
      let best = 0, bestScore = -1;
      result.templates.forEach((t: any, i: number) => {
        const score = (t.viralScore || 0) + (t.conversionScore || 0);
        if (score > bestScore) { bestScore = score; best = i; }
      });
      result.recommendedIndex = best;
    }
  }
  return result;
}

// ── Website (from generateWebsiteContent) ────────────────────────────────

export async function generateWebsite(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const briefBlock = briefText(brief);
  const ind = params.industry || brief.industry || "local service business";
  const loc = [params.city, params.state].filter(Boolean).join(", ").trim() || (params.serviceArea || brief.location || "your area");
  const fi = params.financialIntelligence;
  let finContext = "";
  if (fi) {
    const parts: string[] = [];
    if (fi.competitorPricing?.length) parts.push(`Competitor pricing: ${fi.competitorPricing.map((c: any) => `${c.name}: ${c.price || c.range || "N/A"}`).join("; ")}`);
    if (fi.averagePrice) parts.push(`Average market price: ${fi.averagePrice}`);
    if (fi.marketInsights) parts.push(`Market insights: ${fi.marketInsights}`);
    if (parts.length) finContext = `\n\nFINANCIAL INTELLIGENCE:\n${parts.join("\n")}`;
  }

  const prompt = `You are writing the website copy for a local ${ind} business. Make it specific, high-converting, and locally relevant — no generic filler.

CLIENT BRIEF:
${briefBlock}${finContext}

INSTRUCTIONS:
- Weave the client's DIFFERENTIATORS and SIGNATURE WORK into the hero and about sections.
- Address the CUSTOMER PAIN POINTS directly in the FAQ and service descriptions.
- Match the BRAND PERSONALITY in every line of copy.
- Reference the real ${loc} area so it feels native.

Using real, current information about ${loc}, write website copy that feels native to ${loc}. Reference the actual area and local trust signals where natural. Make all copy specific to the ${ind} industry.

Return JSON with exactly these fields:
- heroHeadline, heroSubhead, aboutTitle, aboutBody
- services: array of 5-7 { title, description }
- faq: array of 6-8 { question, answer }
- localArea, cta, metaTitle (<=60 chars), metaDescription (<=160 chars)`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: "gemini_3_1_pro",
    response_json_schema: {
      type: "object",
      properties: {
        heroHeadline: { type: "string" },
        heroSubhead: { type: "string" },
        aboutTitle: { type: "string" },
        aboutBody: { type: "string" },
        services: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } } },
        faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
        localArea: { type: "string" },
        cta: { type: "string" },
        metaTitle: { type: "string" },
        metaDescription: { type: "string" },
      },
    },
  });
  return cleanText(res);
}

// ── Social (from generateSocialMediaPack) ────────────────────────────────

export async function generateSocial(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const briefBlock = briefText(brief);
  const photo = photoStyleSuffix(brief);
  const biz = params.businessName || brief.businessName;
  const ind = params.industry || brief.industry || "local service business";
  const loc = params.primaryLocation || brief.location || "";
  const svc = (brief.services || []).join(", ") || "professional services";
  const ref = params.logoUrl ? [params.logoUrl] : undefined;

  const TEMPLATES = [
    { id: "profile", label: "Profile Avatar", prompt: `A professional social media profile avatar for ${ind} "${biz}". Clean circular logo on a solid brand-colored background, centered, minimal, high quality.` },
    { id: "cover", label: "Cover / Header", prompt: `A wide social media cover banner for ${ind} "${biz}". Show a professional ${ind} work setting with the business name overlaid, modern layout, professional.` },
    { id: "story", label: "Story Template", prompt: `A vertical Instagram story template for ${ind} "${biz}". Before-and-after transformation, bold text space, brand colors.` },
    { id: "post1", label: "Service Post", prompt: `A square Instagram post for ${ind} "${biz}" showcasing ${svc.split(",")[0]}. Professional work photo with a clean text overlay area.` },
    { id: "post2", label: "Before/After Post", prompt: `A square social media post for ${ind} "${biz}" showing a before-and-after transformation, split layout, professional.` },
    { id: "post3", label: "Team Post", prompt: `A square social media post for ${ind} "${biz}" showing a professional at work, professional, brand colors.` },
    { id: "favicon", label: "Favicon", prompt: `A simple favicon icon for ${ind} "${biz}". A single bold mark representing the industry, minimal, recognizable at small size, on a solid background.` },
    { id: "iconset", label: "Icon Set", prompt: `A set of 6 minimal line icons for ${ind} "${biz}" services. Clean, consistent style, on white.` },
    { id: "highlight", label: "Highlight Cover", prompt: `A circular Instagram highlight cover for ${ind} "${biz}". A minimal industry icon on a solid brand color, clean, consistent.` },
    { id: "promo", label: "Promo Post", prompt: `A square promotional social media post for ${ind} "${biz}". "Free Quote" offer, bold design, professional background, clear call-to-action.` },
  ];

  const imgResults = await Promise.allSettled(
    TEMPLATES.map(async (t) => {
      const r = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: `${t.prompt}${loc ? ` Located in ${loc}.` : ""} ${photo}`,
        existing_image_urls: ref,
      });
      return { id: t.id, label: t.label, url: r.url };
    })
  );
  const templates = imgResults.map((r) => r.value).filter(Boolean);

  const calRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Create a 30-day social media content calendar for ${ind} "${biz}" in ${loc}.

CLIENT BRIEF:
${briefBlock}

Services: ${svc}. Mix post types: before/after, tips, testimonials, behind-the-scenes, promotions, educational. Make every caption specific to the ${ind} industry and weave in the client's DIFFERENTIATORS, SIGNATURE WORK, and BRAND PERSONALITY. Address the CUSTOMER PAIN POINTS in educational/tips posts. Return exactly 30 posts, one per day, each with a day number (1-30), platform (Instagram, Facebook, or Google Business), a caption (2-3 sentences with hashtags), and a post type category.`,
    model: "claude_opus_4_8",
    response_json_schema: {
      type: "object",
      properties: {
        posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "number" },
              platform: { type: "string" },
              caption: { type: "string" },
              type: { type: "string" },
              bestTime: { type: "string" },
            },
          },
        },
      },
    },
  });

  return { templates, posts: calRes?.posts || [], scheduleSummary: `30 days of content across Instagram, Facebook & Google Business.` };
}

// ── Video (from generateVideoPack) ───────────────────────────────────────

export async function generateVideo(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const briefBlock = briefText(brief);
  const photo = photoStyleSuffix(brief);
  const biz = params.businessName || brief.businessName;
  const ind = params.industry || brief.industry || "local service business";
  const loc = params.primaryLocation || brief.location || "";
  const svc = (brief.services || []).join(", ") || "professional services";
  const tone = params.contentTone || "professional and trustworthy";
  const ref = params.logoUrl ? [params.logoUrl] : undefined;

  const CONCEPTS = [
    { id: "hero", title: "Brand Hero Video", desc: `A cinematic hero showing your best ${ind} work with your logo.`, prompt: `Cinematic hero video thumbnail for ${ind} "${biz}". Slow pan over professional work, dramatic lighting, professional, high-end.` },
    { id: "before-after", title: "Before & After", desc: `A satisfying before-and-after ${ind} transformation.`, prompt: `Before and after ${ind} transformation, split screen, professional photo, dramatic improvement.` },
    { id: "process", title: "The Process", desc: `Fast-paced time-lapse of a ${ind} project from start to finish.`, prompt: `Time-lapse of ${ind} work process: prep, execution, finishing. Professional at work.` },
    { id: "testimonial", title: "Customer Story", desc: `A happy customer reacts to their new ${ind} project.`, prompt: `A homeowner smiling and showing off their new ${ind} project, professional, warm lighting.` },
    { id: "commercial", title: "Commercial Project", desc: `A large commercial ${ind} project in progress.`, prompt: `A large commercial ${ind} project, wide angle, professional, industrial.` },
    { id: "tips", title: "3 Quick Tips", desc: `Educational short: 3 things to know before hiring a ${ind}.`, prompt: `A ${ind} professional pointing at finished work with text overlay space, educational, professional.` },
    { id: "showcase", title: "Quality Showcase", desc: `A close-up showcase of the quality and detail of your ${ind} work.`, prompt: `Close-up showcase of professional ${ind} work quality, detailed, professional lighting.` },
    { id: "specialty", title: "Specialty Service", desc: `A specialty ${ind} service being performed.`, prompt: `A specialty ${ind} service being performed, professional, focused, brand colors.` },
    { id: "team", title: "Meet the Team", desc: `Your crew introduces the business and what makes you different.`, prompt: `A team of ${ind} professionals standing in front of a completed project, professional, confident, brand colors.` },
    { id: "promo", title: "Free Quote Promo", desc: `A punchy promotional video offering a free quote.`, prompt: `A promotional video thumbnail for ${ind} "${biz}" offering a free quote, bold text space, professional background.` },
  ];

  const imgResults = await Promise.allSettled(
    CONCEPTS.map(async (c) => {
      const r = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: `${c.prompt}${loc ? ` Located in ${loc}.` : ""} ${photo}`,
        existing_image_urls: ref,
      });
      return { id: c.id, title: c.title, description: c.desc, thumbnailUrl: r.url };
    })
  );
  const concepts = imgResults.map((r) => r.value).filter(Boolean);

  const scriptRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Write a compelling video script for each of these 10 video concepts for ${ind} "${biz}" in ${loc}.

CLIENT BRIEF:
${briefBlock}

Services: ${svc}. Tone: ${tone}. Make every script specific to the ${ind} industry. Weave in the client's DIFFERENTIATORS and SIGNATURE WORK. Speak directly to the CUSTOMER PAIN POINTS. Match the BRAND PERSONALITY. Each script should be punchy, 15-30 seconds spoken, with a clear hook in the first 3 seconds and a strong call-to-action at the end. Return one script per concept id.

Concepts: ${JSON.stringify(concepts.map((c) => ({ id: c.id, title: c.title, description: c.description })))}`,
    model: "claude_opus_4_8",
    response_json_schema: {
      type: "object",
      properties: {
        scripts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              script: { type: "string" },
              videoPrompt: { type: "string" },
            },
          },
        },
      },
    },
  });

  const scripts = scriptRes?.scripts || [];
  return concepts.map((c) => {
    const s = scripts.find((x: any) => x.id === c.id) || {};
    return { ...c, script: s.script || "", videoPrompt: s.videoPrompt || c.prompt || "" };
  });
}

// ── Logo (matching designPrompts.js LOGO_STYLES) ─────────────────────────

function industryLabel(industry: string, subIndustry?: string): string {
  if (!industry) return "epoxy floor contractor";
  return subIndustry ? `${industry} (${subIndustry})` : industry;
}

function industryVisuals(industry: string) {
  const ind = (industry || "").toLowerCase();
  if (ind.includes("epoxy") || ind.includes("floor") || ind.includes("concrete")) return { material: "polished concrete", texture: "glossy floor surface", setting: "garage or commercial floor" };
  if (ind.includes("hvac") || ind.includes("air") || ind.includes("heating") || ind.includes("cooling")) return { material: "metal ductwork", texture: "clean metallic finish", setting: "modern HVAC installation" };
  if (ind.includes("plumb")) return { material: "chrome fixtures", texture: "clean pipe work", setting: "modern bathroom or kitchen" };
  if (ind.includes("roof")) return { material: "roofing shingles", texture: "textured roof surface", setting: "residential rooftop" };
  if (ind.includes("electric")) return { material: "electrical components", texture: "clean wiring", setting: "modern electrical panel" };
  if (ind.includes("dental") || ind.includes("medical") || ind.includes("health")) return { material: "clean modern surfaces", texture: "pristine clinical finish", setting: "modern medical office" };
  if (ind.includes("landscap") || ind.includes("lawn") || ind.includes("garden")) return { material: "natural stone and plants", texture: "lush greenery", setting: "beautiful outdoor landscape" };
  if (ind.includes("clean") || ind.includes("janitor")) return { material: "clean surfaces", texture: "spotless finish", setting: "pristine interior space" };
  if (ind.includes("paint")) return { material: "paint rollers and brushes", texture: "smooth painted surface", setting: "freshly painted room" };
  return { material: "professional tools", texture: "clean professional finish", setting: "professional work environment" };
}

const LOGO_STYLES = [
  { id: "monogram", label: "Minimalist Monogram", prompt: (n: string, ind: string) => `A clean minimalist logo for ${industryLabel(ind)} named "${n}". A bold monogram built from the initials, simple geometric lines, a single lime-green accent. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, flat vector style, no extra text, no border, no card.` },
  { id: "industrial", label: "Bold Industrial", prompt: (n: string, ind: string) => `A bold industrial logo badge for ${industryLabel(ind)} named "${n}". Hexagonal or shield emblem, ${industryVisuals(ind).texture}, dark charcoal and orange, strong geometric type. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "geometric", label: "Geometric Abstract", prompt: (n: string, ind: string) => `A modern abstract geometric logo for ${industryLabel(ind)} "${n}". Overlapping shapes forming a subtle industry-relevant mark, two-tone with lime-green accent. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "emblem", label: "Classic Emblem", prompt: (n: string, ind: string) => `A classic circular emblem logo for ${industryLabel(ind)} "${n}". Ring with the business name, an industry-relevant icon in the center, navy and silver. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "wordmark", label: "Modern Wordmark", prompt: (n: string, ind: string) => `A modern wordmark logo for ${industryLabel(ind)} "${n}". The business name in a strong condensed sans-serif, a single lime-green underline accent. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "stamp", label: "Embossed Seal", prompt: (n: string, ind: string) => `A logo for ${industryLabel(ind)} "${n}" styled as an embossed seal. The business name embossed in a ${industryVisuals(ind).material} surface, monochrome with lime-green tint. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, photoreal, no extra text, no border, no card.` },
  { id: "neon", label: "Neon Glow", prompt: (n: string, ind: string) => `A neon-glow logo for ${industryLabel(ind)} "${n}". The business name in glowing lime-green neon tube lettering. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, no extra text, no border, no card.` },
  { id: "rustic", label: "Hand-drawn Rustic", prompt: (n: string, ind: string) => `A hand-drawn rustic logo for ${industryLabel(ind)} "${n}". Sketched industry tools and icon with the business name, warm earthy tones with lime-green accent. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, illustration style, no extra text, no border, no card.` },
  { id: "luxury", label: "Premium Luxury", prompt: (n: string, ind: string) => `A premium luxury logo for ${industryLabel(ind)} "${n}". The business name in an elegant serif, gold foil accent line, black and gold. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "gradient", label: "Vibrant Gradient", prompt: (n: string, ind: string) => `A vibrant gradient logo for ${industryLabel(ind)} "${n}". The business name with a blue-to-lime gradient fill, fluid modern shape behind it. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
];

async function generateTransparentLogo(base44: any, prompt: string): Promise<string> {
  const r1 = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
  let url = r1?.url;
  if (!url) throw new Error("logo generation failed");
  try {
    const r2 = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: "Remove the ENTIRE background from this logo image so only the logo artwork remains. Output as a PNG with a true transparent alpha channel. Preserve exact colors, shapes, and text. No border, card, shadow, or backdrop.",
      existing_image_urls: [url],
    });
    if (r2?.url) url = r2.url;
  } catch { /* keep original */ }
  return url;
}

export async function generateLogos(base44: any, params: Record<string, any>) {
  const name = params.businessName || "your business";
  const industry = params.industry || "";
  const results = await Promise.allSettled(
    LOGO_STYLES.map(async (s) => {
      const url = await generateTransparentLogo(base44, s.prompt(name, industry));
      return { id: s.id, label: s.label, url };
    })
  );
  const logos = results.map((r) => r.value).filter(Boolean);
  if (logos.length === 0) throw new Error("All logo generations failed");
  return logos;
}

// ── Brand (matching designPrompts.js BRAND_TYPES) ───────────────────────

const BRAND_TYPES = [
  { id: "business-card", label: "Business Card", prompt: (n: string, ind: string) => `A realistic business card mockup for ${industryLabel(ind)} named "${n}". Front and back of the card lying flat on a ${industryVisuals(ind).material} surface, top-down studio photo, professional branding, clean layout.` },
  { id: "tri-fold", label: "Tri-fold Brochure", prompt: (n: string, ind: string) => `A realistic open tri-fold brochure mockup for ${industryLabel(ind)} "${n}". Professional marketing brochure, industry-appropriate design with service photos, studio lighting.` },
  { id: "flyer", label: "Digital Flyer", prompt: (n: string, ind: string) => `A digital marketing flyer mockup for ${industryLabel(ind)} "${n}". A promotional one-pager displayed on a tablet, modern layout with a service photo and call-to-action, clean studio shot.` },
  { id: "tshirt", label: "T-Shirt", prompt: (n: string, ind: string) => `A premium black t-shirt mockup for ${industryLabel(ind)} "${n}" with the company logo printed on the chest. Flat-lay on a professional surface, professional apparel mockup, studio lighting.` },
  { id: "hat", label: "Hat / Cap", prompt: (n: string, ind: string) => `A baseball cap mockup for ${industryLabel(ind)} "${n}" with the logo embroidered on the front. Side-angle studio product photo, clean background, professional headwear mockup.` },
  { id: "app", label: "Mobile App", prompt: (n: string, ind: string) => `A smartphone mockup showing the home screen of a mobile app for ${industryLabel(ind)} "${n}". Modern app UI with a book-a-quote button, held in a hand, clean studio shot.` },
  { id: "van", label: "Vehicle Wrap", prompt: (n: string, ind: string) => `A white service vehicle with a full professional vehicle wrap branding for ${industryLabel(ind)} "${n}". Parked at a jobsite, clean fleet branding with the logo and phone number, daytime photo.` },
  { id: "signage", label: "Storefront Sign", prompt: (n: string, ind: string) => `An exterior storefront channel-letter sign for ${industryLabel(ind)} "${n}" mounted on a modern building facade, lit at dusk, professional signage mockup.` },
  { id: "social", label: "Social Media Kit", prompt: (n: string, ind: string) => `A social media brand kit mockup for ${industryLabel(ind)} "${n}". An Instagram post and story template shown on a phone, grid layout, consistent branding, clean studio shot.` },
  { id: "polo", label: "Branded Uniform", prompt: (n: string, ind: string) => `A branded polo shirt uniform mockup for ${industryLabel(ind)} "${n}" with the logo on the chest, worn by a professional in a ${industryVisuals(ind).setting}, professional workwear photo.` },
];

export async function generateBrandPacks(base44: any, params: Record<string, any>) {
  const name = params.businessName || "your business";
  const industry = params.industry || "";
  const logoUrl = params.logoUrl || "";
  const results = await Promise.allSettled(
    BRAND_TYPES.map(async (m) => {
      const prompt = logoUrl
        ? `Apply this logo to a ${m.label.toLowerCase()} for ${industryLabel(industry)} "${name}". ${m.prompt(name, industry)} Use the provided logo.`
        : m.prompt(name, industry);
      const existing = logoUrl ? [logoUrl] : undefined;
      const r = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt,
        ...(existing ? { existing_image_urls: existing } : {}),
      });
      return { id: m.id, label: m.label, url: r?.url };
    })
  );
  const packs = results.map((r) => r.value).filter(Boolean);
  if (packs.length === 0) throw new Error("All brand mockup generations failed");
  return packs;
}