// Prompt templates for the Logo Generator and Brand Generator steps.
// Industry-aware: each prompt function accepts an optional industry context
// object so logos and mockups are tailored to the client's actual industry
// instead of being hardcoded for epoxy contractors.

// Build an industry descriptor string from the profile's industry data.
// Returns a phrase like "epoxy floor contractor" or "HVAC company" or "dental practice".
export function industryLabel(industry, subIndustry) {
  if (!industry) return "epoxy floor contractor";
  const base = subIndustry ? `${industry} (${subIndustry})` : industry;
  return base;
}

// Visual elements appropriate for the industry (used in logo/brand prompts).
function industryVisuals(industry) {
  const ind = (industry || "").toLowerCase();
  // Common visual elements by industry category
  if (ind.includes("epoxy") || ind.includes("floor") || ind.includes("concrete")) {
    return { material: "polished concrete", texture: "glossy floor surface", setting: "garage or commercial floor" };
  }
  if (ind.includes("hvac") || ind.includes("air") || ind.includes("heating") || ind.includes("cooling")) {
    return { material: "metal ductwork", texture: "clean metallic finish", setting: "modern HVAC installation" };
  }
  if (ind.includes("plumb")) {
    return { material: "chrome fixtures", texture: "clean pipe work", setting: "modern bathroom or kitchen" };
  }
  if (ind.includes("roof")) {
    return { material: "roofing shingles", texture: "textured roof surface", setting: "residential rooftop" };
  }
  if (ind.includes("electric")) {
    return { material: "electrical components", texture: "clean wiring", setting: "modern electrical panel" };
  }
  if (ind.includes("dental") || ind.includes("medical") || ind.includes("health")) {
    return { material: "clean modern surfaces", texture: "pristine clinical finish", setting: "modern medical office" };
  }
  if (ind.includes("landscap") || ind.includes("lawn") || ind.includes("garden")) {
    return { material: "natural stone and plants", texture: "lush greenery", setting: "beautiful outdoor landscape" };
  }
  if (ind.includes("clean") || ind.includes("janitor")) {
    return { material: "clean surfaces", texture: "spotless finish", setting: "pristine interior space" };
  }
  if (ind.includes("paint")) {
    return { material: "paint rollers and brushes", texture: "smooth painted surface", setting: "freshly painted room" };
  }
  // Generic fallback
  return { material: "professional tools", texture: "clean professional finish", setting: "professional work environment" };
}

// Accent color swatches shown under each logo card. Clicking a swatch
// regenerates that logo with the chosen accent color.
export const ACCENT_COLORS = [
  { name: "Lime", value: "lime green", hex: "#84CC16" },
  { name: "Blue", value: "blue", hex: "#3B82F6" },
  { name: "Navy", value: "navy", hex: "#1E3A8A" },
  { name: "Orange", value: "orange", hex: "#F97316" },
  { name: "Red", value: "red", hex: "#EF4444" },
  { name: "Gold", value: "gold", hex: "#EAB308" },
  { name: "Purple", value: "purple", hex: "#A855F7" },
  { name: "Teal", value: "teal", hex: "#14B8A6" },
  { name: "Black", value: "black", hex: "#171717" },
  { name: "Silver", value: "silver", hex: "#C0C0C0" },
];

// All logos are generated with a transparent background so they render
// correctly on both light and dark website themes. The optional `accent`
// parameter lets the user pick a custom accent color for the logo.
// The optional `industry` parameter customizes the logo for the client's industry.
export const LOGO_STYLES = [
  { id: "monogram", label: "Minimalist Monogram", prompt: (n, accent, industry) => { const v = industryVisuals(industry); return `A clean minimalist logo for ${industryLabel(industry)} named "${n}". A bold monogram built from the initials, simple geometric lines, a single ${accent || "lime-green"} accent. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, flat vector style, no extra text, no border, no card.`; } },
  { id: "industrial", label: "Bold Industrial", prompt: (n, accent, industry) => `A bold industrial logo badge for ${industryLabel(industry)} named "${n}". Hexagonal or shield emblem, ${industryVisuals(industry).texture}, dark charcoal and ${accent || "orange"}, strong geometric type. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "geometric", label: "Geometric Abstract", prompt: (n, accent, industry) => `A modern abstract geometric logo for ${industryLabel(industry)} "${n}". Overlapping shapes forming a subtle industry-relevant mark, two-tone with ${accent || "lime-green"} accent. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "emblem", label: "Classic Emblem", prompt: (n, accent, industry) => `A classic circular emblem logo for ${industryLabel(industry)} "${n}". Ring with the business name, an industry-relevant icon in the center, navy and ${accent || "silver"}. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "wordmark", label: "Modern Wordmark", prompt: (n, accent, industry) => `A modern wordmark logo for ${industryLabel(industry)} "${n}". The business name in a strong condensed sans-serif, a single ${accent || "lime-green"} underline accent. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "stamp", label: "Embossed Seal", prompt: (n, accent, industry) => `A logo for ${industryLabel(industry)} "${n}" styled as an embossed seal. The business name embossed in a ${industryVisuals(industry).material} surface, monochrome with ${accent || "lime-green"} tint. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, photoreal, no extra text, no border, no card.` },
  { id: "neon", label: "Neon Glow", prompt: (n, accent, industry) => `A neon-glow logo for ${industryLabel(industry)} "${n}". The business name in glowing ${accent || "lime-green"} neon tube lettering. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, no extra text, no border, no card.` },
  { id: "rustic", label: "Hand-drawn Rustic", prompt: (n, accent, industry) => `A hand-drawn rustic logo for ${industryLabel(industry)} "${n}". Sketched industry tools and icon with the business name, warm earthy tones with ${accent || "lime-green"} accent. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, illustration style, no extra text, no border, no card.` },
  { id: "luxury", label: "Premium Luxury", prompt: (n, accent, industry) => `A premium luxury logo for ${industryLabel(industry)} "${n}". The business name in an elegant serif, ${accent || "gold"} foil accent line, black and ${accent || "gold"}. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "gradient", label: "Vibrant Gradient", prompt: (n, accent, industry) => `A vibrant gradient logo for ${industryLabel(industry)} "${n}". The business name with a blue-to-${accent || "lime"} gradient fill, fluid modern shape behind it. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
];

export const BRAND_TYPES = [
  { id: "business-card", label: "Business Card", prompt: (n, industry) => `A realistic business card mockup for ${industryLabel(industry)} named "${n}". Front and back of the card lying flat on a ${industryVisuals(industry).material} surface, top-down studio photo, professional branding, clean layout.` },
  { id: "tri-fold", label: "Tri-fold Brochure", prompt: (n, industry) => `A realistic open tri-fold brochure mockup for ${industryLabel(industry)} "${n}". Professional marketing brochure, industry-appropriate design with service photos, studio lighting.` },
  { id: "flyer", label: "Digital Flyer", prompt: (n, industry) => `A digital marketing flyer mockup for ${industryLabel(industry)} "${n}". A promotional one-pager displayed on a tablet, modern layout with a service photo and call-to-action, clean studio shot.` },
  { id: "tshirt", label: "T-Shirt", prompt: (n, industry) => `A premium black t-shirt mockup for ${industryLabel(industry)} "${n}" with the company logo printed on the chest. Flat-lay on a professional surface, professional apparel mockup, studio lighting.` },
  { id: "hat", label: "Hat / Cap", prompt: (n, industry) => `A baseball cap mockup for ${industryLabel(industry)} "${n}" with the logo embroidered on the front. Side-angle studio product photo, clean background, professional headwear mockup.` },
  { id: "app", label: "Mobile App", prompt: (n, industry) => `A smartphone mockup showing the home screen of a mobile app for ${industryLabel(industry)} "${n}". Modern app UI with a book-a-quote button, held in a hand, clean studio shot.` },
  { id: "van", label: "Vehicle Wrap", prompt: (n, industry) => `A white service vehicle with a full professional vehicle wrap branding for ${industryLabel(industry)} "${n}". Parked at a jobsite, clean fleet branding with the logo and phone number, daytime photo.` },
  { id: "signage", label: "Storefront Sign", prompt: (n, industry) => `An exterior storefront channel-letter sign for ${industryLabel(industry)} "${n}" mounted on a modern building facade, lit at dusk, professional signage mockup.` },
  { id: "social", label: "Social Media Kit", prompt: (n, industry) => `A social media brand kit mockup for ${industryLabel(industry)} "${n}". An Instagram post and story template shown on a phone, grid layout, consistent branding, clean studio shot.` },
  { id: "polo", label: "Branded Uniform", prompt: (n, industry) => `A branded polo shirt uniform mockup for ${industryLabel(industry)} "${n}" with the logo on the chest, worn by a professional in a ${industryVisuals(industry).setting}, professional workwear photo.` },
];