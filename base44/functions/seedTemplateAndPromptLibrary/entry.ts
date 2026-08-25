import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// Seeds the Template Library + Prompt Library with ultra-high-quality defaults.
// Idempotent: skips records that already exist by name. Admin-only.

const TEMPLATES = [
  {
    name: "Premium Local Service — Editorial",
    niche: "general",
    industry_category: "local-services",
    layout_style: "Editorial, high-contrast, generous whitespace, full-bleed hero, asymmetric grid, sticky conversion bar.",
    sections: [
      { name: "Hero", purpose: "Capture attention + primary CTA", guidance: "Full-bleed cinematic image, 10-word benefit headline, trust badges, single primary CTA." },
      { name: "Services", purpose: "Surface offerings", guidance: "3-6 cards with benefit-led titles, hover micro-interaction, icon per service." },
      { name: "Proof", purpose: "Build trust", guidance: "Star rating + review count, 2-3 testimonials, before/after gallery if applicable." },
      { name: "About", purpose: "Humanize + authority", guidance: "Founder story, credentials, local ties, supporting image." },
      { name: "FAQ", purpose: "SEO + AEO + objection handling", guidance: "6 Q&As as open indexable text, self-contained answers." },
      { name: "CTA", purpose: "Final conversion", guidance: "Sticky bar + bottom band, phone + form, urgency without hype." }
    ],
    design_direction: {
      colors: "Dark base #0A0A0A, neon lime #D4FF4D accent, white text, 10% accent usage ratio.",
      typography: "Display: geometric sans (Inter/Söhne). Body: humanist sans. Tight display tracking, relaxed body leading.",
      spacing: "8px grid, section padding 96px desktop / 64px mobile, max-width 1200px.",
      motion: "Subtle fade-up on scroll, 200ms ease, no parallax, no autoplay video.",
      imagery: "Cinematic, medium-format, directional lighting, real-world authenticity, no stock clichés."
    },
    conversion_principles: "One CTA per section, social proof above the fold, frictionless contact, mobile-first.",
    quality_score: 97
  },
  {
    name: "Garage Floor Coating — Premium Trades",
    niche: "garage floor epoxy coating",
    industry_category: "home-improvement",
    layout_style: "Bold trades aesthetic, before/after driven, gallery-forward, trust + warranty emphasis.",
    sections: [
      { name: "Hero", purpose: "Instant credibility", guidance: "Full-bleed finished-garage image, headline on transformation, free estimate CTA, star rating." },
      { name: "Before/After", purpose: "Visual proof", guidance: "Slider or paired gallery, 4-6 transformations with location tags." },
      { name: "Systems", purpose: "Explain the product", guidance: "Polyaspartic vs epoxy, flake vs metallic, lifetime warranty badge." },
      { name: "Process", purpose: "Reduce uncertainty", guidance: "4-step: quote → prep → coat → cure, timeline per step." },
      { name: "FAQ", purpose: "SEO/AEO + objections", guidance: "Cost, durability, cure time, warranty — self-contained cite-ready answers." },
      { name: "CTA", purpose: "Convert", guidance: "Free quote form + click-to-call, service area list." }
    ],
    design_direction: {
      colors: "Charcoal #111815, lime #D4FF4D accent, concrete-gray neutrals.",
      typography: "Display: condensed industrial sans. Body: clean humanist sans.",
      spacing: "8px grid, gallery-forward, 80px section padding.",
      motion: "Before/after slider reveal, staggered gallery load.",
      imagery: "High-gloss finished floors, dramatic raking light, wide angles."
    },
    conversion_principles: "Visual proof first, warranty authority, transparent pricing language, one-step quote.",
    quality_score: 98
  },
  {
    name: "Roofing — Trust & Speed",
    niche: "roofing",
    industry_category: "home-improvement",
    layout_style: "Trust-forward, storm-ready urgency, certified badges, inspection-first CTA.",
    sections: [
      { name: "Hero", purpose: "Storm/season hook", guidance: "Aerial roof image, 'Free Roof Inspection' CTA, licensed + insured badges." },
      { name: "Services", purpose: "Residential + commercial", guidance: "Replacement, repair, inspection, storm damage — card grid." },
      { name: "Proof", purpose: "Insurance + credentials", guidance: "GAF Certified, insurance claim help, reviews." },
      { name: "Process", purpose: "Inspection → estimate → install", guidance: "3-step with timeline." },
      { name: "FAQ", purpose: "Cost + insurance + lifespan", guidance: "Self-contained answers for AI citation." },
      { name: "CTA", purpose: "Book inspection", guidance: "Form + call, same-day response promise." }
    ],
    design_direction: {
      colors: "Slate #1A1F2E, safety-orange or lime accent, white text.",
      typography: "Display: strong geometric. Body: readable humanist.",
      spacing: "8px grid, badge-forward, 80px sections.",
      motion: "Subtle, trust-focused, no aggressive animation.",
      imagery: "Aerial roof shots, install crews, weather drama."
    },
    conversion_principles: "Licensed/insured above fold, inspection-first, insurance claim guidance.",
    quality_score: 96
  },
  {
    name: "HVAC — Comfort & Reliability",
    niche: "hvac",
    industry_category: "home-services",
    layout_style: "Comfort-driven, seasonal urgency, 24/7 availability, financing forward.",
    sections: [
      { name: "Hero", purpose: "Seasonal CTA", guidance: "AC/furnace image, 'Same-Day Service' CTA, 24/7 badge." },
      { name: "Services", purpose: "Install/repair/maintenance", guidance: "Cards with financing badges." },
      { name: "Why Us", purpose: "Trust", guidance: "NATE-certified, upfront pricing, maintenance plan." },
      { name: "FAQ", purpose: "Cost + lifespan + efficiency", guidance: "Cite-ready answers." },
      { name: "CTA", purpose: "Book service", guidance: "Form + call, financing mention." }
    ],
    design_direction: {
      colors: "Cool blue-gray base, lime or cyan accent, white text.",
      typography: "Display: friendly geometric. Body: humanist.",
      spacing: "8px grid, comfort-forward, 80px sections.",
      motion: "Calm, no urgency flashing.",
      imagery: "Clean install shots, technician + homeowner, comfort scenes."
    },
    conversion_principles: "Same-day promise, upfront pricing, financing, 24/7.",
    quality_score: 95
  },
  {
    name: "Dental Practice — Premium Care",
    niche: "dentist",
    industry_category: "healthcare",
    layout_style: "Calm, premium, patient-centered, booking-first, smile-forward.",
    sections: [
      { name: "Hero", purpose: "Book appointment", guidance: "Smile image, 'Book Your Visit' CTA, accept-new-patients badge." },
      { name: "Services", purpose: "General + cosmetic", guidance: "Cards: cleaning, whitening, implants, aligners." },
      { name: "About", purpose: "Dentist authority", guidance: "Credentials, technology, comfort-first promise." },
      { name: "Reviews", purpose: "Social proof", guidance: "5-star testimonials, Google rating." },
      { name: "FAQ", purpose: "Insurance + comfort + cost", guidance: "Cite-ready answers." },
      { name: "CTA", purpose: "Book", guidance: "Online scheduling + call." }
    ],
    design_direction: {
      colors: "Soft white base, teal/lime accent, calming neutrals.",
      typography: "Display: elegant humanist serif or refined sans. Body: humanist sans.",
      spacing: "Generous, airy, 96px sections.",
      motion: "Gentle fades, premium feel.",
      imagery: "Bright smiles, modern operatory, happy patients."
    },
    conversion_principles: "Booking above fold, new-patient offer, insurance transparency, comfort language.",
    quality_score: 96
  },
  {
    name: "Law Firm — Authority & Trust",
    niche: "attorney",
    industry_category: "professional-services",
    layout_style: "Authoritative, restrained, results-driven, consultation-first.",
    sections: [
      { name: "Hero", purpose: "Free consultation", guidance: "Courthouse/office image, 'Free Consultation' CTA, results figure." },
      { name: "Practice Areas", purpose: "Specialties", guidance: "Cards: personal injury, family, criminal, business." },
      { name: "Results", purpose: "Proof", guidance: "Verdicts/settlements, case results, bar credentials." },
      { name: "Attorneys", purpose: "Authority", guidance: "Partner bios with credentials." },
      { name: "FAQ", purpose: "Cost + process", guidance: "Contingency, consultation, timeline — cite-ready." },
      { name: "CTA", purpose: "Contact", guidance: "Form + call, confidential promise." }
    ],
    design_direction: {
      colors: "Deep navy/charcoal, gold or lime accent, ivory text.",
      typography: "Display: classical serif. Body: refined sans.",
      spacing: "Formal, structured, 96px sections.",
      motion: "Minimal, dignified.",
      imagery: "Office, scales, cityscape, professional portraits."
    },
    conversion_principles: "Consultation-first, results numbers, bar credentials, contingency clarity.",
    quality_score: 95
  }
];

const PROMPTS = [
  {
    name: "Ultra — Website Name Generator",
    step: "name",
    niche: "general",
    quality_tier: "ultra",
    model_hint: "claude_sonnet_4_6",
    prompt_text: `You are an elite brand strategist and naming expert with 15 years building premium DTC and local-service brands. Generate 5 exceptional, brandable, available-sounding website names for a {{niche}} business seeded as "{{business_name}}". Target audience: {{audience}}.

CRITERIA (apply ruthlessly):
1. Short — 1-2 words, ideally ≤12 characters.
2. Euphonic — easy to pronounce and spell on the first hearing.
3. Evokes trust, craftsmanship, and premium quality without cliché.
4. Distinctive enough to trademark; no generic keyword-stuffing.
5. No hyphens, no numbers, no geo-modifiers (city/state), no misspellings.

For each name include a one-line rationale. Then declare the single best name with reasoning.
Return JSON: { "names": [string×5], "best": string }.`
  },
  {
    name: "Ultra — URL / Domain Generator",
    step: "url",
    niche: "general",
    quality_tier: "ultra",
    model_hint: "claude_sonnet_4_6",
    prompt_text: `You are a domain and digital-brand strategist. Given the brand "{{website_name}}" in the "{{niche}}" niche, generate 5 premium .com domain candidates.

PRIORITIZE: exact-match brand .com first, then clean short variants. No hyphens, no numbers, ≤14 characters before .com. Also produce the recommended URL slug and a minimal site URL structure (/, /services, /about, /contact).
Return JSON: { "domains": [string×5], "best": string, "slug": string }.`
  },
  {
    name: "Ultra — Brand Identity Generator",
    step: "brand",
    niche: "general",
    quality_tier: "ultra",
    model_hint: "claude_sonnet_4_6",
    prompt_text: `You are a world-class brand director (Pentagram / Collins / Lippincott caliber). Build a complete, cohesive, premium brand identity for "{{website_name}}" — a {{niche}} business for {{audience}}. Domain: {{domain}}.

DELIVER:
- positioning: one sharp, defensible sentence.
- promise: the single benefit you stake your reputation on.
- tagline: memorable, ≤6 words, rhythm + resonance.
- colors: a sophisticated palette with exact hex values + usage ratios (base / accent / text). Premium, not loud.
- typography: a display + body pairing with rationale (name real typefaces).
- voice: 3 adjectives + a 2-sentence tone guide.
- logo_direction: a concrete design brief describing concept, geometry, mood, negative-space treatment, and scalability — detailed enough for an image generator to execute flawlessly.

TEMPLATE DESIGN DIRECTION (respect this): {{template_design}}
Return JSON with keys: positioning, promise, tagline, colors, typography, voice, logo_direction.`
  },
  {
    name: "Ultra — Logo Generator",
    step: "logo",
    niche: "general",
    quality_tier: "ultra",
    model_hint: "claude_sonnet_4_6",
    prompt_text: `{{logo_direction}}

EXECUTION: premium, timeless, geometric vector logo mark. Minimal, highly scalable, balanced negative space, works in single color and reverse. Solid dark (#0A0A0A) background. Award-winning brand-identity quality. No text effects, no gradients, no clipart, no stock icons. Centered composition.`
  },
  {
    name: "Ultra — Content Generator",
    step: "content",
    niche: "general",
    quality_tier: "ultra",
    model_hint: "claude_sonnet_4_6",
    prompt_text: `You are an elite conversion copywriter and SEO/AEO specialist (Joanna Wiege + Brian Dean caliber). Write the complete website content for "{{website_name}}", a {{niche}} business. Brand voice: {{voice}}. Brand promise: {{promise}}. Audience: {{audience}}.

PRODUCE:
1. hero_headline: ≤10 words using problem-agitation or aspirational-identity framework.
2. hero_subhead: ≤20 words, supporting + specific.
3. about: 2 short paragraphs — story + proof + local ties.
4. services: 4-6 items, each a benefit-led title + 1-2 sentence description (specific, not generic).
5. faq: 6 Q&As optimized for search AND AI answer engines — answers must be self-contained, factual, cite-ready, ≤45 words each.
6. cta: a single primary call-to-action phrase.

RULES: active voice, specificity, social proof language. No fluff, no jargon, no unverifiable superlatives.

TEMPLATE SECTION GUIDANCE: {{template_sections}}
Return JSON with keys: hero_headline, hero_subhead, about, services (array of {title, description}), faq (array of {question, answer}), cta.`
  },
  {
    name: "Ultra — Hero Image Generator",
    step: "images",
    niche: "general",
    quality_tier: "ultra",
    model_hint: "claude_sonnet_4_6",
    prompt_text: `A cinematic, editorial-quality hero image for "{{website_name}}", a {{niche}} business. {{imagery}}. Shot on a medium-format camera, dramatic directional lighting, shallow depth of field, rich natural color grade, ultra-detailed, 16:9. No text, no watermark, no logo.`
  },
  {
    name: "Ultra — SEO + AEO Generator",
    step: "seo_aeo",
    niche: "general",
    quality_tier: "ultra",
    model_hint: "claude_sonnet_4_6",
    prompt_text: `You are a senior technical SEO and Answer Engine Optimization (AEO) architect. For "{{website_name}}" ({{niche}}), domain {{domain}}, produce:

1. meta_title: ≤60 chars, primary keyword first.
2. meta_description: ≤155 chars, includes a CTA.
3. canonical: the canonical URL.
4. json_ld: a combined LocalBusiness + Service + BreadcrumbList schema object.
5. AEO pack:
   - answer_summary: a 40-60 word paragraph optimized for Perplexity / ChatGPT / Google AI Overviews — direct, factual, self-contained, cite-friendly.
   - qa_schema: a QAPage schema object.
   - citation_faq: 5 entries, each {question, answer} with a self-contained answer ≤45 words.

BASE EVERYTHING ON THIS CONTENT: {{content}}
Prioritize clarity, factual accuracy, and extractability.
Return JSON with keys: meta_title, meta_description, canonical, json_ld, answer_summary, qa_schema, citation_faq.`
  }
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    // Batch 1: Fetch ALL existing templates + prompts in 2 calls (not 26)
    const [existingTemplates, existingPrompts] = await Promise.all([
      base44.asServiceRole.entities.TemplateLibrary.list("-created_date", 100),
      base44.asServiceRole.entities.PromptLibrary.list("-created_date", 100),
    ]);
    const existingTemplateNames = new Set((existingTemplates || []).map((t: any) => t.name));
    const existingPromptKeys = new Set((existingPrompts || []).map((p: any) => `${p.name}::${p.step}`));

    // Batch 2: Filter to only new records
    const newTemplates = TEMPLATES
      .filter((t) => !existingTemplateNames.has(t.name))
      .map((t) => ({ ...t, status: "active" }));
    const newPrompts = PROMPTS
      .filter((p) => !existingPromptKeys.has(`${p.name}::${p.step}`))
      .map((p) => ({ ...p, status: "active" }));

    // Batch 3: Bulk create all new records in 2 calls
    let createdTemplates = 0, createdPrompts = 0;
    if (newTemplates.length) {
      await base44.asServiceRole.entities.TemplateLibrary.bulkCreate(newTemplates);
      createdTemplates = newTemplates.length;
    }
    if (newPrompts.length) {
      await base44.asServiceRole.entities.PromptLibrary.bulkCreate(newPrompts);
      createdPrompts = newPrompts.length;
    }

    return Response.json({
      ok: true,
      templates: { created: createdTemplates, skipped: TEMPLATES.length - createdTemplates, total: TEMPLATES.length },
      prompts: { created: createdPrompts, skipped: PROMPTS.length - createdPrompts, total: PROMPTS.length }
    });
  } catch (error) {
    console.error("[seed-library] error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}