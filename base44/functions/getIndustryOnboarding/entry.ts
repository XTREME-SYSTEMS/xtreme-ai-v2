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
    question: "What services do you offer?",
    type: "multi",
    options: ["Service 1", "Service 2", "Service 3", "Service 4", "Other"],
    why: "Powers your service pages and SEO.",
  },
  {
    id: "differentiators",
    question: "What makes you different from competitors?",
    type: "multi",
    options: ["Family-owned", "Licensed & insured", "Free estimates", "24/7 emergency service", "BBB accredited", "Eco-friendly", "5-star rated"],
    why: "Powers your About section and trust signals.",
  },
  {
    id: "target_customer",
    question: "Who is your ideal customer?",
    type: "multi",
    options: ["Homeowners", "Small businesses", "Large corporations", "Government/municipal", "All of the above"],
    why: "Targets your messaging and ad campaigns.",
  },
  {
    id: "project_size",
    question: "What's your typical project size?",
    type: "multi",
    options: ["Under $1k", "$1k–$5k", "$5k–$20k", "$20k–$50k", "$50k+"],
    why: "Helps us recommend the right package and pricing.",
  },
  {
    id: "lead_source",
    question: "Where do most of your leads come from today?",
    type: "multi",
    options: ["Word of mouth", "Google/SEO", "Social media", "Paid ads", "Referrals", "Cold outreach"],
    why: "Guides our marketing strategy and channel focus.",
  },
  {
    id: "biggest_challenge",
    question: "What's your biggest business challenge right now?",
    type: "multi",
    options: ["Not enough leads", "Low-quality leads", "Beating competitors", "Online presence", "Pricing/profitability", "Hiring/staffing"],
    why: "Shapes our recommendations and priority services.",
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

Generate the top 6-8 most critical onboarding questions SPECIFIC to this industry and sub-industry. These questions will help us:
1. Understand their business deeply
2. Recommend the right packages, services, and AI tools
3. Power all our generators (website content, logo, brand, social media, video)
4. Make intelligent, industry-specific recommendations

RULES:
- ALWAYS include a question with id "services_offered" (type "multi") listing the specific services a ${industry} business typically offers
- ALWAYS include a question with id "differentiators" (type "multi") with industry-relevant differentiators
- The remaining 4-6 questions must be SPECIFIC to ${industry}${subIndustry ? ` / ${subIndustry}` : ""} — NOT generic business questions
- Think about what a ${industry} business owner MUST tell us so we can build them the best possible website, brand, and marketing system
- Consider industry-specific regulations, certifications, equipment, project types, customer concerns, seasonal factors, and competitive dynamics
- Each question needs: id (snake_case), question (clear text), type ("multi"|"text"), options (array of strings, empty for text), why (why this matters)
- IMPORTANT: Use type "multi" for ALL option-based questions — the user must always be able to select one OR more answers, never forced to pick just one. Only use "text" for open-ended freeform answers.

Return a JSON object with a "questions" array.`;

    const res = await base44.integrations.Core.InvokeLLM({
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

    // Safety: ensure services_offered and differentiators always exist
    const hasServices = questions.some((q: any) => q.id === "services_offered");
    const hasDiff = questions.some((q: any) => q.id === "differentiators");
    const finalQuestions = [...questions];
    if (!hasServices) finalQuestions.unshift(FALLBACK_QUESTIONS[0]);
    if (!hasDiff) finalQuestions.splice(1, 0, FALLBACK_QUESTIONS[1]);

    return Response.json({ questions: finalQuestions });
  } catch (error) {
    console.error("getIndustryOnboarding error:", error);
    return Response.json({ questions: FALLBACK_QUESTIONS, error: error.message });
  }
}