// ============================================================
// Floor Type Specification Templates
// ============================================================
// Maps a general floor type to a full scope-of-work item list for
// proposals. Conditional items (perimeter protection, moisture
// mitigation, joint filler, cove base) are included or excluded
// based on the lead's measurement data.
// ============================================================

export const FLOOR_TYPE_OPTIONS = [
  "Metallic Epoxy",
  "Multi-Color Metallic Epoxy",
  "Flake Epoxy",
  "Quartz System",
  "Solid Epoxy",
  "Stained Concrete",
  "Polished Concrete",
  "Glitter Epoxy",
  "Joint Fill & Repair",
  "Concrete Overlayment",
  "Sealed Concrete",
];

// Each spec item: { label, detail, conditional? }
// conditional items are only included when the matching option is true.
export const FLOOR_SPECS = {
  "Metallic Epoxy": [
    { label: "Concrete surface preparation", detail: "Diamond grind the existing concrete substrate to remove existing coatings, adhesives, oil, and contaminants. Open the surface to a CSP-2/CSP-3 profile." },
    { label: "Crack and surface repair", detail: "Fill all cracks, spalls, pop-outs, and surface defects with two-part epoxy repair mortar. Grind flush after cure.", conditional: "cracks" },
    { label: "Perimeter protection", detail: "Apply plastic sheeting and painter's tape to all walls, baseboards, door frames, and adjacent surfaces to protect from overspray and splatter.", conditional: "perimeter" },
    { label: "Moisture mitigation", detail: "If calcium chloride or RH testing indicates elevated moisture vapor emission, apply a moisture vapor barrier primer to the prepared substrate.", conditional: "moisture" },
    { label: "Prime coat", detail: "Apply a penetrating epoxy primer / bond coat to the prepared substrate to promote adhesion of the metallic system." },
    { label: "Metallic epoxy base coat", detail: "Apply 100% solids metallic epoxy base coat (15–20 mils) with the selected metallic pigment color." },
    { label: "Metallic effect manipulation", detail: "Manipulate metallic pigments using solvents, denatured alcohol, or specialized tools to achieve the desired 3D swirl, river, or cloud effect." },
    { label: "Joint filler", detail: "Fill all control joints and construction joints with semi-rigid polyurea or epoxy joint filler, then shave flush.", conditional: "joints" },
    { label: "Topcoat — polyaspartic / urethane / T200", detail: "Apply two coats of high-performance polyaspartic, urethane, or T200 topcoat for UV stability, chemical resistance, and long-term wear protection." },
    { label: "Cove base installation", detail: "Install epoxy cove base at perimeter walls where specified.", conditional: "coving" },
    { label: "Final walk-through inspection", detail: "Conduct a final walk-through inspection with the customer to confirm finish quality, color match, and surface integrity." },
  ],
  "Flake Epoxy": [
    { label: "Concrete surface preparation", detail: "Diamond grind the existing concrete substrate to remove existing coatings, adhesives, oil, and contaminants. Open the surface to a CSP-2/CSP-3 profile." },
    { label: "Crack and surface repair", detail: "Fill all cracks, spalls, pop-outs, and surface defects with two-part epoxy repair mortar. Grind flush after cure.", conditional: "cracks" },
    { label: "Perimeter protection", detail: "Apply plastic sheeting and painter's tape to all walls, baseboards, door frames, and adjacent surfaces.", conditional: "perimeter" },
    { label: "Moisture mitigation", detail: "Apply a moisture vapor barrier primer if testing indicates elevated moisture.", conditional: "moisture" },
    { label: "Prime coat", detail: "Apply a penetrating epoxy primer / bond coat to the prepared substrate." },
    { label: "Epoxy base coat with broadcast", detail: "Apply 100% solids epoxy base coat and broadcast the selected vinyl flake to refusal. Allow to cure." },
    { label: "Flake scrape and vacuum", detail: "Scrape excess flake and vacuum the surface to remove loose material." },
    { label: "Joint filler", detail: "Fill all control joints and construction joints with semi-rigid polyurea or epoxy joint filler.", conditional: "joints" },
    { label: "Topcoat — polyaspartic / urethane", detail: "Apply two coats of high-performance polyaspartic or urethane topcoat for UV stability, chemical resistance, and wear protection." },
    { label: "Cove base installation", detail: "Install epoxy cove base at perimeter walls where specified.", conditional: "coving" },
    { label: "Final walk-through inspection", detail: "Conduct a final walk-through inspection with the customer to confirm finish quality, color match, and surface integrity." },
  ],
  "Polished Concrete": [
    { label: "Concrete surface preparation", detail: "Diamond grind the existing concrete substrate to remove existing coatings, adhesives, oil, and contaminants." },
    { label: "Crack and surface repair", detail: "Fill all cracks, spalls, and surface defects with polyurea repair material. Grind flush after cure.", conditional: "cracks" },
    { label: "Metal-bond diamond grinding", detail: "Progressive metal-bond diamond grinding from coarse to fine grits (30/70/120 grit) to refine the surface." },
    { label: "Densifier application", detail: "Apply lithium silicate densifier to the ground surface to harden and densify the concrete." },
    { label: "Resin-bond diamond polishing", detail: "Progressive resin-bond diamond polishing from 100/200/400/800/1500/3000 grit to achieve the specified level of gloss." },
    { label: "Joint filler", detail: "Fill all control joints and construction joints with semi-rigid polyurea joint filler, then shave flush.", conditional: "joints" },
    { label: "Stain protection (optional)", detail: "Apply a stain protection guard to resist oil, water, and chemical penetration.", conditional: "perimeter" },
    { label: "Burnishing", detail: "Burnish the surface with a high-speed propane buffer to achieve maximum gloss and clarity." },
    { label: "Final walk-through inspection", detail: "Conduct a final walk-through inspection with the customer to confirm finish quality and gloss level." },
  ],
  "Stained Concrete": [
    { label: "Concrete surface preparation", detail: "Diamond grind or clean the existing concrete substrate to remove existing coatings, adhesives, and contaminants." },
    { label: "Crack and surface repair", detail: "Fill all cracks and surface defects with repair material. Grind flush.", conditional: "cracks" },
    { label: "Acid or dye stain application", detail: "Apply the selected acid-based or acetone dye stain in the chosen color(s). Allow to react and dry." },
    { label: "Neutralization (acid stains)", detail: "Neutralize the surface with ammonia and water to stop the acid reaction. Rinse and allow to dry." },
    { label: "Sealer application", detail: "Apply a high-performance acrylic, urethane, or epoxy sealer to protect the stained surface." },
    { label: "Joint filler", detail: "Fill all control joints with semi-rigid joint filler.", conditional: "joints" },
    { label: "Final walk-through inspection", detail: "Conduct a final walk-through inspection with the customer to confirm color and finish." },
  ],
  "Quartz System": [
    { label: "Concrete surface preparation", detail: "Diamond grind the existing concrete substrate to remove existing coatings, adhesives, oil, and contaminants." },
    { label: "Crack and surface repair", detail: "Fill all cracks, spalls, and surface defects with epoxy repair mortar.", conditional: "cracks" },
    { label: "Moisture mitigation", detail: "Apply a moisture vapor barrier primer if testing indicates elevated moisture.", conditional: "moisture" },
    { label: "Prime coat", detail: "Apply a penetrating epoxy primer / bond coat to the prepared substrate." },
    { label: "Epoxy base coat with quartz broadcast", detail: "Apply 100% solids epoxy base coat and broadcast the selected colored quartz to refusal. Allow to cure." },
    { label: "Excess quartz removal", detail: "Scrape and vacuum excess quartz to create a uniform textured surface." },
    { label: "Joint filler", detail: "Fill all control joints with semi-rigid joint filler.", conditional: "joints" },
    { label: "Topcoat — polyaspartic / urethane", detail: "Apply two coats of high-performance polyaspartic or urethane topcoat for chemical resistance and wear protection." },
    { label: "Cove base installation", detail: "Install epoxy cove base at perimeter walls where specified.", conditional: "coving" },
    { label: "Final walk-through inspection", detail: "Conduct a final walk-through inspection with the customer to confirm finish quality and texture." },
  ],
  "Solid Epoxy": [
    { label: "Concrete surface preparation", detail: "Diamond grind the existing concrete substrate to remove existing coatings, adhesives, oil, and contaminants." },
    { label: "Crack and surface repair", detail: "Fill all cracks and surface defects with epoxy repair mortar.", conditional: "cracks" },
    { label: "Prime coat", detail: "Apply a penetrating epoxy primer / bond coat to the prepared substrate." },
    { label: "Solid color epoxy base coat", detail: "Apply 100% solids solid-color epoxy base coat (10–15 mils) in the selected color." },
    { label: "Joint filler", detail: "Fill all control joints with semi-rigid joint filler.", conditional: "joints" },
    { label: "Topcoat — polyaspartic / urethane", detail: "Apply two coats of high-performance polyaspartic or urethane topcoat for UV stability and wear protection." },
    { label: "Cove base installation", detail: "Install epoxy cove base at perimeter walls where specified.", conditional: "coving" },
    { label: "Final walk-through inspection", detail: "Conduct a final walk-through inspection with the customer to confirm color and finish." },
  ],
  "Glitter Epoxy": [
    { label: "Concrete surface preparation", detail: "Diamond grind the existing concrete substrate to remove existing coatings, adhesives, oil, and contaminants." },
    { label: "Crack and surface repair", detail: "Fill all cracks and surface defects with epoxy repair mortar.", conditional: "cracks" },
    { label: "Prime coat", detail: "Apply a penetrating epoxy primer / bond coat to the prepared substrate." },
    { label: "Epoxy base coat with glitter", detail: "Apply 100% solids epoxy base coat with the selected glitter additive for a sparkling, reflective finish." },
    { label: "Joint filler", detail: "Fill all control joints with semi-rigid joint filler.", conditional: "joints" },
    { label: "Topcoat — polyaspartic / urethane", detail: "Apply two coats of high-performance polyaspartic or urethane topcoat for UV stability and wear protection." },
    { label: "Final walk-through inspection", detail: "Conduct a final walk-through inspection with the customer to confirm sparkle effect and finish." },
  ],
  "Joint Fill & Repair": [
    { label: "Joint cleaning and preparation", detail: "Clean and rout all control joints and construction joints to remove debris and create a clean bonding surface." },
    { label: "Crack repair", detail: "Fill all cracks with polyurea or epoxy crack repair material.", conditional: "cracks" },
    { label: "Joint filler application", detail: "Fill all control joints and construction joints with semi-rigid polyurea or epoxy joint filler." },
    { label: "Shave and grind flush", detail: "Shave excess filler and grind flush with the surrounding concrete surface." },
    { label: "Final walk-through inspection", detail: "Conduct a final walk-through inspection with the customer to confirm joint fill quality." },
  ],
  "Concrete Overlayment": [
    { label: "Concrete surface preparation", detail: "Diamond grind or shotblast the existing concrete substrate to remove contaminants and open the surface." },
    { label: "Crack and surface repair", detail: "Fill all cracks and surface defects with repair material.", conditional: "cracks" },
    { label: "Primer application", detail: "Apply a bonding primer to the prepared substrate." },
    { label: "Overlay application", detail: "Apply the selected cementitious or polymer-modified overlay to the specified thickness." },
    { label: "Texture or trowel finish", detail: "Apply the specified texture or trowel finish to the overlay surface." },
    { label: "Sealer application", detail: "Apply a high-performance sealer to protect the overlay surface." },
    { label: "Final walk-through inspection", detail: "Conduct a final walk-through inspection with the customer to confirm finish quality." },
  ],
  "Sealed Concrete": [
    { label: "Concrete surface preparation", detail: "Clean the existing concrete substrate to remove contaminants, oil, and debris." },
    { label: "Crack and surface repair", detail: "Fill all cracks and surface defects with repair material.", conditional: "cracks" },
    { label: "Sealer application", detail: "Apply a high-performance acrylic, urethane, or epoxy sealer to protect the concrete surface." },
    { label: "Final walk-through inspection", detail: "Conduct a final walk-through inspection with the customer to confirm sealer coverage and finish." },
  ],
};

// Generate specs for a floor type, filtering by conditional options
export function generateSpecs(floorType, opts = {}) {
  const specs = FLOOR_SPECS[floorType] || FLOOR_SPECS["Metallic Epoxy"];
  return specs.filter(spec => {
    if (!spec.conditional) return true;
    if (spec.conditional === "cracks") return opts.has_cracks || (Number(opts.linear_feet_cracks) > 0);
    if (spec.conditional === "moisture") return opts.needs_moisture_mitigation;
    if (spec.conditional === "joints") return opts.has_joints || (Number(opts.linear_feet_joints) > 0);
    if (spec.conditional === "coving") return opts.has_coving || (Number(opts.linear_feet_coving) > 0);
    if (spec.conditional === "perimeter") return true; // always include perimeter protection
    return true;
  });
}

// Convert specs array to text for display/proposal
export function specsToText(specs) {
  return specs.map((s, i) => `${i + 1}. ${s.label}: ${s.detail}`).join("\n");
}