// leadKeywords.ts — The full demand-intelligence vocabulary for the
// autonomous construction demand intelligence system. Covers the
// complete service universe, intent phrases, problem signals, project
// signals, and adjacent-trade signals. Used by the scrape extraction
// prompts, the Validator, and the combinatorial search generator.

// ── SERVICE UNIVERSE ──────────────────────────────────────────────
export const SERVICE_UNIVERSE = [
  // Epoxy / resinous
  'epoxy flooring', 'epoxy floor', 'epoxy coating', 'garage floor epoxy',
  'epoxy garage', 'metallic epoxy', 'epoxy flake', 'solid color epoxy',
  'epoxy countertop', 'epoxy table', 'epoxy resin floor',
  'polyaspartic', 'polyurea', 'urethane coating', 'resinous flooring',
  'industrial coating', 'industrial flooring',
  // Polished / stained
  'polished concrete', 'concrete polishing', 'burnished concrete',
  'stained concrete', 'acid stain', 'acid stain concrete', 'concrete densifier',
  'concrete sealer', 'sealed concrete', 'terrazzo restoration',
  // Decorative / overlays
  'decorative concrete', 'stamped concrete', 'concrete overlay',
  'microcement', 'microtopping', 'micro topping', 'concrete resurfacing',
  'concrete stamping', 'exposed aggregate', 'architectural concrete',
  // Countertops
  'concrete countertop', 'concrete countertops', 'epoxy countertop',
  'custom countertop', 'custom countertops',
  // Repair / restoration
  'concrete repair', 'concrete crack repair', 'concrete grinding',
  'concrete leveling', 'mudjacking', 'polyurethane injection',
  'concrete restoration', 'spalling repair', 'concrete patch',
  'concrete resurfacing', 'floor resurfacing',
  // Exterior / flatwork
  'concrete driveway', 'driveway', 'driveway resurfacing',
  'concrete patio', 'patio', 'patio resurfacing', 'pool deck', 'pool deck coating',
  'concrete sidewalk', 'sidewalk', 'concrete walkway', 'walkway',
  'concrete steps', 'concrete porch', 'concrete slab', 'concrete pad',
  'concrete foundation', 'concrete footer',
  // Commercial / industrial
  'warehouse floor', 'warehouse flooring', 'industrial floor',
  'commercial flooring', 'commercial epoxy', 'commercial concrete',
  'restaurant floor', 'restaurant flooring', 'kitchen floor',
  'retail floor', 'office floor', 'medical floor', 'school floor',
  // Coatings / sealing
  'concrete coating', 'floor coating', 'concrete sealing', 'concrete densification',
];

// ── INTENT PHRASES ────────────────────────────────────────────────
export const INTENT_PHRASES = [
  // Asking
  'looking for', 'need a', 'need someone', 'anyone know', 'anyone recommend',
  'who does', 'who can', 'recommend a', 'referral for', 'searching for',
  'can anyone recommend', 'does anyone know', 'need recommendations',
  'looking to', 'want to', 'trying to find', 'in need of', 'seeking',
  // Hiring
  'hire', 'hiring', 'contractor', 'subcontractor', 'vendor', 'sub',
  // Pricing
  'quote', 'estimate', 'pricing', 'price', 'cost', 'how much',
  'ballpark', 'bid', 'proposal', 'get a quote', 'get an estimate',
  // Project
  'renovation', 'remodel', 'replacement', 'repair', 'restore', 'resurface',
  'refinish', 'upgrade', 'build', 'construct', 'develop',
  // Acquisition
  'acquired', 'purchased', 'leased', 'bought', 'closing on', 'just bought',
  'new build', 'new construction',
  // Business
  'opening', 'expanding', 'tenant improvement', 'build-out', 'buildout',
  'value-add', 'repositioning', 'adaptive reuse', 'redevelopment',
  'capital improvement',
];

// ── PROBLEM SIGNALS ───────────────────────────────────────────────
// The user does NOT need to mention the target service. Infer the
// potential service from the problem.
export const PROBLEM_SIGNALS = [
  'cracked', 'cracking', 'spalling', 'flaking', 'peeling', 'chipping',
  'stained', 'oil stained', 'oil stain', 'dusty', 'dusting', 'worn',
  'damaged', 'ugly', 'old floor', 'slippery', 'uneven', 'failed',
  'failed epoxy', 'failed flooring', 'failed coating', 'water damage',
  'chemical damage', 'chemical spill', 'deterioration', 'deteriorating',
  'unsafe', 'hard to maintain', 'hard to clean', 'trip hazard',
  'sunken', 'sinking', 'settled', 'heaved', 'pitted', 'pitting',
  'delaminating', 'delamination', 'hollow', 'hollow sounding',
  'discolored', 'faded', 'yellowed', 'chalky',
];

// ── PROJECT SIGNALS ──────────────────────────────────────────────
export const PROJECT_SIGNALS = [
  'new construction', 'renovation', 'remodel', 'tenant improvement',
  'build-out', 'buildout', 'warehouse development', 'restaurant opening',
  'hotel renovation', 'apartment renovation', 'multifamily renovation',
  'retail renovation', 'medical renovation', 'school renovation',
  'hospital project', 'industrial expansion', 'facility upgrade',
  'property acquisition', 'property repositioning', 'adaptive reuse',
  'redevelopment', 'capital improvement', 'ground up', 'ground-up',
  'tenant finish', 'TI build', 'commercial build', 'office build',
];

// ── BID / PROCUREMENT SIGNALS ────────────────────────────────────
export const BID_SIGNALS = [
  'RFP', 'RFQ', 'ITB', 'invitation to bid', 'request for proposal',
  'request for quote', 'bid opportunity', 'bidding', 'out for bid',
  'plan room', 'project manual', 'addendum', 'pre-bid', 'pre-proposal',
  'procurement', 'solicitation', 'vendor registration', 'pre-qualified',
  'on the list', 'bid list', 'bidders list',
];

// ── PROPERTY SIGNALS ─────────────────────────────────────────────
export const PROPERTY_SIGNALS = [
  'just acquired', 'just purchased', 'just leased', 'just bought',
  'closing on', 'under contract', 'new listing', 'coming soon',
  'foreclosure', 'foreclosed', 'auction', 'sheriff sale', 'bank owned',
  'REO', 'distressed property', 'value-add property', 'repositioning',
  'new tenant', 'lease signed', 'lease renewal', 'build-out before move-in',
];

// ── ADJACENT TRADES (referral partners) ──────────────────────────
export const ADJACENT_TRADES = [
  'general contractor', 'GC', 'remodeler', 'builder', 'home builder',
  'architect', 'interior designer', 'kitchen designer', 'engineer',
  'concrete contractor', 'flooring contractor', 'tile contractor',
  'restoration company', 'water mitigation', 'fire restoration',
  'pool builder', 'landscape contractor', 'property manager',
  'facility manager', 'building engineer', 'janitorial company',
  'real estate agent', 'realtor', 'commercial broker', 'developer',
  'investor', 'house flipper', 'flipper', 'apartment owner',
  'hotel operator', 'restaurant operator', 'manufacturer', 'warehouse',
  'dealership', 'auto shop', 'school district', 'university', 'hospital',
];

// ── LEAD TYPES (opportunity classification) ─────────────────────
export const OPPORTUNITY_TYPES = [
  'direct_demand',        // explicitly asking for the service
  'problem_demand',       // has a problem we solve (cracked, spalling, ugly)
  'project_demand',       // a construction project (renovation, new build)
  'bid_demand',           // RFP/RFQ/ITB — formal procurement
  'partner_demand',       // a referral partner (GC, architect, flipper)
  'property_signal',      // property acquired/leased/sold — future opportunity
  'market_signal',        // market trend, demand shift
  'competitor_signal',   // competitor activity
  'content_opportunity', // FAQ/content idea from a question
  'seo_opportunity',     // search gap, keyword opportunity
  'referral_opportunity', // someone referring others to a service
];

export const ALL_KEYWORDS = [
  ...SERVICE_UNIVERSE,
  ...INTENT_PHRASES,
  ...PROBLEM_SIGNALS,
  ...PROJECT_SIGNALS,
  ...BID_SIGNALS,
  ...PROPERTY_SIGNALS,
  ...ADJACENT_TRADES,
];

// Intent tier classification guide used by the Validator agent.
export const INTENT_TIER_GUIDE = `
Intent Tier Classification:
- very_hot: Explicitly naming the exact service + ready to hire ("looking for epoxy flooring guy", "need my garage floor done ASAP", "who does polished concrete in Dallas")
- hot: Strong intent, slightly indirect ("my garage floor is ugly", "need a driveway poured", "cracked patio needs fixing")
- warm: Related intent, not urgent ("thinking about redoing my patio", "anyone know a good concrete guy", "what does epoxy cost")
- partner: A business that could be a referral partner or sub (general contractor, home builder, flipper, property manager, real estate agent, remodeling contractor, architect)
- project: A building permit, commercial project, or bid opportunity — long timeline, nurture sequence
- property: A property/land listing, acquisition, or lease that might need concrete work — long-term nurture
- signal: Vague mention, wrong area, or market signal only — no outreach, save for intelligence and SEO/content
`;

// Opportunity type classification guide
export const OPPORTUNITY_TYPE_GUIDE = `
Opportunity Type Classification:
- direct_demand: Someone explicitly asking for the service ("looking for epoxy flooring", "need a concrete guy")
- problem_demand: Someone describing a problem we solve without naming the service ("my garage floor is ugly", "cracked driveway", "floor is peeling")
- project_demand: A construction project (renovation, new build, tenant improvement, build-out) — find the decision-maker
- bid_demand: A formal procurement opportunity (RFP, RFQ, ITB, bid board, plan room)
- partner_demand: A business that could refer work to us (GC, architect, flipper, property manager, realtor)
- property_signal: A property was acquired/leased/sold — future opportunity when they renovate
- market_signal: A market trend or demand shift (new development announced, area growing)
- competitor_signal: A competitor is advertising, expanding, or losing a client
- content_opportunity: A question or problem that would make good FAQ/content ("how much does epoxy cost", "epoxy vs tile")
- seo_opportunity: A search query with low competition / high intent
- referral_opportunity: Someone is referring others to a service (could refer to us instead)
`;