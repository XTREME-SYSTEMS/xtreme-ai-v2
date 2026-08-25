import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// Seeds the Template Library + Prompt Library with ultra-high-quality defaults.
// Idempotent: skips records that already exist by name. Admin-only.

const TEMPLATES = [
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