// ============================================================
// generatorBrief.ts — shared onboarding-to-generator bridge
// ------------------------------------------------------------
// Every client-portal generator (content, website, images, social,
// video) imports this so all outputs draw from the SAME deep
// onboarding data consistently. This is how the client's answers
// are utilized across the system: instead of each generator
// re-deriving context from a flat field list, they all consume one
// rich, generator-ready brief — producing more specific, higher-
// quality, on-brand end results without the client answering any
// extra questions.
// ============================================================

export interface ClientBrief {
  businessName: string;
  industry: string;
  subIndustry?: string;
  businessType?: string;
  location?: string;
  serviceArea?: string;
  services: string[];
  differentiators: string[];
  visualStyle?: string;        // modern / rustic / luxury / industrial / minimalist / bold ...
  brandPersonality?: string;   // friendly / authoritative / premium / approachable ...
  signatureProject?: string;    // their most impressive / flagship work
  customerPainPoints?: string;  // problems their customers struggle with
  targetCustomer?: string;      // who they serve
  yearsInBusiness?: string;
  phone?: string;
  email?: string;
  website?: string;
  rawAnswers?: Record<string, any>;
}

// Normalize an onboarding answer value (multi-select arrives as array or string).
function asString(v: any): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "object") return Object.values(v).filter(Boolean).join(", ");
  return String(v).trim();
}

// Pull a value from industryAnswers by matching common key variants.
function pick(answers: Record<string, any> | undefined, ...keys: string[]): string {
  if (!answers) return "";
  for (const k of keys) {
    if (answers[k] != null && answers[k] !== "") return asString(answers[k]);
    // case-insensitive fallback
    const found = Object.keys(answers).find((ak) => ak.toLowerCase() === k.toLowerCase());
    if (found) return asString(answers[found]);
  }
  return "";
}

// Build a ClientBrief from whatever a generator receives. Tolerates
// missing fields and both flat + nested (profile.industryAnswers) shapes.
export function compileBrief(input: any): ClientBrief {
  const p = input?.profile || input || {};
  const answers = p.industryAnswers || input?.industryAnswers || p.industry_answers || input?.industry_answers || {};
  const services = Array.isArray(input?.services) ? input.services
    : Array.isArray(p.services_offered) ? p.services_offered
    : (asString(input?.services) || asString(p.services_offered) || asString(p.services))
      .split(",").map((s: string) => s.trim()).filter(Boolean);
  const differentiators = Array.isArray(input?.differentiators) ? input.differentiators
    : (asString(input?.differentiators) || pick(answers, "differentiators", "what_makes_you_different", "unique_selling_points"))
      .split(",").map((s: string) => s.trim()).filter(Boolean);

  return {
    businessName: input?.businessName || p.businessName || "your business",
    industry: input?.industry || p.industry || "local service business",
    subIndustry: input?.subIndustry || p.subIndustry || pick(answers, "sub_industry", "specialty"),
    businessType: input?.businessType || p.businessType || "",
    location: input?.primaryLocation || input?.city || p.primaryLocation || p.city || "",
    serviceArea: input?.serviceArea || p.serviceArea || p.radius || "",
    services,
    differentiators,
    visualStyle: pick(answers, "visual_style", "brand_style", "design_style", "aesthetic"),
    brandPersonality: pick(answers, "brand_personality", "tone_of_voice", "personality", "vibe"),
    signatureProject: pick(answers, "signature_project", "flagship_work", "best_work", "specialty_project", "signature_service"),
    customerPainPoints: pick(answers, "customer_pain_points", "pain_points", "biggest_customer_problem", "common_problems"),
    targetCustomer: pick(answers, "target_customer", "ideal_customer", "target_audience", "customer_base"),
    yearsInBusiness: input?.yearsInBusiness || p.years_in_business || p.yearsInBusiness || "",
    phone: input?.phone || p.phone || "",
    email: input?.email || p.email || "",
    website: input?.website || p.website || "",
    rawAnswers: answers,
  };
}

// A compact text block to drop into any LLM prompt so the model has the
// full, structured client context. Generators append this to their own
// task-specific instructions.
export function briefText(b: ClientBrief): string {
  const lines: string[] = [
    `BUSINESS: ${b.businessName}`,
    `INDUSTRY: ${b.industry}${b.subIndustry ? ` (${b.subIndustry})` : ""}`,
  ];
  if (b.businessType) lines.push(`BUSINESS TYPE: ${b.businessType}`);
  if (b.location) lines.push(`LOCATION: ${b.location}`);
  if (b.serviceArea) lines.push(`SERVICE AREA: ${b.serviceArea}`);
  if (b.services.length) lines.push(`SERVICES: ${b.services.join(", ")}`);
  if (b.differentiators.length) lines.push(`DIFFERENTIATORS: ${b.differentiators.join(", ")}`);
  if (b.visualStyle) lines.push(`VISUAL STYLE: ${b.visualStyle}`);
  if (b.brandPersonality) lines.push(`BRAND PERSONALITY: ${b.brandPersonality}`);
  if (b.signatureProject) lines.push(`SIGNATURE / FLAGSHIP WORK: ${b.signatureProject}`);
  if (b.customerPainPoints) lines.push(`CUSTOMER PAIN POINTS: ${b.customerPainPoints}`);
  if (b.targetCustomer) lines.push(`TARGET CUSTOMER: ${b.targetCustomer}`);
  if (b.yearsInBusiness) lines.push(`YEARS IN BUSINESS: ${b.yearsInBusiness}`);
  if (b.phone) lines.push(`PHONE: ${b.phone}`);
  if (b.email) lines.push(`EMAIL: ${b.email}`);
  if (b.website) lines.push(`WEBSITE: ${b.website}`);
  return lines.join("\n");
}

// Map a free-text visual style to concrete photography art direction so
// image generators produce cohesive, on-brand imagery. Falls back to a
// professional commercial-photography default.
export function photoStyleSuffix(b: ClientBrief): string {
  const v = (b.visualStyle || "").toLowerCase();
  let art = "professional commercial photography, natural lighting, clean composition, high detail, photorealistic, 8k";
  if (/luxury|premium|high.?end|elegant/.test(v)) art = "luxury commercial photography, soft diffused lighting, refined elegant composition, premium materials, magazine quality, photorealistic, 8k";
  else if (/rustic|warm|cozy|traditional/.test(v)) art = "warm natural commercial photography, golden-hour lighting, inviting authentic composition, photorealistic, 8k";
  else if (/industrial|bold|rugged|heavy/.test(v)) art = "bold industrial commercial photography, dramatic high-contrast lighting, rugged authentic composition, photorealistic, 8k";
  else if (/modern|minimal|clean|sleek/.test(v)) art = "modern minimalist commercial photography, bright even lighting, clean negative space, crisp architectural composition, photorealistic, 8k";
  else if (/vibrant|colorful|fun|playful/.test(v)) art = "vibrant commercial photography, bright saturated lighting, energetic dynamic composition, photorealistic, 8k";
  let extra = "";
  if (b.signatureProject) extra += `. Feature work resembling: ${b.signatureProject}`;
  if (b.location) extra += `. Realistic ${b.location} setting`;
  return `${art}${extra}`;
}