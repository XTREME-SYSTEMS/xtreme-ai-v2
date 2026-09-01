// searchDimensions.ts — The combinatorial search generator for the
// autonomous demand-intelligence system. Generates searches from
// SERVICE × INTENT × PROBLEM × PROPERTY × GEOGRAPHY × TIME × PROJECT_STAGE.
//
// The Hunter agent uses this to generate hundreds of search queries
// that go beyond obvious service-name searches — searching for the
// underlying PROBLEM, PROJECT, PROPERTY, CONVERSATION and MONEY EVENT.

import {
  SERVICE_UNIVERSE, INTENT_PHRASES, PROBLEM_SIGNALS,
  PROJECT_SIGNALS, BID_SIGNALS, PROPERTY_SIGNALS, ADJACENT_TRADES,
} from './leadKeywords.ts';

// Default geographies (Texas primary market — expand per client)
export const DEFAULT_GEOGRAPHIES = [
  'Dallas TX', 'Fort Worth TX', 'DFW', 'Arlington TX', 'Plano TX',
  'Frisco TX', 'McKinney TX', 'Irving TX', 'Garland TX', 'Denton TX',
  'Austin TX', 'Round Rock TX', 'Cedar Park TX', 'Pflugerville TX',
  'Houston TX', 'Sugar Land TX', 'Katy TX', 'The Woodlands TX',
  'San Antonio TX', 'New Braunfels TX',
];

// Time windows for recency-filtered searches
export const TIME_WINDOWS = [
  'today', 'this week', 'past week', 'recent',
  '2026', '2025', 'last month',
];

// Project stages
export const PROJECT_STAGES = [
  'planning', 'design', 'permitting', 'bidding', 'construction',
  'renovation', 'build-out', 'tenant improvement', 'completion',
];

// Generate combinatorial search queries.
// Strategy: SERVICE × INTENT × GEOGRAPHY (core), plus PROBLEM × GEOGRAPHY
// (inferred demand), plus PROJECT × GEOGRAPHY (project demand), plus
// BID × GEOGRAPHY (procurement), plus ADJACENT_TRADE × SERVICE (partner).
export function generateSearchQueries(opts: {
  services?: string[];
  geographies?: string[];
  maxQueries?: number;
  includeProblem?: boolean;
  includeProject?: boolean;
  includeBid?: boolean;
  includePartner?: boolean;
  includeProperty?: boolean;
} = {}) {
  const services = opts.services || SERVICE_UNIVERSE.slice(0, 20); // top 20 services
  const geos = opts.geographies || DEFAULT_GEOGRAPHIES;
  const max = opts.maxQueries || 200;
  const queries: string[][] = []; // [query, dimension] pairs

  // Core: SERVICE + INTENT + GEOGRAPHY
  for (const service of services) {
    for (const geo of geos) {
      // Direct intent
      queries.push([`${service} "looking for" ${geo}`, 'direct_demand']);
      queries.push([`${service} "recommend" ${geo}`, 'direct_demand']);
      queries.push([`${service} "need a" ${geo}`, 'direct_demand']);
      queries.push([`${service} "who does" ${geo}`, 'direct_demand']);
      // Pricing intent
      queries.push([`${service} "cost" ${geo}`, 'direct_demand']);
      queries.push([`${service} "quote" ${geo}`, 'direct_demand']);
      queries.push([`${service} "estimate" ${geo}`, 'direct_demand']);
    }
  }

  // Problem demand: PROBLEM + GEOGRAPHY (infer service from problem)
  if (opts.includeProblem !== false) {
    const problemToService = {
      'cracked': 'concrete repair', 'cracking': 'concrete repair',
      'spalling': 'concrete repair', 'flaking': 'concrete repair',
      'peeling': 'epoxy flooring', 'ugly garage floor': 'epoxy flooring',
      'oil stained': 'epoxy flooring', 'dusty': 'concrete polishing',
      'uneven': 'concrete leveling', 'sunken': 'concrete leveling',
      'trip hazard': 'concrete repair', 'failed epoxy': 'epoxy flooring',
      'failed coating': 'epoxy flooring', 'delaminating': 'concrete repair',
    };
    for (const [problem, _service] of Object.entries(problemToService)) {
      for (const geo of geos) {
        queries.push([`"${problem}" ${geo} contractor`, 'problem_demand']);
        queries.push([`"${problem}" floor ${geo}`, 'problem_demand']);
      }
    }
  }

  // Project demand: PROJECT + GEOGRAPHY
  if (opts.includeProject !== false) {
    for (const project of PROJECT_SIGNALS.slice(0, 10)) {
      for (const geo of geos) {
        queries.push([`${project} ${geo} flooring`, 'project_demand']);
        queries.push([`${project} ${geo} concrete`, 'project_demand']);
      }
    }
  }

  // Bid demand: BID + SERVICE + GEOGRAPHY
  if (opts.includeBid !== false) {
    for (const bid of BID_SIGNALS.slice(0, 5)) {
      for (const geo of geos) {
        queries.push([`${bid} flooring ${geo}`, 'bid_demand']);
        queries.push([`${bid} concrete ${geo}`, 'bid_demand']);
      }
    }
  }

  // Partner demand: ADJACENT_TRADE + SERVICE
  if (opts.includePartner !== false) {
    for (const trade of ADJACENT_TRADES.slice(0, 10)) {
      queries.push([`${trade} flooring subcontractor`, 'partner_demand']);
      queries.push([`${trade} concrete sub`, 'partner_demand']);
    }
  }

  // Property signal: PROPERTY + GEOGRAPHY
  if (opts.includeProperty !== false) {
    for (const prop of PROPERTY_SIGNALS.slice(0, 5)) {
      for (const geo of geos) {
        queries.push([`"${prop}" ${geo} renovation`, 'property_signal']);
      }
    }
  }

  // Shuffle and cap
  const shuffled = queries.sort(() => Math.random() - 0.5).slice(0, max);
  return shuffled.map(([q, dim]) => ({ query: q, dimension: dim }));
}

// Generate a focused batch for a specific dimension (used by the Hunter
// when it wants to go deep on one demand type).
export function generateDimensionQueries(dimension: string, geographies?: string[], maxQueries = 50) {
  return generateSearchQueries({
    geographies,
    maxQueries,
    includeProblem: dimension === 'problem_demand',
    includeProject: dimension === 'project_demand',
    includeBid: dimension === 'bid_demand',
    includePartner: dimension === 'partner_demand',
    includeProperty: dimension === 'property_signal',
  }).filter(q => q.dimension === dimension);
}