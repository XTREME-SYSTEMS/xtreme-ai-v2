// workbookSeedSources.ts — Expanded seed source library based on the
// Construction AI Growth OS Master Workbook (Sheet 01: Source Registry)
// and the autonomous demand intelligence spec. Covers all source
// categories: home services, social, forums, marketplaces, directories,
// bid boards, permit portals, procurement, property, associations.
//
// The initial registry is a SEED — the recursive discovery engine
// (discoverSourcesRecursive) expands it autonomously.

export interface WorkbookSource {
  category: string;
  source_type: string;
  name: string;
  url: string;
  primary_use: string;
  priority: string; // High, Medium, Low
  geo_coverage: string; // national, or city/state
  service_relevance: string[];
}

export const WORKBOOK_SEED_SOURCES: WorkbookSource[] = [
  // ── Home Services ──────────────────────────────────────────────
  { category: 'directory', source_type: 'company_directory', name: 'Angi', url: 'https://www.angi.com/', primary_use: 'Home-service demand, contractor discovery', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'directory', source_type: 'company_directory', name: 'Thumbtack', url: 'https://www.thumbtack.com/', primary_use: 'Home-service requests and provider discovery', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'directory', source_type: 'company_directory', name: 'Houzz', url: 'https://www.houzz.com/', primary_use: 'Home remodeling, design, professionals, discussions', priority: 'High', geo_coverage: 'national', service_relevance: ['decorative concrete', 'countertops'] },
  { category: 'directory', source_type: 'company_directory', name: 'HomeAdvisor', url: 'https://www.homeadvisor.com/', primary_use: 'Home-service demand', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'directory', source_type: 'company_directory', name: 'Porch', url: 'https://porch.com/', primary_use: 'Home improvement marketplace', priority: 'Medium', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'directory', source_type: 'company_directory', name: 'Yelp', url: 'https://www.yelp.com/', primary_use: 'Business reviews and local search', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'directory', source_type: 'google_maps', name: 'Google Maps', url: 'https://maps.google.com/', primary_use: 'Local business discovery, competitor research', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'directory', source_type: 'company_directory', name: 'BBB Accredited Businesses', url: 'https://www.bbb.org/', primary_use: 'Business directory, trust signals', priority: 'Medium', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },

  // ── Social & Community ─────────────────────────────────────────
  { category: 'social', source_type: 'facebook_group', name: 'Facebook Search', url: 'https://www.facebook.com/', primary_use: 'Community discussions, homeowner questions', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'social', source_type: 'nextdoor', name: 'Nextdoor', url: 'https://nextdoor.com/', primary_use: 'Neighborhood recommendations, local contractor requests', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'social', source_type: 'reddit', name: 'Reddit Home Improvement', url: 'https://www.reddit.com/r/HomeImprovement/', primary_use: 'Homeowner questions, project discussions', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'social', source_type: 'reddit', name: 'Reddit r/DIY', url: 'https://www.reddit.com/r/DIY/', primary_use: 'DIY projects, problem discussions', priority: 'Medium', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'social', source_type: 'reddit', name: 'Reddit r/Concrete', url: 'https://www.reddit.com/r/Concrete/', primary_use: 'Concrete-specific discussions', priority: 'High', geo_coverage: 'national', service_relevance: ['concrete'] },
  { category: 'social', source_type: 'reddit', name: 'Reddit r/Flooring', url: 'https://www.reddit.com/r/Flooring/', primary_use: 'Flooring discussions, recommendations', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'flooring'] },
  { category: 'social', source_type: 'quora', name: 'Quora Home Improvement', url: 'https://www.quora.com/topic/Home-Improvement', primary_use: 'Q&A about home improvement, flooring', priority: 'Medium', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'social', source_type: 'linkedin', name: 'LinkedIn Construction Groups', url: 'https://www.linkedin.com/', primary_use: 'Professional networking, GC/architect connections', priority: 'High', geo_coverage: 'national', service_relevance: ['commercial flooring', 'concrete'] },
  { category: 'social', source_type: 'x_twitter', name: 'X (Twitter) Search', url: 'https://x.com/', primary_use: 'Real-time conversations, complaints, recommendations', priority: 'Medium', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'social', source_type: 'instagram', name: 'Instagram Hashtags', url: 'https://www.instagram.com/', primary_use: 'Visual project sharing, before/after, contractor discovery', priority: 'Medium', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'decorative concrete'] },
  { category: 'social', source_type: 'youtube', name: 'YouTube Flooring Tutorials', url: 'https://www.youtube.com/', primary_use: 'DIY questions, project videos, comment leads', priority: 'Medium', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'social', source_type: 'pinterest', name: 'Pinterest Home Ideas', url: 'https://www.pinterest.com/', primary_use: 'Home design inspiration, garage/patio ideas', priority: 'Low', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'decorative concrete'] },
  { category: 'social', source_type: 'tiktok', name: 'TikTok Home Reno', url: 'https://www.tiktok.com/', primary_use: 'Short-form project videos, comment leads', priority: 'Low', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'social', source_type: 'alignable', name: 'Alignable', url: 'https://www.alignable.com/', primary_use: 'Small business networking, referral partnerships', priority: 'Medium', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },

  // ── Marketplaces & Classifieds ──────────────────────────────────
  { category: 'marketplace', source_type: 'craigslist', name: 'Craigslist Dallas', url: 'https://dallas.craigslist.org/', primary_use: 'Service requests, garage floor posts', priority: 'High', geo_coverage: 'Dallas TX', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'marketplace', source_type: 'craigslist', name: 'Craigslist Fort Worth', url: 'https://fortworth.craigslist.org/', primary_use: 'Service requests', priority: 'High', geo_coverage: 'Fort Worth TX', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'marketplace', source_type: 'craigslist', name: 'Craigslist Austin', url: 'https://austin.craigslist.org/', primary_use: 'Service requests', priority: 'High', geo_coverage: 'Austin TX', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'marketplace', source_type: 'craigslist', name: 'Craigslist Houston', url: 'https://houston.craigslist.org/', primary_use: 'Service requests', priority: 'High', geo_coverage: 'Houston TX', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'marketplace', source_type: 'craigslist', name: 'Craigslist San Antonio', url: 'https://sanantonio.craigslist.org/', primary_use: 'Service requests', priority: 'High', geo_coverage: 'San Antonio TX', service_relevance: ['epoxy flooring', 'concrete'] },

  // ── Forums & Communities ────────────────────────────────────────
  { category: 'forum', source_type: 'forum', name: 'Garage Journal Forum', url: 'https://www.garagejournal.com/forum/', primary_use: 'Garage floor discussions, epoxy questions', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'garage floor'] },
  { category: 'forum', source_type: 'forum', name: 'Contractor Talk', url: 'https://www.contractortalk.com/', primary_use: 'Contractor discussions, subcontractor needs', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'forum', source_type: 'forum', name: 'Concrete Construction Forum', url: 'https://www.concreteconstruction.net/', primary_use: 'Concrete industry discussions', priority: 'Medium', geo_coverage: 'national', service_relevance: ['concrete'] },
  { category: 'forum', source_type: 'forum', name: 'Flooring Forum', url: 'https://www.flooring.net/', primary_use: 'Flooring Q&A, recommendations', priority: 'Medium', geo_coverage: 'national', service_relevance: ['flooring'] },
  { category: 'forum', source_type: 'forum', name: 'Houzz Discussions', url: 'https://www.houzz.com/discussions', primary_use: 'Homeowner remodeling Q&A', priority: 'Medium', geo_coverage: 'national', service_relevance: ['decorative concrete', 'countertops'] },

  // ── Bid Boards & Plan Rooms ────────────────────────────────────
  { category: 'bid_board', source_type: 'bid_board', name: 'Dodge Construction Network', url: 'https://www.construction.com/', primary_use: 'Construction project intelligence, bid opportunities', priority: 'High', geo_coverage: 'national', service_relevance: ['commercial flooring', 'concrete'] },
  { category: 'bid_board', source_type: 'bid_board', name: 'BidNet Direct', url: 'https://www.bidnetdirect.com/', primary_use: 'Government bid opportunities', priority: 'High', geo_coverage: 'national', service_relevance: ['commercial flooring', 'concrete'] },
  { category: 'bid_board', source_type: 'bid_board', name: 'GovernmentBids.com', url: 'https://www.governmentbids.com/', primary_use: 'Government procurement bids', priority: 'Medium', geo_coverage: 'national', service_relevance: ['commercial flooring'] },
  { category: 'plan_room', source_type: 'plan_room', name: 'AGC Plan Room', url: 'https://www.agc.org/', primary_use: 'Associated General Contractors plan room', priority: 'Medium', geo_coverage: 'national', service_relevance: ['commercial flooring', 'concrete'] },
  { category: 'procurement', source_type: 'procurement_portal', name: 'SAM.gov', url: 'https://sam.gov/', primary_use: 'Federal procurement, RFP/RFQ opportunities', priority: 'High', geo_coverage: 'national', service_relevance: ['commercial flooring', 'concrete'] },
  { category: 'procurement', source_type: 'procurement_portal', name: 'Texas SmartBuy', url: 'https://www.txsmartbuy.com/', primary_use: 'Texas state procurement', priority: 'Medium', geo_coverage: 'Texas', service_relevance: ['commercial flooring'] },

  // ── Permit & Property Records ─────────────────────────────────
  { category: 'permit', source_type: 'permit_portal', name: 'Dallas Building Permits', url: 'https://www.dallascityhall.com/buildingpermit/', primary_use: 'Building permit search', priority: 'High', geo_coverage: 'Dallas TX', service_relevance: ['concrete', 'flooring'] },
  { category: 'permit', source_type: 'permit_portal', name: 'Austin Build + Connect', url: 'https://abc.austintexas.gov/', primary_use: 'Austin permit portal', priority: 'High', geo_coverage: 'Austin TX', service_relevance: ['concrete', 'flooring'] },
  { category: 'permit', source_type: 'permit_portal', name: 'Houston Permits', url: 'https://www.houstontx.gov/permits/', primary_use: 'Houston building permits', priority: 'High', geo_coverage: 'Houston TX', service_relevance: ['concrete', 'flooring'] },
  { category: 'property', source_type: 'property_record', name: 'Zillow', url: 'https://www.zillow.com/', primary_use: 'Property listings, recent sales, acquisitions', priority: 'Medium', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'property', source_type: 'property_record', name: 'Redfin', url: 'https://www.redfin.com/', primary_use: 'Property listings, recent sales', priority: 'Medium', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'cre', source_type: 'cre_listing', name: 'LoopNet', url: 'https://www.loopnet.com/', primary_use: 'Commercial real estate listings, lease/sale signals', priority: 'High', geo_coverage: 'national', service_relevance: ['commercial flooring', 'concrete'] },
  { category: 'cre', source_type: 'cre_listing', name: 'CoStar', url: 'https://www.costar.com/', primary_use: 'Commercial property intelligence', priority: 'Medium', geo_coverage: 'national', service_relevance: ['commercial flooring'] },
  { category: 'foreclosure', source_type: 'foreclosure', name: 'RealtyTrac', url: 'https://www.realtytrac.com/', primary_use: 'Foreclosure listings, distressed properties', priority: 'Low', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },

  // ── Associations & Chambers ────────────────────────────────────
  { category: 'association', source_type: 'association', name: 'AGC of America', url: 'https://www.agc.org/', primary_use: 'General contractor association, member directory', priority: 'High', geo_coverage: 'national', service_relevance: ['commercial flooring', 'concrete'] },
  { category: 'association', source_type: 'association', name: 'NAHB', url: 'https://www.nahb.org/', primary_use: 'Home Builders Association, member directory', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'association', source_type: 'association', name: 'NARI', url: 'https://www.nari.org/', primary_use: 'Remodeling Industry Association, member directory', priority: 'High', geo_coverage: 'national', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'association', source_type: 'association', name: 'American Institute of Architects', url: 'https://www.aia.org/', primary_use: 'Architect directory, project intelligence', priority: 'High', geo_coverage: 'national', service_relevance: ['commercial flooring', 'concrete'] },
  { category: 'association', source_type: 'association', name: 'IFMA', url: 'https://www.ifma.org/', primary_use: 'Facility management association, vendor opportunities', priority: 'Medium', geo_coverage: 'national', service_relevance: ['commercial flooring'] },
  { category: 'association', source_type: 'association', name: 'IREM', url: 'https://www.irem.org/', primary_use: 'Property management association', priority: 'Medium', geo_coverage: 'national', service_relevance: ['commercial flooring'] },
  { category: 'association', source_type: 'chamber', name: 'Dallas Regional Chamber', url: 'https://www.dallaschamber.org/', primary_use: 'Local business directory, networking', priority: 'Medium', geo_coverage: 'Dallas TX', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'association', source_type: 'chamber', name: 'Austin Chamber of Commerce', url: 'https://www.austinchamber.com/', primary_use: 'Local business directory', priority: 'Medium', geo_coverage: 'Austin TX', service_relevance: ['epoxy flooring', 'concrete'] },

  // ── News & Public Notices ──────────────────────────────────────
  { category: 'news', source_type: 'news', name: 'Dallas Business Journal', url: 'https://www.bizjournals.com/dallas/', primary_use: 'Local business news, project announcements', priority: 'Medium', geo_coverage: 'Dallas TX', service_relevance: ['commercial flooring', 'concrete'] },
  { category: 'news', source_type: 'news', name: 'Austin Business Journal', url: 'https://www.bizjournals.com/austin/', primary_use: 'Local business news', priority: 'Medium', geo_coverage: 'Austin TX', service_relevance: ['commercial flooring', 'concrete'] },
  { category: 'public_notice', source_type: 'public_notice', name: 'Texas Public Notice', url: 'https://www.publicnoticeads.com/', primary_use: 'Public notices, bid announcements', priority: 'Medium', geo_coverage: 'Texas', service_relevance: ['commercial flooring'] },

  // ── Search Engines ─────────────────────────────────────────────
  { category: 'search_engine', source_type: 'google_search', name: 'Google Search', url: 'https://www.google.com/', primary_use: 'Web search for demand signals', priority: 'High', geo_coverage: 'global', service_relevance: ['epoxy flooring', 'concrete'] },
  { category: 'search_engine', source_type: 'bing_search', name: 'Bing Search', url: 'https://www.bing.com/', primary_use: 'Web search for demand signals', priority: 'Medium', geo_coverage: 'global', service_relevance: ['epoxy flooring', 'concrete'] },
];