// ============================================================
// Ultra High Quality Website Template Library
// ============================================================
// Each template is a complete website blueprint: layout sections,
// color palette, typography, content structure, image style, and
// industry-specific copy. Templates are applied to any city +
// business name combination during mass production.
//
// Templates use placeholders: {city}, {business_name}, {phone},
// {email}, {tagline} — filled at generation time.
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

  // ── 2. ROOFING AUTHORITY — roofing contractor ──
  {
    id: 'roofing-authority',
    name: 'Roofing Authority',
    industry: 'roofing',
    description: 'Roofing contractor with storm damage focus, materials showcase, process timeline, reviews, and financing.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_rooftop',
      'services_4col',
      'materials_showcase',
      'process_timeline',
      'storm_damage_panel',
      'reviews_grid',
      'service_area_map',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#1A1A2E',
      accent: '#E94560',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Poppins', sans-serif",
      body: "'Inter', sans-serif",
      heading_weight: 700,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "{city}'s Trusted Roofing Experts",
        subtext: "Storm damage? Leaks? Need a full replacement? We deliver roofs built to last decades — not years.",
        badges: ['GAF Certified', 'Free Inspections', 'Insurance Claims', '25-Year Warranty']
      },
      services: [
        { icon: 'replacement', title: 'Roof Replacement', desc: 'Complete tear-off and new roof installation' },
        { icon: 'repair', title: 'Roof Repair', desc: 'Leak detection, patching, and targeted repairs' },
        { icon: 'storm', title: 'Storm Damage', desc: 'Insurance claim assistance and storm restoration' },
        { icon: 'inspection', title: 'Inspections', desc: 'Free 27-point roof health inspections' }
      ],
      materials: ['Architectural Shingles', 'Metal Roofing', 'Tile Roofing', 'Flat/TPO', 'Cedar Shake'],
      process: ['Free Inspection', 'Detailed Report', 'Insurance Coordination', 'Expert Installation', 'Final Walkthrough']
    },
    image_style: 'rooftop aerial shots, shingle textures, storm clouds, professional contractor photography'
  },

  // ── 3. HVAC PROS — heating & cooling ──
  {
    id: 'hvac-pros',
    name: 'HVAC Pros',
    industry: 'hvac',
    description: 'HVAC company with 24/7 emergency focus, service plans, equipment brands, and maintenance scheduling.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_technician',
      'services_4col',
      'brands_strip',
      'service_plans',
      'emergency_banner',
      'reviews_carousel',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#0F2027',
      accent: '#00D9C0',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Montserrat', sans-serif",
      body: "'Open Sans', sans-serif",
      heading_weight: 700,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "24/7 HVAC Service in {city}",
        subtext: "Fast, reliable heating and cooling. Licensed technicians, upfront pricing, and same-day service available.",
        badges: ['24/7 Emergency', 'Same-Day Service', 'Licensed Techs', 'Upfront Pricing']
      },
      services: [
        { icon: 'ac', title: 'AC Repair & Install', desc: 'Central air, mini-splits, and ductless systems' },
        { icon: 'heating', title: 'Heating Services', desc: 'Furnaces, heat pumps, and boiler repair' },
        { icon: 'maintenance', title: 'Maintenance Plans', desc: 'Annual tune-ups and priority service' },
        { icon: 'emergency', title: 'Emergency Service', desc: '24/7 emergency HVAC repair' }
      ],
      brands: ['Carrier', 'Trane', 'Lennox', 'Ruud', 'Goodman'],
      plans: [
        { name: 'Basic', price: '$15/mo', features: ['Annual tune-up', '15% repair discount'] },
        { name: 'Plus', price: '$25/mo', features: ['2 tune-ups', '20% discount', 'Priority service'] },
        { name: 'Premium', price: '$40/mo', features: ['Unlimited tune-ups', '30% discount', 'Same-day priority'] }
      ]
    },
    image_style: 'HVAC units, technician working, modern home exteriors, clean professional photography'
  },

  // ── 4. PLUMBING MASTERS — plumbing contractor ──
  {
    id: 'plumbing-masters',
    name: 'Plumbing Masters',
    industry: 'plumbing',
    description: 'Plumbing company with emergency focus, service grid, water heater specialization, and trenchless tech.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_bathroom',
      'services_5col',
      'specialty_panel',
      'process_steps',
      'emergency_banner',
      'reviews_grid',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#1B2838',
      accent: '#3B82F6',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Roboto', sans-serif",
      body: "'Open Sans', sans-serif",
      heading_weight: 700,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "{city}'s Plumbing Experts",
        subtext: "From leaky faucets to full repipes. Licensed, insured, and available 24/7 for emergencies.",
        badges: ['Licensed & Insured', '24/7 Emergency', 'Upfront Pricing', '100% Guarantee']
      },
      services: [
        { icon: 'leak', title: 'Leak Detection', desc: 'Advanced leak detection and repair' },
        { icon: 'waterheater', title: 'Water Heaters', desc: 'Tankless and traditional installation' },
        { icon: 'drain', title: 'Drain Cleaning', desc: 'Hydro-jetting and snaking services' },
        { icon: 'repipe', title: 'Repiping', desc: 'Whole-home repipe specialists' },
        { icon: 'trenchless', title: 'Trenchless Sewer', desc: 'No-dig sewer line repair' }
      ],
      specialty: 'Trenchless technology — fix your sewer line without destroying your yard.'
    },
    image_style: 'modern bathrooms, plumbing fixtures, clean professional photography, blue tones'
  },

  // ── 5. LANDSCAPE LUXE — landscaping & design ──
  {
    id: 'landscape-luxe',
    name: 'Landscape Luxe',
    industry: 'landscaping',
    description: 'High-end landscaping with portfolio gallery, design process, seasonal services, and outdoor living.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_garden',
      'services_4col',
      'portfolio_gallery',
      'design_process',
      'seasonal_services',
      'testimonials',
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
        headline: "Luxury Landscaping in {city}",
        subtext: "Transform your outdoor space into a masterpiece. Custom design, professional installation, year-round maintenance.",
        badges: ['Award-Winning', 'Free Consultation', 'Licensed', '5-Star Rated']
      },
      services: [
        { icon: 'design', title: 'Landscape Design', desc: 'Custom 3D design and planning' },
        { icon: 'hardscape', title: 'Hardscaping', desc: 'Patios, walkways, retaining walls' },
        { icon: 'maintenance', title: 'Maintenance', desc: 'Weekly and seasonal maintenance' },
        { icon: 'lighting', title: 'Outdoor Lighting', desc: 'Landscape lighting design and install' }
      ],
      portfolio: ['Modern Patio', 'Desert Oasis', 'Pool Surround', 'Front Yard Makeover', 'Fire Pit Lounge', 'Garden Path']
    },
    image_style: 'lush gardens, outdoor living spaces, professional landscape photography, golden hour lighting'
  },

  // ── 6. SOLAR SAVVY — solar installation ──
  {
    id: 'solar-savvy',
    name: 'Solar Savvy',
    industry: 'solar',
    description: 'Solar company with savings calculator, panel showcase, battery storage, and tax credit focus.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_solar',
      'savings_calculator',
      'services_4col',
      'panel_showcase',
      'battery_storage',
      'reviews_carousel',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#0A1A2F',
      accent: '#FFB627',
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
        headline: "Go Solar in {city} — Save 70% on Energy",
        subtext: "Premium solar panels, battery storage, and expert installation. $0 down options available. Lock in your energy rate today.",
        badges: ['30% Tax Credit', '$0 Down Options', '25-Year Warranty', 'Free Quote']
      },
      services: [
        { icon: 'panels', title: 'Solar Panels', desc: 'High-efficiency panel installation' },
        { icon: 'battery', title: 'Battery Storage', desc: 'Tesla Powerwall and Enphase batteries' },
        { icon: 'monitoring', title: 'Monitoring', desc: '24/7 system monitoring and alerts' },
        { icon: 'maintenance', title: 'Maintenance', desc: 'Panel cleaning and system service' }
      ],
      panels: ['Tesla', 'SunPower', 'LG', 'Panasonic', 'REC', 'Q Cells']
    },
    image_style: 'solar panels on modern homes, blue sky, clean energy photography, bright and optimistic'
  },

  // ── 7. CONCRETE KINGS — concrete & paving ──
  {
    id: 'concrete-kings',
    name: 'Concrete Kings',
    industry: 'concrete',
    description: 'Concrete contractor with driveway focus, stamped concrete, commercial paving, and project gallery.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_driveway',
      'services_5col',
      'stamped_showcase',
      'project_gallery',
      'process_steps',
      'reviews_grid',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#2D2D2D',
      accent: '#FF6B35',
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
        headline: "{city}'s Concrete Specialists",
        subtext: "Driveways, patios, foundations, and commercial paving. Built to last, finished to impress.",
        badges: ['Licensed & Bonded', 'Free Estimates', '20-Year Warranty', 'Stamped Concrete']
      },
      services: [
        { icon: 'driveway', title: 'Driveways', desc: 'New driveways and resurfacing' },
        { icon: 'patio', title: 'Patios', desc: 'Stamped and stained concrete patios' },
        { icon: 'foundation', title: 'Foundations', desc: 'Residential and commercial foundations' },
        { icon: 'commercial', title: 'Commercial Paving', desc: 'Parking lots and commercial slabs' },
        { icon: 'repair', title: 'Repairs', desc: 'Crack repair and concrete leveling' }
      ],
      stamped: ['Ashlar Slate', 'London Cobble', 'Random Stone', 'Herringbone Brick', 'Wood Plank', 'Seamless Texture']
    },
    image_style: 'stamped concrete driveways, patios, professional construction photography, warm tones'
  },

  // ── 8. FENCE MASTERS — fencing contractor ──
  {
    id: 'fence-masters',
    name: 'Fence Masters',
    industry: 'fencing',
    description: 'Fencing company with material options, gallery, installation process, and warranty focus.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_fence',
      'services_4col',
      'materials_showcase',
      'gallery_grid',
      'process_steps',
      'reviews_carousel',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#2C3E50',
      accent: '#27AE60',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Raleway', sans-serif",
      body: "'Inter', sans-serif",
      heading_weight: 700,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "Premium Fencing in {city}",
        subtext: "Wood, vinyl, chain-link, and ornamental iron. Expert installation with a 10-year warranty.",
        badges: ['10-Year Warranty', 'Free Estimates', 'Licensed', '1-Day Install']
      },
      services: [
        { icon: 'wood', title: 'Wood Fencing', desc: 'Cedar, redwood, and pressure-treated' },
        { icon: 'vinyl', title: 'Vinyl Fencing', desc: 'Low-maintenance vinyl in all styles' },
        { icon: 'chain', title: 'Chain Link', desc: 'Galvanized and coated chain link' },
        { icon: 'iron', title: 'Ornamental Iron', desc: 'Decorative iron and aluminum fencing' }
      ],
      materials: ['Privacy Wood', 'Semi-Private', 'Picket', 'Ranch Rail', 'Chain Link', 'Wrought Iron']
    },
    image_style: 'fence installations, property boundaries, professional photography, natural settings'
  },

  // ── 9. PAINT PERFECTION — painting contractor ──
  {
    id: 'paint-perfection',
    name: 'Paint Perfection',
    industry: 'painting',
    description: 'Painting company with interior/exterior, color palette showcase, process, and before/after gallery.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_painted',
      'services_4col',
      'color_palette',
      'before_after_gallery',
      'process_steps',
      'reviews_grid',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#F5F5F5',
      accent: '#2196F3',
      text: '#333333'
    },
    typography: {
      heading: "'Poppins', sans-serif",
      body: "'Inter', sans-serif",
      heading_weight: 600,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "Professional Painting in {city}",
        subtext: "Interior and exterior painting that transforms your space. Clean, fast, and guaranteed.",
        badges: ['5-Year Warranty', 'Free Color Consult', 'Licensed', 'Insured']
      },
      services: [
        { icon: 'interior', title: 'Interior Painting', desc: 'Walls, ceilings, trim, and cabinets' },
        { icon: 'exterior', title: 'Exterior Painting', desc: 'Siding, stucco, and trim painting' },
        { icon: 'commercial', title: 'Commercial', desc: 'Office and retail painting services' },
        { icon: 'cabinet', title: 'Cabinet Refinishing', desc: 'Cabinet painting and refinishing' }
      ],
      palette: ['Modern Gray', 'Coastal Blue', 'Warm White', 'Sage Green', 'Navy Accent', 'Earthy Tan']
    },
    image_style: 'freshly painted rooms, color swatches, professional painting photography, bright and clean'
  },

  // ── 10. CLEAN SWIPE — cleaning service ──
  {
    id: 'clean-swipe',
    name: 'Clean Swipe',
    industry: 'cleaning',
    description: 'Cleaning service with residential/commercial focus, pricing tiers, booking flow, and satisfaction guarantee.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_clean',
      'services_4col',
      'pricing_tiers',
      'process_steps',
      'satisfaction_guarantee',
      'reviews_carousel',
      'service_area_cities',
      'booking_cta',
      'footer_4col'
    ],
    default_colors: {
      background: '#E8F5E9',
      accent: '#00BCD4',
      text: '#1B5E20'
    },
    typography: {
      heading: "'Quicksand', sans-serif",
      body: "'Inter', sans-serif",
      heading_weight: 700,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "{city}'s #1 Cleaning Service",
        subtext: "Professional home and office cleaning. Background-checked teams, eco-friendly products, 100% satisfaction guarantee.",
        badges: ['100% Guarantee', 'Eco-Friendly', 'Bonded & Insured', 'Online Booking']
      },
      services: [
        { icon: 'home', title: 'Home Cleaning', desc: 'Weekly, bi-weekly, and monthly service' },
        { icon: 'office', title: 'Office Cleaning', desc: 'Commercial cleaning and janitorial' },
        { icon: 'deep', title: 'Deep Cleaning', desc: 'Top-to-bottom deep clean service' },
        { icon: 'move', title: 'Move In/Out', desc: 'Move-in and move-out cleaning' }
      ],
      tiers: [
        { name: 'Basic', price: '$99', desc: '1 bed / 1 bath' },
        { name: 'Standard', price: '$149', desc: '2 bed / 2 bath' },
        { name: 'Deep', price: '$249', desc: '3+ bed / deep clean' }
      ]
    },
    image_style: 'spotless clean homes, cleaning supplies, professional cleaning photography, bright and fresh'
  },

  // ── 11. AUTO DETAIL ELITE — auto detailing ──
  {
    id: 'auto-detail-elite',
    name: 'Auto Detail Elite',
    industry: 'auto_detailing',
    description: 'Auto detailing with ceramic coating focus, service packages, before/after, and mobile service.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_car',
      'services_4col',
      'ceramic_coating_panel',
      'pricing_packages',
      'before_after_gallery',
      'reviews_carousel',
      'service_area_cities',
      'booking_cta',
      'footer_4col'
    ],
    default_colors: {
      background: '#0D0D0D',
      accent: '#FFD700',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Bebas Neue', sans-serif",
      body: "'Inter', sans-serif",
      heading_weight: 700,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "Premium Auto Detailing in {city}",
        subtext: "Ceramic coatings, paint correction, and full-service detailing. Mobile service available.",
        badges: ['Ceramic Coating', 'Mobile Service', '5-Star Rated', 'Guaranteed Results']
      },
      services: [
        { icon: 'ceramic', title: 'Ceramic Coating', desc: '5-year ceramic paint protection' },
        { icon: 'detail', title: 'Full Detail', desc: 'Interior and exterior detailing' },
        { icon: 'correction', title: 'Paint Correction', desc: 'Swirl and scratch removal' },
        { icon: 'interior', title: 'Interior Detail', desc: 'Deep clean and conditioning' }
      ],
      packages: [
        { name: 'Express', price: '$79', desc: 'Wash, wax, vacuum' },
        { name: 'Premium', price: '$199', desc: 'Full detail + clay bar' },
        { name: 'Ceramic', price: '$599', desc: 'Ceramic coating + correction' }
      ]
    },
    image_style: 'luxury cars, detailing process, glossy paint, professional automotive photography'
  },

  // ── 12. TREE CARE PROS — tree service ──
  {
    id: 'tree-care-pros',
    name: 'Tree Care Pros',
    industry: 'tree_service',
    description: 'Tree service with removal focus, trimming, stump grinding, emergency storm service, and certified arborists.',
    premium_tier: 'ultra',
    layout: [
      'sticky_header',
      'hero_fullscreen_tree',
      'services_5col',
      'certified_arborist_panel',
      'process_steps',
      'emergency_banner',
      'reviews_grid',
      'service_area_cities',
      'financing_panel',
      'footer_4col'
    ],
    default_colors: {
      background: '#1B3A1B',
      accent: '#8BC34A',
      text: '#FFFFFF'
    },
    typography: {
      heading: "'Merriweather', serif",
      body: "'Inter', sans-serif",
      heading_weight: 700,
      body_weight: 400
    },
    content_structure: {
      hero: {
        headline: "Expert Tree Service in {city}",
        subtext: "Tree removal, trimming, and stump grinding by certified arborists. Fully insured, 24/7 emergency response.",
        badges: ['Certified Arborist', 'Fully Insured', '24/7 Emergency', 'Free Estimates']
      },
      services: [
        { icon: 'removal', title: 'Tree Removal', desc: 'Safe and complete tree removal' },
        { icon: 'trimming', title: 'Tree Trimming', desc: 'Pruning and canopy shaping' },
        { icon: 'stump', title: 'Stump Grinding', desc: 'Stump removal and grinding' },
        { icon: 'emergency', title: 'Emergency Service', desc: '24/7 storm damage response' },
        { icon: 'health', title: 'Tree Health', desc: 'Disease diagnosis and treatment' }
      ]
    },
    image_style: 'tree care, arborists at work, professional tree service photography, natural green settings'
  }
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