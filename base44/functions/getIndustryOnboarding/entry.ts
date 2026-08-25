import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Generates the top industry-specific onboarding questions for a user based on
// their selected industry, sub-industry, business type, and business stage.
// Uses InvokeLLM with web context to research what matters most in that
// industry, then returns structured questions the frontend renders dynamically.
// Always includes a services_offered and differentiators question so downstream
// generators (content, logo, brand, website) have the data they expect.

const FALLBACK_QUESTIONS = [
  {
    id: "services_offered",
    question: "What epoxy/concrete services do you offer? (Select all that apply)",
    type: "multi",
    options: [
      "Garage Floor Epoxy",
      "Metallic Epoxy Floors",
      "Epoxy Flake Systems",
      "Self-Leveling Epoxy",
      "Commercial Epoxy Floors",
      "Industrial Epoxy Coatings",
      "Polished Concrete",
      "Grind & Seal",
      "Stamped Concrete",
      "Concrete Overlays",
      "Stained Concrete",
      "Decorative Concrete",
      "Concrete Resurfacing",
      "Basement Epoxy",
    ],
    why: "Powers your service pages, SEO, and the images we generate for each epoxy/concrete service.",
  },
  {
    id: "differentiators",
    question: "What makes you different from other epoxy/concrete contractors? (Select all that apply)",
    type: "multi",
    options: [
      "Licensed & insured",
      "Free estimates",
      "Same-day install",
      "10+ year warranty",
      "BBB accredited",
      "Manufacturer-certified installer",
      "Commercial & industrial experience",
      "Family-owned & operated",
      "5-star rated",
      "No-peel guarantee",
    ],
    why: "Powers your About section, trust signals, and the headlines we write.",
  },
  {
    id: "signature_project",
    question: "What's your most impressive or flagship type of epoxy/concrete project? (Select all that apply)",
    type: "multi",
    options: [
      "Garage floor transformations",
      "Metallic epoxy showrooms",
      "Commercial warehouse floors",
      "Industrial facility coatings",
      "Polished concrete retail spaces",
      "Decorative stamped patios",
      "Residential basement floors",
      "Restaurant/retail polished concrete",
    ],
    why: "We feature this work in your hero images and video — it's what wins you epoxy/concrete jobs.",
  },
  {
    id: "visual_style",
    question: "What visual style feels most like your epoxy/concrete brand? (Select all that apply)",
    type: "multi",
    options: ["Modern & clean", "Premium / luxury", "Bold & industrial", "Minimalist", "Vibrant & energetic", "Rustic & warm"],
    why: "Drives the look of every image, logo, and video we generate for your epoxy/concrete business.",
  },
  {
    id: "brand_personality",
    question: "How should your brand sound to epoxy/concrete customers? (Select all that apply)",
    type: "multi",
    options: ["Friendly & approachable", "Authoritative & expert", "Premium & refined", "Fast & urgent", "Trustworthy & steady", "Bold & confident"],
    why: "Sets the tone of your website copy, social captions, and video scripts.",
  },
  {
    id: "customer_pain_points",
    question: "What do your epoxy/concrete customers worry about most? (Select all that apply)",
    type: "multi",
    options: [
      "Price/cost per square foot",
      "Durability & longevity",
      "Installation timeline",
      "Trust/reliability of contractor",
      "Mess & disruption during install",
      "Floor prep & crack repair quality",
      "Not knowing who to hire",
    ],
    why: "We address these head-on in your copy, FAQ, and social content.",
  },
  {
    id: "target_customer",
    question: "Who is your ideal epoxy/concrete customer? (Select all that apply)",
    type: "multi",
    options: [
      "Homeowners (garage, basement, patio)",
      "Commercial property managers",
      "Industrial facilities & warehouses",
      "Retail stores & restaurants",
      "General contractors & builders",
      "Real estate investors",
    ],
    why: "Targets your messaging and the channels we focus on for epoxy/concrete lead generation.",
  },
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { industry, subIndustry, businessType, businessStage } = body;

    if (!industry) return Response.json({ error: "Industry is required" }, { status: 400 });

    const stageLabel = businessStage === "rebrand" ? "rebranding an existing" :
                       businessStage === "enhance" ? "enhancing an existing with AI" :
                       "starting a new";
    const typeLabel = businessType ? `${businessType} ` : "";

    const prompt = `You are an expert business onboarding consultant EXCLUSIVELY for the epoxy flooring, epoxy coatings, epoxy contractors, polished concrete, and decorative concrete contracting industry. The user is ${stageLabel} ${typeLabel}epoxy/concrete business${subIndustry ? ` in the ${subIndustry} sub-industry` : ""}.

Generate the top 7-9 most critical onboarding questions SPECIFIC to the epoxy/concrete industry and the "${subIndustry || industry}" niche. These questions directly feed our AI generators (website copy, logo, brand images, social media, video) — so every answer must improve the quality and specificity of what we produce for their epoxy/concrete business.

MANDATORY questions (always include these exact ids, but make the OPTIONS epoxy/concrete-specific):
1. id "services_offered" (type "multi") — the specific epoxy/concrete services they offer (garage epoxy, metallic epoxy, polished concrete, stamped concrete, overlays, etc.)
2. id "differentiators" (type "multi") — epoxy/concrete-relevant trust signals (licensed, insured, manufacturer-certified, warranty, same-day install)
3. id "signature_project" (type "multi") — their most impressive epoxy/concrete work (garage transformations, commercial warehouse floors, metallic showrooms, stamped patios)
4. id "visual_style" (type "multi") — the look they want (modern / luxury / industrial / minimalist / vibrant) — this drives every image and logo
5. id "brand_personality" (type "multi") — how they sound (friendly / authoritative / premium / urgent / trustworthy / bold) — this drives all copy tone
6. id "customer_pain_points" (type "multi") — what epoxy/concrete customers worry about (price/SF, durability, install timeline, mess, floor prep quality)
7. id "target_customer" (type "multi") — who they serve (homeowners, commercial property managers, industrial facilities, retail, builders)

Then add 0-2 MORE questions SPECIFIC to epoxy/concrete that would meaningfully improve the generated website, images, or marketing (e.g. service area radius, seasonal factors like garage floor season, material preferences, project minimums, commercial vs residential focus). Do NOT add generic business questions — only questions whose answers change what we generate for their epoxy/concrete business.

RULES:
- Every option list must be SPECIFIC to epoxy/concrete — not generic. A services_offered list should include "Garage Floor Epoxy, Metallic Epoxy, Polished Concrete, Stamped Concrete, Concrete Overlays", not "Service 1, Service 2".
- Each question needs: id (snake_case), question (clear text, end with "(Select all that apply)"), type ("multi"|"text"), options (array of strings, empty for text), why (one sentence: how this improves what we generate)
- Use type "multi" for ALL option-based questions — the user selects one OR more. Only use "text" for open-ended freeform answers.

Return a JSON object with a "questions" array.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                question: { type: "string" },
                type: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                why: { type: "string" },
              },
            },
          },
        },
      },
    });

    const questions = (res as any)?.questions || FALLBACK_QUESTIONS;

    // Safety: ensure every mandatory, generator-driving question exists.
    // If the LLM omitted one, inject the fallback version in the right slot.
    const MANDATORY_IDS = ["services_offered", "differentiators", "signature_project", "visual_style", "brand_personality", "customer_pain_points", "target_customer"];
    const finalQuestions = [...questions];
    for (let i = 0; i < MANDATORY_IDS.length; i++) {
      const id = MANDATORY_IDS[i];
      if (!finalQuestions.some((q: any) => q.id === id)) {
        const fallback = FALLBACK_QUESTIONS.find((q) => q.id === id);
        if (fallback) finalQuestions.splice(i, 0, fallback);
      }
    }

    return Response.json({ questions: finalQuestions });
  } catch (error) {
    console.error("getIndustryOnboarding error:", error);
    return Response.json({ questions: FALLBACK_QUESTIONS, error: error.message });
  }
}