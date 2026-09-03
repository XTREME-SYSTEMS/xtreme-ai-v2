// ============================================================
// Bid Engine — preliminary, non-binding price range calculation
// ============================================================
// v2.0 calibrated to 2025 national averages from HomeAdvisor, Angi,
// Fixr, Homewyse, Craftsman Concrete Floors, and contractor pricing
// aggregators. Installed $/sqft (materials + labor, standard prep
// included).
//
// Three bid tiers: Essential, Recommended, Premier
// Each tier applies a factor to the base range.
// ============================================================

export const DEFAULT_RULES = {
  version: "v2.0",
  mobilization_fee: 0,
  min_job_price: 0,
  prep_grinding_rate: 1.0,
  moisture_mitigation_rate: 1.5,
  crack_repair_rate: 8,
  coving_rate: 12,
  joint_filler_rate: 3,
  patch_rate: 35,
  excess_patch_rate: 85,
  large_patch_rate: 150,
  demolition_rate: 2.5,
  extra_prep_rate: 250,
  range_spread_pct: 0.15,
};

const CONDITION_FACTOR = { good: 1, fair: 1.08, poor: 1.2 };

export const BID_TIERS = [
  { key: "essential", label: "Essential", factor: 0.92, blurb: "Core system, standard color, standard prep." },
  { key: "recommended", label: "Recommended", factor: 1.0, blurb: "Premium color + full prep + sealing." },
  { key: "premier", label: "Premier", factor: 1.12, blurb: "Decorative finish, coving, moisture barrier." },
];

export const FINISHES = ["Matte", "Satin", "High Gloss"];

// 2025 national averages — installed $/sqft (materials + labor, standard prep)
export const SYSTEM_RATES = {
  "Flake Epoxy": { low: 5.0, high: 10.0 },
  "Metallic Epoxy": { low: 8.0, high: 15.0 },
  "Multi-Color Metallic Epoxy": { low: 9.0, high: 16.0 },
  "Solid Color Epoxy": { low: 4.0, high: 8.0 },
  "Quartz System": { low: 9.0, high: 15.0 },
  "Glitter Epoxy": { low: 7.0, high: 12.0 },
  "Polished Concrete": { low: 3.0, high: 8.0 },
  "Stained Concrete": { low: 3.5, high: 7.0 },
  "Joint Fill & Repair": { low: 6.0, high: 10.0 },
  "Concrete Overlayment": { low: 6.0, high: 12.0 },
  "Sealed Concrete": { low: 3.0, high: 6.0 },
};

export function computeRange(input, rules = DEFAULT_RULES) {
  const r = { ...DEFAULT_RULES, ...rules };
  const sqft = Number(input.square_feet) || 0;
  const factor = CONDITION_FACTOR[input.condition || 'fair'] || 1;

  let low = sqft * (Number(input.base_rate_low) || 0);
  let high = sqft * (Number(input.base_rate_high) || 0);

  if (input.needs_grinding) {
    const g = sqft * r.prep_grinding_rate;
    low += g; high += g;
  }
  if (input.needs_moisture_mitigation) {
    const m = sqft * r.moisture_mitigation_rate;
    low += m; high += m;
  }

  const cracks = (Number(input.linear_feet_cracks) || 0) * r.crack_repair_rate;
  const coving = (Number(input.linear_feet_coving) || 0) * r.coving_rate;
  const joints = (Number(input.linear_feet_joints) || 0) * r.joint_filler_rate;
  const patches = (Number(input.patch_count) || 0) * r.patch_rate
    + (Number(input.excessive_patch_count) || 0) * r.excess_patch_rate
    + (Number(input.large_patch_count) || 0) * r.large_patch_rate;
  const demo = (Number(input.demolition_sqft) || 0) * r.demolition_rate;
  const extraPrep = input.extra_prep ? r.extra_prep_rate : 0;

  const addOns = cracks + coving + joints + patches + demo + extraPrep;

  low = (low + addOns) * factor + r.mobilization_fee;
  high = (high + addOns) * factor + r.mobilization_fee;

  low = Math.max(low * (1 - r.range_spread_pct / 2), r.min_job_price);
  high = Math.max(high * (1 + r.range_spread_pct / 2), r.min_job_price * 1.25);

  return {
    low: Math.round(low / 25) * 25,
    high: Math.round(high / 25) * 25,
    version: r.version,
  };
}

export function money(n) {
  return typeof n === "number" && !isNaN(n)
    ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : "—";
}

// Compute all three bid tiers from a visualizer input
export function computeBids(input, rules = DEFAULT_RULES) {
  const range = computeRange(input, rules);
  return BID_TIERS.map(t => ({
    ...t,
    low: Math.round((range.low * t.factor) / 25) * 25,
    high: Math.round((range.high * t.factor) / 25) * 25,
  }));
}

// Build a human-readable prep summary
export function buildPrepSummary(input) {
  const parts = [];
  if (input.needs_grinding) parts.push("Grinding");
  if (input.needs_moisture_mitigation) parts.push("Moisture barrier");
  if (input.linear_feet_cracks) parts.push(`${input.linear_feet_cracks} lf cracks`);
  if (input.patch_count) parts.push(`${input.patch_count} patches`);
  if (input.excessive_patch_count) parts.push(`${input.excessive_patch_count} excessive`);
  if (input.large_patch_count) parts.push(`${input.large_patch_count} large`);
  if (input.linear_feet_joints) parts.push(`${input.linear_feet_joints} lf joints`);
  if (input.linear_feet_coving) parts.push(`${input.linear_feet_coving} lf coving`);
  if (input.demolition_sqft) parts.push(`${input.demolition_sqft} sqft demo`);
  if (input.extra_prep) parts.push("Extra prep");
  return parts.length ? parts.join(", ") : "None";
}

// Industry-standard terms and warranty text
export const TERMS_TEXT =
  "1. This proposal is valid for 30 days from the date above. 2. A 50% deposit is required to schedule the work; the balance is due upon completion. 3. The customer is responsible for clearing the workspace of all furniture, vehicles, and personal belongings prior to the crew's arrival. 4. Pricing is based on the stated square footage and condition; any variance discovered on site may result in a change order. 5. The company is fully licensed and insured; certificates of insurance are available upon request. 6. A change order must be approved in writing by both parties before additional work is performed. 7. Payment terms are net upon completion; late payments may incur a 1.5% monthly finance charge. 8. The company is not responsible for damage caused by pre-existing latent defects, moisture conditions not disclosed, or work performed by others. 9. This proposal, once signed, constitutes the agreement between the parties.";

export const WARRANTY_TEXT =
  "The company warrants its workmanship for a period of two (2) years from the date of installation. This warranty covers peeling, delamination, or failure of the installed flooring system attributable to improper installation. It does not cover damage caused by moisture intrusion from below the slab, hydrostatic pressure, acts of God, abuse, neglect, improper maintenance, chemical exposure beyond normal residential or commercial use, or modifications by others. Manufacturer product warranties apply separately and are passed through to the customer. To make a warranty claim, contact the company in writing within the warranty period. This warranty is in lieu of all other warranties, express or implied.";

export const PRICE_DISCLOSURE =
  "Preliminary, non-binding estimate based on the information provided. Final pricing is determined after an on-site inspection.";