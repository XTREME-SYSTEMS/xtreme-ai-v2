// The 8 onboarding questions — the entire simplified pipeline starts here.
// Each answer triggers a background skip-trace that builds a full intelligence profile.
export const ONBOARDING_QUESTIONS = [
  {
    key: 'business_name',
    question: "What's your business name?",
    placeholder: "e.g. Xtreme Polishing Systems",
    hint: "We'll research your business, find your website, and identify competitors.",
    icon: 'Building2',
  },
  {
    key: 'owner_name',
    question: "Who's the owner or principal?",
    placeholder: "e.g. John Smith",
    hint: "We'll find public profiles, credentials, and background information.",
    icon: 'User',
  },
  {
    key: 'industry',
    question: "What industry are you in?",
    placeholder: "e.g. Epoxy flooring, HVAC, Roofing, Plumbing...",
    hint: "We'll research your industry, market size, and key competitors.",
    icon: 'Briefcase',
  },
  {
    key: 'location',
    question: "What's your primary service area?",
    placeholder: "e.g. Phoenix, AZ or Dallas-Fort Worth, TX",
    hint: "We'll analyze the local market, demographics, and demand.",
    icon: 'MapPin',
  },
  {
    key: 'services',
    question: "What services do you offer?",
    placeholder: "e.g. Metallic epoxy, flake systems, polished concrete...",
    hint: "We'll research service providers and pricing in your area.",
    icon: 'Wrench',
  },
  {
    key: 'target_audience',
    question: "Who's your ideal customer?",
    placeholder: "e.g. Homeowners with garages, commercial property managers...",
    hint: "We'll research your target demographic and their behavior.",
    icon: 'Users',
  },
  {
    key: 'competitive_advantage',
    question: "What sets you apart from competitors?",
    placeholder: "e.g. 15 years experience, proprietary technique, fastest turnaround...",
    hint: "We'll validate your differentiators against the competitive landscape.",
    icon: 'Trophy',
  },
  {
    key: 'budget',
    question: "What's your monthly marketing budget?",
    placeholder: "e.g. $2,000/month, $5,000/month, $10,000+...",
    hint: "We'll research advertising costs and ROI in your industry.",
    icon: 'DollarSign',
  },
];