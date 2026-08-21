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

export const INDUSTRIES = [
  {
    id: "home_services",
    label: "Home Services & Contracting",
    icon: "🏠",
    subIndustries: [
      "Epoxy Flooring", "Roofing", "HVAC", "Plumbing", "Electrical", "Landscaping",
      "Painting", "Concrete & Masonry", "Fencing", "Garage Doors", "Windows & Doors",
      "Flooring", "Kitchen & Bath Remodeling", "Solar Installation", "Pest Control",
      "Cleaning Services", "Handyman Services", "Drywall", "Insulation", "Siding",
      "Gutter Services", "Deck Building", "Pool & Spa",
    ],
  },
  {
    id: "construction",
    label: "Construction & Trades",
    icon: "🏗️",
    subIndustries: [
      "General Contracting", "Custom Home Building", "Commercial Construction",
      "Renovation & Remodeling", "Demolition", "Excavation", "Welding & Metalwork",
      "Carpentry", "Steel Erection", "Roofing (Commercial)", "Concrete (Commercial)",
      "Drywall (Commercial)", "Fireproofing", "Pre-Construction",
    ],
  },
  {
    id: "health_wellness",
    label: "Health & Wellness",
    icon: "⚕️",
    subIndustries: [
      "Dental Practice", "Medical Practice", "Chiropractic", "Physical Therapy",
      "Fitness / Gym", "Yoga Studio", "Spa", "Med Spa / Aesthetics", "Mental Health / Counseling",
      "Nutrition Coaching", "Massage Therapy", "Acupuncture", "Wellness Center",
    ],
  },
  {
    id: "food_beverage",
    label: "Food & Beverage",
    icon: "🍽️",
    subIndustries: [
      "Restaurant", "Catering", "Food Truck", "Bakery", "Coffee Shop", "Bar / Pub",
      "Meal Prep Service", "Juice Bar", "Ice Cream Shop", "Brewery / Winery",
    ],
  },
  {
    id: "automotive",
    label: "Automotive",
    icon: "🚗",
    subIndustries: [
      "Auto Repair", "Auto Body Shop", "Car Wash", "Detailing", "Tires", "Oil Change",
      "Towing", "Dealership", "Parts Store", "Window Tinting", "Paintless Dent Repair",
      "Transmission", "Brake Service",
    ],
  },
  {
    id: "beauty_personal",
    label: "Beauty & Personal Care",
    icon: "💅",
    subIndustries: [
      "Hair Salon", "Barber Shop", "Nail Salon", "Esthetics / Waxing", "Tattoo Studio",
      "Makeup Artist", "Lash Studio", "Piercing", "Tanning Salon",
    ],
  },
  {
    id: "professional_services",
    label: "Professional Services",
    icon: "💼",
    subIndustries: [
      "Law Firm", "Accounting / Tax", "Insurance Agency", "Real Estate Brokerage",
      "Property Management", "Business Consulting", "Marketing Agency", "Financial Planning",
      "Notary Services", "Architect", "Engineering Firm",
    ],
  },
  {
    id: "retail_ecommerce",
    label: "Retail & E-commerce",
    icon: "🛍️",
    subIndustries: [
      "Apparel & Fashion", "Electronics", "Home Goods", "Specialty Shop", "Online Store",
      "Subscription Box", "Dropshipping", "Furniture", "Sporting Goods", "Gift Shop",
    ],
  },
  {
    id: "education_training",
    label: "Education & Training",
    icon: "🎓",
    subIndustries: [
      "Tutoring", "Music Lessons", "Driving School", "Trade School", "Online Courses",
      "Coaching", "Workshops & Seminars", "Language School", "Test Prep",
    ],
  },
  {
    id: "transportation",
    label: "Transportation & Logistics",
    icon: "🚚",
    subIndustries: [
      "Moving Company", "Freight & Trucking", "Delivery Service", "Chauffeur / Limo",
      "Airport Shuttle", "Storage Units", "Warehouse & Fulfillment", "Courier Service",
    ],
  },
  {
    id: "travel_hospitality",
    label: "Travel & Hospitality",
    icon: "✈️",
    subIndustries: [
      "Hotel", "Bed & Breakfast", "Vacation Rental", "Travel Agency", "Tour Guide",
      "Event Venue", "Restaurant Group",
    ],
  },
  {
    id: "events_entertainment",
    label: "Events & Entertainment",
    icon: "🎉",
    subIndustries: [
      "Event Planning", "DJ / MC", "Photography", "Videography", "Party Rentals",
      "Band / Musician", "Magician / Performer", "Lighting & AV", "Photo Booth",
    ],
  },
  {
    id: "technology_saas",
    label: "Technology & SaaS",
    icon: "💻",
    subIndustries: [
      "Software Development", "SaaS Product", "IT Services", "Cybersecurity",
      "Web Design Agency", "App Development", "Data Analytics", "AI / ML Services",
      "Cloud Services", "Tech Consulting",
    ],
  },
  {
    id: "agriculture",
    label: "Agriculture & Farming",
    icon: "🌾",
    subIndustries: [
      "Crop Farming", "Livestock", "Dairy", "Organic Farming", "Agricultural Equipment",
      "Nursery / Garden Center", "Hydroponics", "Farm-to-Table",
    ],
  },
  {
    id: "manufacturing",
    label: "Manufacturing",
    icon: "🏭",
    subIndustries: [
      "Custom Manufacturing", "3D Printing", "Metal Fabrication", "Woodworking",
      "Textile Manufacturing", "Food Processing", "Packaging", "Plastics",
    ],
  },
  {
    id: "nonprofit",
    label: "Non-profit & Community",
    icon: "🤝",
    subIndustries: [
      "Charity / Foundation", "Religious Organization", "Community Center",
      "Youth Programs", "Animal Rescue", "Food Bank", "Advocacy Group",
    ],
  },
  {
    id: "other",
    label: "Other / Not Listed",
    icon: "📋",
    subIndustries: [],
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