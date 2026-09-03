// ============================================================
// Concrete & Epoxy Website Template Library
// ============================================================
// Focused exclusively on concrete surface preparation niches:
// - Epoxy flooring (residential, commercial, industrial)
// - Polished concrete
// - Decorative concrete (stamped, overlays)
// - Concrete repair & restoration
//
// Each template is a complete website blueprint: layout sections,
// color palette, typography, content structure, image style, and
// industry-specific copy. Templates use placeholders: {city},
// {business_name}, {phone}, {email}, {tagline} — filled at
// generation time.
// ============================================================

export const WEBSITE_TEMPLATES = [
  // ── 1. EPOXY ELITE — premium epoxy flooring ──
  {
    id: 'epoxy-elite',
    name: 'Epoxy Elite',
    industry: 'epoxy_flooring',
    description: 'Premium epoxy flooring company with hero, before/after transformation, color options, reviews, service area, financing, and footer.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_garage',
      'services_5col',
      'transformation_before_after',
      'value_prop_strip',
      'cta_panel_desert',
      'color_options_8swatch',
      'reviews_carousel',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#0A0A0A',
      accent: '#C5A059',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
      heading_weight: 800,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "{city}'s Premier Epoxy Flooring",
        subtext: "Stunning. Durable. Easy to Maintain. Transform your space with high-performance epoxy floors designed for {city} living.",
        badges: ['20-Year Warranty', 'Licensed & Insured', 'Free Quotes', '1-Day Install']
      },
      services: [
        { icon: 'garage', title: 'Garage Floors', desc: 'Premium epoxy coatings for residential garages' },
        { icon: 'patio', title: 'Patios & Decks', desc: 'Weather-resistant outdoor epoxy surfaces' },
        { icon: 'commercial', title: 'Commercial', desc: 'Heavy-duty floors for warehouses and retail' },
        { icon: 'polished', title: 'Polished Concrete', desc: 'Grind-and-seal polished concrete finishes' },
        { icon: 'repair', title: 'Repairs & Resurfacing', desc: 'Crack repair, resurfacing, and restoration' }
      ],
      transformation: {
        heading: 'REAL RESULTS',
        subtext: 'See the dramatic difference our epoxy floors make'
      },
      color_options: ['Charcoal', 'Smoke Gray', 'Midnight Black', 'Desert Tan', 'Saddle Bronze', 'Terrazzo White', 'Metallic Silver', 'Custom Blend'],
      financing: 'Flexible financing available — 0% APR for 12 months. Get approved in minutes.'
    },
    image_style: 'glossy garage floors, before/after, professional photography, dark moody lighting with gold accents'
  },

  // ── 2. POLISHED CONCRETE PRO — polished & sealed concrete ──
  {
    id: 'polished-concrete-pro',
    name: 'Polished Concrete Pro',
    industry: 'polished_concrete',
    description: 'Polished concrete specialist with commercial focus, grind-and-seal process, stain options, and warehouse/retail expertise.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_warehouse',
      'services_4col',
      'process_timeline',
      'stain_options',
      'commercial_gallery',
      'reviews_grid',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#1A1A1A',
      accent: '#3B82F6',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
      heading_weight: 800,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "{city}'s Polished Concrete Experts",
        subtext: "Durable, low-maintenance, and stunning. Commercial-grade polished concrete for warehouses, retail, and modern homes.",
        badges: ['Densified & Polished', 'Commercial Grade', 'Free Quotes', '10-Year Warranty']
      },
      services: [
        { icon: 'warehouse', title: 'Warehouse Floors', desc: 'High-traffic polished concrete for industrial spaces' },
        { icon: 'retail', title: 'Retail & Commercial', desc: 'Polished concrete for stores, restaurants, and offices' },
        { icon: 'residential', title: 'Residential', desc: 'Modern polished concrete for homes and garages' },
        { icon: 'stained', title: 'Stained Concrete', desc: 'Acid and dye-stained polished concrete' }
      ],
      process: ['Surface Prep', 'Metal Bond Grinding', 'Densifier', 'Resin Polishing', 'Burnishing', 'Stain Guard'],
      stains: ['Gray', 'Black', 'Brown', 'Tan', 'Blue', 'Green', 'Red', 'Custom']
    },
    image_style: 'polished concrete warehouse floors, retail spaces, professional photography, clean industrial aesthetic'
  },

  // ── 3. CONCRETE RESTORATION — repair & resurfacing ──
  {
    id: 'concrete-restoration',
    name: 'Concrete Restoration',
    industry: 'concrete_repair',
    description: 'Concrete repair and restoration specialist with crack repair, resurfacing, joint filling, and overlay focus.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_repair',
      'services_5col',
      'process_steps',
      'before_after_gallery',
      'reviews_carousel',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#1B2838',
      accent: '#F59E0B',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Oswald', sans-serif",
      body: "'Inter', sans-serif",
      heading_weight: 700,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "{city}'s Concrete Repair Experts",
        subtext: "Cracks, spalls, joints, and surface damage — we fix it all. Restore your concrete to better-than-new condition.",
        badges: ['Crack Repair', 'Joint Filling', 'Resurfacing', 'Free Inspections']
      },
      services: [
        { icon: 'crack', title: 'Crack Repair', desc: 'Polyurea and epoxy crack repair' },
        { icon: 'joint', title: 'Joint Filling', desc: 'Control joint and construction joint filling' },
        { icon: 'resurface', title: 'Resurfacing', desc: 'Concrete overlays and resurfacing' },
        { icon: 'spall', title: 'Spall Repair', desc: 'Surface defect and pop-out repair' },
        { icon: 'level', title: 'Leveling', desc: 'Concrete leveling and mudjacking' }
      ],
      process: ['Inspection', 'Surface Prep', 'Repair', 'Grind Flush', 'Seal & Protect']
    },
    image_style: 'concrete repair, crack filling, before/after, professional construction photography'
  },

  // ── 4. DECORATIVE CONCRETE — stamped & overlays ──
  {
    id: 'decorative-concrete',
    name: 'Decorative Concrete',
    industry: 'decorative_concrete',
    description: 'Decorative concrete with stamped concrete, overlays, acid staining, and custom design focus for patios, driveways, and interiors.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_patio',
      'services_4col',
      'stamped_patterns',
      'color_palette',
      'project_gallery',
      'reviews_grid',
      'service_area_cities',
      'footer_4col'
    ],
    default_colors: {
      background: '#1C2B1C',
      accent: '#7CB342',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Playfair Display', serif",
      body: "'Lato', sans-serif",
      heading_weight: 700,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "Decorative Concrete in {city}",
        subtext: "Stamped, stained, and overlaid concrete that transforms your space. Custom designs for patios, driveways, and interiors.",
        badges: ['Stamped Concrete', 'Acid Staining', 'Custom Design', 'Free Consultation']
      },
      services: [
        { icon: 'stamped', title: 'Stamped Concrete', desc: 'Stone, brick, and slate patterns' },
        { icon: 'overlay', title: 'Concrete Overlays', desc: 'Thin overlays for resurfacing' },
        { icon: 'stain', title: 'Acid Staining', desc: 'Permanent acid and dye stains' },
        { icon: 'polish', title: 'Polished Concrete', desc: 'Grind-and-polish decorative finishes' }
      ],
      patterns: ['Ashlar Slate', 'London Cobble', 'Random Stone', 'Herringbone Brick', 'Wood Plank', 'Seamless Texture'],
      palette: ['Gray', 'Brown', 'Tan', 'Red', 'Black', 'Custom']
    },
    image_style: 'stamped concrete patios, decorative overlays, professional photography, golden hour lighting'
  },

  // ── 5. COMMERCIAL EPOXY — industrial & commercial ──
  {
    id: 'commercial-epoxy',
    name: 'Commercial Epoxy',
    industry: 'epoxy_flooring',
    description: 'Commercial and industrial epoxy flooring with warehouse focus, chemical resistance, safety flooring, and FDA/USDA compliance.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_industrial',
      'services_4col',
      'system_showcase',
      'safety_features',
      'project_gallery',
      'reviews_grid',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#0D0D0D',
      accent: '#00D9C0',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Montserrat', sans-serif",
      body: "'Inter', sans-serif",
      heading_weight: 800,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "Commercial Epoxy Flooring in {city}",
        subtext: "Industrial-grade epoxy systems for warehouses, manufacturing, food processing, and commercial spaces. Chemical resistant, FDA compliant.",
        badges: ['Chemical Resistant', 'FDA/USDA Compliant', 'Anti-Slip', '10-Year Warranty']
      },
      services: [
        { icon: 'warehouse', title: 'Warehouse Floors', desc: 'High-build epoxy for heavy traffic' },
        { icon: 'food', title: 'Food Processing', desc: 'FDA/USDA compliant epoxy systems' },
        { icon: 'safety', title: 'Safety Flooring', desc: 'Anti-slip and safety-striped floors' },
        { icon: 'chemical', title: 'Chemical Resistant', desc: 'Novolac and vinyl ester systems' }
      ],
      systems: ['Solid Epoxy', 'Quartz System', 'Flake Epoxy', 'ESD Conductive', 'MMA Fast-Cure', 'Polyaspartic']
    },
    image_style: 'industrial warehouse floors, commercial epoxy, professional photography, clean industrial aesthetic'
  },
];

// Helper: get template by ID
export function getTemplateById(id) {
  return WEBSITE_TEMPLATES.find(t => t.id === id);
}

// Helper: get templates by industry
export function getTemplatesByIndustry(industry) {
  return WEBSITE_TEMPLATES.filter(t => t.industry === industry);
}

// Helper: get all industries represented
export function getTemplateIndustries() {
  return [...new Set(WEBSITE_TEMPLATES.map(t => t.industry))];
}