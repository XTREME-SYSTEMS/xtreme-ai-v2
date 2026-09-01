// seedSources.ts — The seeded source library for the lead engine.
// 20+ sources across Facebook groups, Craigslist cities, Reddit,
// building department portals, and company directories. These are
// seeded on first run by the seedLeadSources backend function so the
// system has real sources to scrape immediately.
//
// Each source is keyed by client_email (the client who owns it). The
// seeder creates these for the admin/owner account by default; clients
// get their own set when they join.

export interface SeedSource {
  source_type: 'facebook_group' | 'craigslist' | 'reddit' | 'building_dept' | 'company_directory' | 'google_maps' | 'yelp' | 'custom';
  source_name: string;
  source_url: string;
  location: string;
  service_keywords: string[];
  scrape_frequency: 'daily' | 'weekly' | 'monthly';
  auth_required?: boolean;
}

// Default service keywords for concrete/epoxy flooring contractors
const DEFAULT_KEYWORDS = [
  'epoxy flooring', 'garage floor', 'polished concrete', 'decorative concrete',
  'concrete countertop', 'driveway', 'patio', 'concrete leveling',
  'concrete resurfacing', 'stamped concrete',
];

// Texas markets (primary service area)
export const TEXAS_SOURCES: SeedSource[] = [
  // Facebook groups — DFW
  { source_type: 'facebook_group', source_name: 'DFW Epoxy & Concrete Flooring', source_url: 'https://www.facebook.com/groups/dfw-epoxy-concrete', location: 'Dallas-Fort Worth, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  { source_type: 'facebook_group', source_name: 'Dallas Homeowners & Remodeling', source_url: 'https://www.facebook.com/groups/dallas-homeowners', location: 'Dallas, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  { source_type: 'facebook_group', source_name: 'Fort Worth Community Board', source_url: 'https://www.facebook.com/groups/fort-worth-community', location: 'Fort Worth, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  { source_type: 'facebook_group', source_name: 'DFW Contractors & Subs', source_url: 'https://www.facebook.com/groups/dfw-contractors-subs', location: 'Dallas-Fort Worth, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'weekly', auth_required: true },
  // Facebook groups — Austin
  { source_type: 'facebook_group', source_name: 'Austin Home Improvement & Remodeling', source_url: 'https://www.facebook.com/groups/austin-home-improvement', location: 'Austin, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  { source_type: 'facebook_group', source_name: 'Austin Concrete & Flooring', source_url: 'https://www.facebook.com/groups/austin-concrete-flooring', location: 'Austin, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  // Facebook groups — Houston
  { source_type: 'facebook_group', source_name: 'Houston Homeowners Network', source_url: 'https://www.facebook.com/groups/houston-homeowners', location: 'Houston, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  { source_type: 'facebook_group', source_name: 'Houston Contractors Referrals', source_url: 'https://www.facebook.com/groups/houston-contractor-referrals', location: 'Houston, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'weekly', auth_required: true },
  // Facebook groups — San Antonio
  { source_type: 'facebook_group', source_name: 'San Antonio Home & Garden', source_url: 'https://www.facebook.com/groups/san-antonio-home-garden', location: 'San Antonio, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },

  // Craigslist — services wanted + gigs
  { source_type: 'craigslist', source_name: 'Dallas Craigslist — Services Wanted', source_url: 'https://dallas.craigslist.org/d/contractors/search/crs', location: 'Dallas, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  { source_type: 'craigslist', source_name: 'Austin Craigslist — Services Wanted', source_url: 'https://austin.craigslist.org/d/contractors/search/crs', location: 'Austin, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  { source_type: 'craigslist', source_name: 'Houston Craigslist — Services Wanted', source_url: 'houston.craigslist.org/d/contractors/search/crs', location: 'Houston, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  { source_type: 'craigslist', source_name: 'DFW Craigslist — Gigs / Labor', source_url: 'https://dallas.craigslist.org/d/gigs/search/crg', location: 'Dallas-Fort Worth, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },

  // Reddit
  { source_type: 'reddit', source_name: 'r/HomeImprovement', source_url: 'https://www.reddit.com/r/HomeImprovement/new/', location: 'National', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  { source_type: 'reddit', source_name: 'r/Concrete', source_url: 'https://www.reddit.com/r/Concrete/new/', location: 'National', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'daily' },
  { source_type: 'reddit', source_name: 'r/Dallas', source_url: 'https://www.reddit.com/r/Dallas/new/', location: 'Dallas, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'weekly' },
  { source_type: 'reddit', source_name: 'r/Austin', source_url: 'https://www.reddit.com/r/Austin/new/', location: 'Austin, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'weekly' },

  // Building department portals (permit discovery)
  { source_type: 'building_dept', source_name: 'City of Dallas — Building Permits', source_url: 'https://www.dallascityhall.com/departments/sustainabledevelopment/buildingpermits/Pages/default.aspx', location: 'Dallas, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'weekly' },
  { source_type: 'building_dept', source_name: 'City of Austin — Building Permits', source_url: 'https://www.austintexas.gov/department/development-permits', location: 'Austin, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'weekly' },
  { source_type: 'building_dept', source_name: 'City of Houston — Permits', source_url: 'https://www.houstontx.gov/planning/Permits/', location: 'Houston, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'weekly' },

  // Company directories (B2B — find contractors/partners)
  { source_type: 'company_directory', source_name: 'Angi — Concrete Contractors DFW', source_url: 'https://www.angi.com/catalog/concrete-contractors/TX/Dallas/', location: 'Dallas-Fort Worth, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'monthly' },
  { source_type: 'company_directory', source_name: 'Houzz — Concrete Pros Texas', source_url: 'https://www.houzz.com/professionals/concrete-contractors/c/Texas', location: 'Texas', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'monthly' },
  { source_type: 'google_maps', source_name: 'Google Maps — General Contractors DFW', source_url: 'https://www.google.com/maps/search/general+contractors+Dallas+TX', location: 'Dallas-Fort Worth, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'monthly' },
  { source_type: 'google_maps', source_name: 'Google Maps — Home Builders Austin', source_url: 'https://www.google.com/maps/search/home+builders+Austin+TX', location: 'Austin, TX', service_keywords: DEFAULT_KEYWORDS, scrape_frequency: 'monthly' },
];

export const ALL_SEED_SOURCES = TEXAS_SOURCES;