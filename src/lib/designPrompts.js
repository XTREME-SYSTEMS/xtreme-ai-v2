// Prompt templates for the Logo Generator and Brand Generator steps.
// Each logo style produces a distinct, professional logo for the client's
// epoxy business. Each brand type produces a realistic mockup (business card,
// brochure, apparel, app, vehicle, …) that uses the client's chosen logo as a
// visual reference so the generated mockups stay on-brand.

// All logos are generated with a transparent background so they render
// correctly on both light and dark website themes.
export const LOGO_STYLES = [
  { id: "monogram", label: "Minimalist Monogram", prompt: (n) => `A clean minimalist logo for an epoxy floor contractor named "${n}". A bold monogram built from the initials, simple geometric lines, a single lime-green accent. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, flat vector style, no extra text, no border, no card.` },
  { id: "industrial", label: "Bold Industrial", prompt: (n) => `A bold industrial logo badge for an epoxy contractor named "${n}". Hexagonal or shield emblem, concrete texture, dark charcoal and orange, strong geometric type. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "geometric", label: "Geometric Abstract", prompt: (n) => `A modern abstract geometric logo for epoxy contractor "${n}". Overlapping polished concrete shapes forming a subtle floor-gloss mark, two-tone. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "emblem", label: "Classic Emblem", prompt: (n) => `A classic circular emblem logo for epoxy contractor "${n}". Ring with the business name, polished concrete diamond in the center, navy and silver. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "wordmark", label: "Modern Wordmark", prompt: (n) => `A modern wordmark logo for epoxy contractor "${n}". The business name in a strong condensed sans-serif, a single lime-green underline accent. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "stamp", label: "Concrete Stamp", prompt: (n) => `A logo for epoxy contractor "${n}" styled as a concrete stamp seal. The business name embossed in a polished concrete surface, monochrome. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, photoreal, no extra text, no border, no card.` },
  { id: "neon", label: "Neon Glow", prompt: (n) => `A neon-glow logo for epoxy contractor "${n}". The business name in glowing lime-green neon tube lettering. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, no extra text, no border, no card.` },
  { id: "rustic", label: "Hand-drawn Rustic", prompt: (n) => `A hand-drawn rustic logo for epoxy contractor "${n}". Sketched trowel and floor icon with the business name, warm earthy tones. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, illustration style, no extra text, no border, no card.` },
  { id: "luxury", label: "Premium Luxury", prompt: (n) => `A premium luxury logo for epoxy contractor "${n}". The business name in an elegant serif, gold foil accent line, black and gold. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
  { id: "gradient", label: "Vibrant Gradient", prompt: (n) => `A vibrant gradient logo for epoxy contractor "${n}". The business name with a blue-to-lime gradient fill, fluid glossy floor shape behind it. TRANSPARENT BACKGROUND, no background, isolated logo, PNG with alpha channel, vector, no extra text, no border, no card.` },
];

export const BRAND_TYPES = [
  { id: "business-card", label: "Business Card", prompt: (n) => `A realistic business card mockup for an epoxy floor contractor named "${n}". Front and back of the card lying flat on a polished concrete surface, top-down studio photo, professional industrial branding, clean layout.` },
  { id: "tri-fold", label: "Tri-fold Brochure", prompt: (n) => `A realistic open tri-fold brochure mockup for epoxy contractor "${n}". Professional marketing brochure on a concrete table, industrial design with service photos, studio lighting.` },
  { id: "flyer", label: "Digital Flyer", prompt: (n) => `A digital marketing flyer mockup for epoxy contractor "${n}". A promotional one-pager displayed on a tablet, modern layout with a service photo and call-to-action, clean studio shot.` },
  { id: "tshirt", label: "T-Shirt", prompt: (n) => `A premium black t-shirt mockup for epoxy contractor "${n}" with the company logo printed on the chest. Flat-lay on a concrete surface, professional apparel mockup, studio lighting.` },
  { id: "hat", label: "Hat / Cap", prompt: (n) => `A baseball cap mockup for epoxy contractor "${n}" with the logo embroidered on the front. Side-angle studio product photo, clean background, professional headwear mockup.` },
  { id: "app", label: "Mobile App", prompt: (n) => `A smartphone mockup showing the home screen of a mobile app for epoxy contractor "${n}". Modern app UI with a book-a-quote button, held in a hand, clean studio shot.` },
  { id: "van", label: "Vehicle Wrap", prompt: (n) => `A white service van with a full professional vehicle wrap branding for epoxy contractor "${n}". Parked at a jobsite, clean fleet branding with the logo and phone number, daytime photo.` },
  { id: "signage", label: "Storefront Sign", prompt: (n) => `An exterior storefront channel-letter sign for epoxy contractor "${n}" mounted on a modern industrial building facade, lit at dusk, professional signage mockup.` },
  { id: "social", label: "Social Media Kit", prompt: (n) => `A social media brand kit mockup for epoxy contractor "${n}". An Instagram post and story template shown on a phone, grid layout, consistent branding, clean studio shot.` },
  { id: "polo", label: "Branded Uniform", prompt: (n) => `A branded polo shirt uniform mockup for epoxy contractor "${n}" with the logo on the chest, worn by a contractor in a finished epoxy floor room, professional workwear photo.` },
];