// Industry taxonomy, business stages, and business types for the enhanced
// onboarding flow. The industry + subIndustry selection drives dynamic
// question generation in the getIndustryOnboarding backend function.

export const BUSINESS_STAGES = [
  {
    id: "rebrand",
    label: "I have a business & want to rebrand",
    desc: "Your business exists but needs a fresh brand, website, or identity.",
    icon: "RefreshCw",
  },
  {
    id: "enhance",
    label: "I have a business & want to enhance it with AI",
    desc: "You're running and want to add AI systems, automation, or smarter marketing.",
    icon: "Sparkles",
  },
  {
    id: "new",
    label: "I'm starting a new business",
    desc: "You don't have a business yet and want to build one from scratch.",
    icon: "Rocket",
  },
];

export const BUSINESS_TYPES = [
  { id: "residential", label: "Residential", desc: "Serving homeowners & individual consumers" },
  { id: "commercial", label: "Commercial", desc: "Serving businesses & commercial clients" },
  { id: "government", label: "Government", desc: "Serving government & municipal clients" },
  { id: "all", label: "All of the above", desc: "Residential, commercial & government" },
];

// This system is exclusively focused on the epoxy & concrete contracting
// industry. The five niches below are the only supported business types.
export const INDUSTRIES = [
  {
    id: "epoxy_concrete",
    label: "Epoxy & Concrete Contracting",
    icon: "🏗️",
    subIndustries: [
      "Epoxy Flooring",
      "Epoxy Coatings",
      "Epoxy Contractors",
      "Polished Concrete Contractors",
      "Decorative Concrete Contractors",
    ],
  },
];

export const RADIUS_OPTIONS = [
  "Local (within 10 miles)",
  "Regional (within 50 miles)",
  "Metro area",
  "Statewide",
  "Multi-state region",
  "Nationwide",
];

export const YEARS_OPTIONS = [
  "Just starting",
  "1-2 years",
  "3-5 years",
  "6-10 years",
  "10+ years",
];