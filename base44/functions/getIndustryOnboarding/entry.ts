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
    question: "What services do you offer? (Select all that apply)",
    type: "multi",
    options: ["Service 1", "Service 2", "Service 3", "Service 4", "Other"],
    why: "Powers your service pages, SEO, and the images we generate for each service.",
  },
  {
    id: "differentiators",
    question: "What makes you different from competitors? (Select all that apply)",
    type: "multi",
    options: ["Family-owned", "Licensed & insured", "Free estimates", "24/7 emergency service", "BBB accredited", "Eco-friendly", "5-star rated"],
    why: "Powers your About section, trust signals, and the headlines we write.",
  },
  {
    id: "signature_project",
    question: "What's your most impressive or flagship type of project? (Select all that apply)",
    type: "multi",
    options: ["Residential", "Commercial", "Emergency repair", "Custom/specialty work", "Large-scale installs", "Renovation/restoration"],
    why: "We feature this work in your hero images and video — it's what wins you jobs.",
  },
  {
    id: "visual_style",
    question: "What visual style feels most like your brand? (Select all that apply)",
    type: "multi",
    options: ["Modern & clean", "Premium / luxury", "Rustic & warm", "Bold & industrial", "Minimalist", "Vibrant & energetic"],
    why: "Drives the look of every image, logo, and video we generate for you.",
  },
  {
    id: "brand_personality",
    question: "How should your brand sound to customers? (Select all that apply)",
    type: "multi",
    options: ["Friendly & approachable", "Authoritative & expert", "Premium & refined", "Fast & urgent", "Trustworthy & steady", "Bold & confident"],
    why: "Sets the tone of your website copy, social captions, and video scripts.",
  },
  {
    id: "customer_pain_points",
    question: "What do your customers worry about most? (Select all that apply)",
    type: "multi",
    options: ["Price/cost", "Quality/durability", "Timeliness", "Trust/reliability", "Mess/disruption", "Not knowing who to hire"],
    why: "We address these head-on in your copy, FAQ, and social content.",
  },
  {
    id: "target_customer",
    question: "Who is your ideal customer? (Select all that apply)",
    type: "multi",
    options: ["Homeowners", "Small businesses", "Large corporations", "Property managers", "Government/municipal", "All of the above"],
    why: "Targets your messaging and the channels we focus on.",
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

    const prompt = `You are an expert business onboarding consultant for a ${typeLabel}${industry} business. The user is ${stageLabel} business${subIndustry ? ` in the ${subIndustry} sub-industry` : ""}.

Generate the top 7-9 most critical onboarding questions SPECIFIC to this industry and sub-industry. These questions directly feed our AI generators (website copy, logo, brand images, social media, video) — so every answer must improve the quality and specificity of what we produce for them.

MANDATORY questions (always include these exact ids, but make the OPTIONS industry-specific to ${industry}):
1. id "services_offered" (type "multi") — the specific services a ${industry} business offers
2. id "differentiators" (type "multi") — industry-relevant trust signals / differentiators
3. id "signature_project" (type "multi") — their most impressive / flagship type of work (this becomes their hero imagery & video)
4. id "visual_style" (type "multi") — the look they want (modern / luxury / rustic / industrial / minimalist / vibrant) — this drives every image and logo
5. id "brand_personality" (type "multi") — how they sound (friendly / authoritative / premium / urgent / trustworthy / bold) — this drives all copy tone
6. id "customer_pain_points" (type "multi") — what their customers worry about most — we address these in copy, FAQ, and social
7. id "target_customer" (type "multi") — who they serve

Then add 0-2 MORE questions that are SPECIFIC to ${industry}${subIndustry ? ` / ${subIndustry}` : ""} and would meaningfully improve the generated website, images, or marketing (e.g. seasonal factors, certifications, equipment, service-area specifics, common project types). Do NOT add generic business questions (pricing tiers, lead source, biggest challenge) — only questions whose answers change what we generate.

RULES:
- Every option list must be SPECIFIC to ${industry} — not generic. A roofer's services_offered should list "Roof repair, Roof replacement, Storm damage, Gutter installation", not "Service 1, Service 2".
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