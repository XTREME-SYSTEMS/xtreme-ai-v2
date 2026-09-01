// leadKeywords.ts — The keyword vocabulary for the lead engine.
// Direct keywords name the service explicitly. Indirect keywords capture
// phrasal intent — the way people actually ask for these services in
// Facebook groups, Reddit, and forums ("my garage floor is ugly", "looking
// for someone to do my driveway"). The Validator and scrape extraction
// prompts use both lists to maximize recall without sacrificing precision.

export const DIRECT_KEYWORDS = [
  // Epoxy / coatings
  'epoxy flooring', 'epoxy floor', 'epoxy coating', 'garage floor epoxy',
  'epoxy garage', 'metallic epoxy', 'epoxy flake', 'solid color epoxy',
  'epoxy countertop', 'epoxy table', 'epoxy resin floor',
  // Polished / stained concrete
  'polished concrete', 'concrete polishing', 'burnished concrete',
  'stained concrete', 'acid stain concrete', 'concrete densifier',
  'concrete sealer', 'sealed concrete',
  // Decorative / overlays
  'decorative concrete', 'stamped concrete', 'concrete overlay',
  'microcement', 'micro topping', 'concrete resurfacing',
  'concrete stamping', 'exposed aggregate',
  // Countertops
  'concrete countertop', 'concrete countertops',
  // Repair / leveling
  'concrete repair', 'concrete crack repair', 'concrete grinding',
  'concrete leveling', 'mudjacking', 'polyurethane injection',
  'concrete resurfacing', 'spalling concrete', 'concrete patch',
  // Exterior flatwork
  'concrete driveway', 'driveway', 'concrete patio', 'patio',
  'concrete sidewalk', 'sidewalk', 'concrete walkway', 'walkway',
  'concrete steps', 'concrete porch', 'concrete slab', 'concrete pad',
  'concrete foundation', 'concrete footer',
  // Commercial / industrial
  'warehouse floor', 'industrial floor', 'concrete floor coating',
  'commercial epoxy', 'polished concrete warehouse',
  // Related trades (cross-sell signals)
  'concrete staining', 'concrete sealing', 'concrete cutting',
  'concrete demolition', 'concrete pouring', 'concrete pouring',
  'concrete contractor', 'concrete finisher', 'flatwork',
];

export const INDIRECT_KEYWORDS = [
  // Phrasal intent — how people actually ask
  'looking for', 'need a', 'need someone', 'anyone know', 'anyone recommend',
  'who does', 'who can', 'recommend a', 'referral for', 'searching for',
  'can anyone recommend', 'does anyone know', 'need recommendations',
  'looking to', 'want to', 'trying to find', 'in need of',
  // Problem statements (pain = intent)
  'my garage floor', 'my driveway', 'my patio', 'my basement floor',
  'cracked driveway', 'cracked concrete', 'cracked garage',
  'ugly garage floor', 'ugly concrete', 'stained concrete' ,
  'floor is cracking', 'driveway is cracking', 'concrete is spalling',
  'concrete is chipping', 'epoxy is peeling', 'coating is failing',
  'slab is sinking', 'concrete is sinking', 'uneven concrete',
  'trip hazard', 'sunken slab',
  // Project intent
  'building a house', 'building a home', 'new construction',
  'remodeling', 'renovation', 'fixer upper', 'house flip',
  'new driveway', 'new patio', 'new garage', 'new shop',
  'building a shop', 'building a garage', 'building a patio',
  'pouring a slab', 'pouring concrete', 'pouring a driveway',
  // Commercial intent
  'new warehouse', 'warehouse floor', 'tenant finish', 'build out',
  'commercial space', 'retail space', 'office build out',
  // Seasonal
  'before winter', 'before summer', 'spring project', 'summer project',
  'getting ready to sell', 'selling my house', 'staging',
];

export const ALL_KEYWORDS = [...DIRECT_KEYWORDS, ...INDIRECT_KEYWORDS];

// Intent-tier classification guide used by the Validator agent.
// HOT / VERY_HOT → immediate same-day outreach
// WARM → standard outreach + 3 follow-ups
// PARTNER → subcontractor / partnership angle (contractors, builders, flippers)
// PROJECT / PROPERTY → long-term nurture (commercial permits, large projects)
// SIGNAL → market intelligence only, no outreach (vague mentions, wrong area)
export const INTENT_TIER_GUIDE = `
Intent Tier Classification:
- very_hot: Explicitly naming the exact service + ready to hire ("looking for epoxy flooring guy", "need my garage floor done ASAP")
- hot: Strong intent, slightly indirect ("my garage floor is ugly", "need a driveway poured")
- warm: Related intent, not urgent ("thinking about redoing my patio", "anyone know a good concrete guy")
- partner: A business that could be a referral partner or sub (general contractor, home builder, flipper, property manager, real estate agent, remodeling contractor)
- project: A building permit or commercial project — long timeline, nurture sequence
- property: A property/land listing that might need concrete work — long-term nurture
- signal: Vague mention, wrong area, or market signal only — no outreach, save for intelligence
`;