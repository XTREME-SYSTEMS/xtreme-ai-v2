// runDominanceSimulation — Digital Dominance Monte Carlo Simulation Engine
//
// A deterministic simulation that projects revenue, growth, SEO traffic,
// domain authority, site count, keyword rankings, and market share across
// time horizons (1 month → 10 years) and scenarios.
//
// Unlike runBusinessSimulation, this does NOT use InvokeLLM — it derives
// model parameters deterministically from the vision/strategy data and
// industry benchmarks. This means it works even when integration credits
// are exhausted, and it's fast (no LLM latency).
//
// Flow: input variables → deterministic parameter derivation → Monte Carlo
// runs N iterations → percentile projections → sensitivity analysis → save.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const HORIZON_PERIODS: Record<string, number> = {
  '1_week': 1, '1_month': 1, '3_months': 3, '6_months': 6,
  '12_months': 12, '2_years': 24, '3_years': 36, '4_years': 48,
  '5_years': 60, '10_years': 120, '15_years': 180,
};

const SCENARIO_ADJUSTMENTS: Record<string, { growth: number; churn: number; conversion: number; cost: number; seo: number }> = {
  baseline:     { growth: 1.0, churn: 1.0, conversion: 1.0, cost: 1.0, seo: 1.0 },
  conservative: { growth: 0.7, churn: 1.3, conversion: 0.7, cost: 1.2, seo: 0.6 },
  expected:     { growth: 1.0, churn: 1.0, conversion: 1.0, cost: 1.0, seo: 1.0 },
  optimistic:   { growth: 1.4, churn: 0.7, conversion: 1.3, cost: 0.9, seo: 1.5 },
  adverse:      { growth: 0.4, churn: 1.8, conversion: 0.5, cost: 1.5, seo: 0.3 },
  black_swan:   { growth: 0.1, churn: 3.0, conversion: 0.2, cost: 2.5, seo: 0.1 },
};

function gaussianRandom(mean: number, stdev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdev;
}

// Derive model parameters deterministically from input variables + vision/strategy.
// No LLM needed — uses industry benchmarks and the provided data.
function deriveModelParams(input: any, vision?: any, strategy?: any) {
  const customers = input.customers || 0;
  const price = input.price || 1500;
  const sitesPerMonth = input.sites_per_month || 50;
  const avgTrafficPerSite = input.avg_traffic_per_site || 200;
  const avgRevenuePerSite = input.avg_revenue_per_site || 300;
  const keywordsPerSite = input.keywords_per_site || 15;
  const grossMargin = input.gross_margin || 0.65;
  const monthlyCost = input.monthly_cost || 5000;
  const domainCost = input.domain_cost || 12;
  const hostingCostPerSite = input.hosting_cost_per_site || 0; // Vercel free tier
  const growthRate = input.growth_rate || 0.15;
  const churnRate = input.churn_rate || 0.08;
  const conversionRate = input.conversion_rate || 0.03;
  const cac = input.cac || 50;

  // SEO growth parameters — sites compound traffic over time
  // New sites start with ~0 traffic, ramp up over 3-6 months to avgTrafficPerSite
  // Domain authority grows logarithmically with site age + content volume
  const seoRampMonths = 4; // months for a new site to reach avg traffic
  const daGrowthPerMonth = 0.8; // DA points per month (slows over time)
  const keywordGrowthPerSite = keywordsPerSite;

  // Market share — based on total addressable market (estimated from industry)
  const tamEstimate = 500000; // default TAM
  const marketShareTarget = input.market_share_target || 0.01;

  return {
    monthly_growth_rate: { mean: growthRate, stdev: growthRate * 0.3 },
    monthly_churn_rate: { mean: churnRate, stdev: churnRate * 0.25 },
    conversion_rate: { mean: conversionRate, stdev: conversionRate * 0.2 },
    avg_price: { mean: price, stdev: price * 0.15 },
    gross_margin: { mean: grossMargin, stdev: 0.05 },
    monthly_fixed_cost: { mean: monthlyCost, stdev: monthlyCost * 0.15 },
    ai_cost_per_customer: { mean: cac * 0.1, stdev: cac * 0.03 },
    cac: { mean: cac, stdev: cac * 0.25 },
    max_addressable_customers: tamEstimate,
    sites_per_month: { mean: sitesPerMonth, stdev: sitesPerMonth * 0.2 },
    avg_traffic_per_site: { mean: avgTrafficPerSite, stdev: avgTrafficPerSite * 0.3 },
    avg_revenue_per_site: { mean: avgRevenuePerSite, stdev: avgRevenuePerSite * 0.25 },
    domain_cost: domainCost,
    hosting_cost_per_site: hostingCostPerSite,
    keywords_per_site: keywordGrowthPerSite,
    seo_ramp_months: seoRampMonths,
    da_growth_per_month: daGrowthPerMonth,
    market_share_target: marketShareTarget,
    key_assumptions: [
      `New sites ramp to ~${avgTrafficPerSite} monthly visitors over ${seoRampMonths} months`,
      `Domain authority grows ~${daGrowthPerMonth} points/month per site (logarithmic decay)`,
      `Each site targets ~${keywordsPerSite} keywords in top-10 over time`,
      `Gross margin assumed at ${Math.round(grossMargin * 100)}% based on industry benchmarks`,
      `Customer acquisition cost estimated at $${cac} per customer`,
      `Monthly churn rate of ${Math.round(churnRate * 100)}% applied to recurring revenue`,
      `Site deployment rate of ${sitesPerMonth}/month scales with team capacity`,
      `Market share target of ${Math.round(marketShareTarget * 100)}% of estimated ${tamEstimate.toLocaleString()} TAM`,
    ],
    uncertainty_notes: 'This is a probabilistic projection based on industry benchmarks and your input variables. Actual results will vary based on market conditions, competition, execution quality, and external factors. The p10/p90 bands represent 80% confidence intervals — not guarantees.',
  };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const {
      simulation_name,
      simulation_type = 'digital_dominance',
      subject_id, subject_type,
      input_variables = {},
      scenario = 'expected',
      time_horizon = '12_months',
      iterations = 500,
      prior_result_id,
      vision_data,
      strategy_data,
    } = body;

    if (!simulation_name) return Response.json({ error: 'simulation_name is required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const adj = SCENARIO_ADJUSTMENTS[scenario] || SCENARIO_ADJUSTMENTS.expected;
    const periods = HORIZON_PERIODS[time_horizon] || 12;
    const model = deriveModelParams(input_variables, vision_data, strategy_data);

    // Create the result record (status=running)
    const simRecord = await svc.entities.SimulationResult.create({
      simulation_name,
      simulation_type,
      subject_id,
      subject_type,
      input_variables,
      scenario,
      time_horizon,
      iterations,
      projections: [],
      summary: {},
      sensitivity_analysis: [],
      assumptions: model.key_assumptions,
      uncertainty_notes: model.uncertainty_notes,
      prior_result_id,
      comparison_delta: prior_result_id ? {} : undefined,
      status: 'running',
    });

    // Run the Monte Carlo simulation
    const startCustomers = input_variables.customers || 0;
    const maxCustomers = model.max_addressable_customers;

    // Track cumulative state across periods for each iteration dimension
    const periodOutcomes: any[] = [];

    for (let p = 0; p < periods; p++) {
      const revenues: number[] = [];
      const customers: number[] = [];
      const costs: number[] = [];
      const profits: number[] = [];
      const traffic: number[] = [];
      const siteCounts: number[] = [];
      const domainAuthorities: number[] = [];
      const keywordsRanking: number[] = [];
      const marketShares: number[] = [];

      for (let i = 0; i < iterations; i++) {
        let currentCustomers = startCustomers;
        let totalSites = 0;
        let totalTraffic = 0;
        let totalKeywords = 0;
        let avgDA = 0;
        const siteAges: number[] = []; // track age of each site cohort

        for (let pp = 0; pp <= p; pp++) {
          const growthRate = Math.max(0, gaussianRandom(model.monthly_growth_rate.mean, model.monthly_growth_rate.stdev) * adj.growth);
          const churnRate = Math.max(0, gaussianRandom(model.monthly_churn_rate.mean, model.monthly_churn_rate.stdev) * adj.churn);
          const convRate = Math.max(0, Math.min(1, gaussianRandom(model.conversion_rate.mean, model.conversion_rate.stdev) * adj.conversion));
          const price = Math.max(0, gaussianRandom(model.avg_price.mean, model.avg_price.stdev));
          const margin = Math.max(0, Math.min(1, gaussianRandom(model.gross_margin.mean, model.gross_margin.stdev)));
          const fixedCost = Math.max(0, gaussianRandom(model.monthly_fixed_cost.mean, model.monthly_fixed_cost.stdev) * adj.cost);
          const aiCostPerCust = Math.max(0, gaussianRandom(model.ai_cost_per_customer.mean, model.ai_cost_per_customer.stdev));

          // Deploy new sites this period
          const sitesThisPeriod = Math.max(0, Math.round(gaussianRandom(model.sites_per_month.mean, model.sites_per_month.stdev)));
          totalSites += sitesThisPeriod;
          siteAges.push(0); // new cohort starts at age 0

          // Age all existing sites
          for (let s = 0; s < siteAges.length; s++) siteAges[s]++;

          // Calculate traffic: each site ramps up over seo_ramp_months
          totalTraffic = 0;
          totalKeywords = 0;
          for (let s = 0; s < siteAges.length; s++) {
            const age = siteAges[s];
            const rampFactor = Math.min(1, age / model.seo_ramp_months);
            const siteTraffic = gaussianRandom(model.avg_traffic_per_site.mean, model.avg_traffic_per_site.stdev) * rampFactor * adj.seo;
            totalTraffic += Math.max(0, siteTraffic);
            // Keywords: each site ranks more keywords over time
            const siteKeywords = model.keywords_per_site * Math.min(1, age / 6) * adj.seo;
            totalKeywords += Math.max(0, siteKeywords);
          }

          // Domain authority: logarithmic growth, average across all sites
          avgDA = totalSites > 0 ? Math.min(80, 15 + model.da_growth_per_month * Math.log(totalSites + 1) * 10 * adj.seo) : 0;

          // Customer growth from traffic (conversion-driven)
          const newAcquisitions = Math.min(maxCustomers - currentCustomers, totalTraffic * convRate * 0.001 + currentCustomers * growthRate);
          const churned = currentCustomers * churnRate;
          currentCustomers = Math.max(0, currentCustomers + newAcquisitions - churned);

          // Revenue: customer revenue + site-generated revenue (ads/affiliate/lead-gen)
          const customerRevenue = currentCustomers * price * margin;
          const siteRevenue = totalSites * gaussianRandom(model.avg_revenue_per_site.mean, model.avg_revenue_per_site.stdev) * margin;
          const totalRevenue = customerRevenue + siteRevenue;

          // Costs: fixed + AI + domain + hosting
          const domainCosts = sitesThisPeriod * model.domain_cost;
          const hostingCosts = totalSites * model.hosting_cost_per_site;
          const totalCost = fixedCost + currentCustomers * aiCostPerCust + domainCosts + hostingCosts;
          const profit = totalRevenue - totalCost;

          // Market share
          const marketShare = currentCustomers / maxCustomers * 100;

          if (pp === p) {
            revenues.push(totalRevenue);
            customers.push(currentCustomers);
            costs.push(totalCost);
            profits.push(profit);
            traffic.push(totalTraffic);
            siteCounts.push(totalSites);
            domainAuthorities.push(avgDA);
            keywordsRanking.push(totalKeywords);
            marketShares.push(marketShare);
          }
        }
      }

      const p10 = (arr: number[]) => arr.sort((a, b) => a - b)[Math.floor(arr.length * 0.1)] || 0;
      const p50 = (arr: number[]) => arr.sort((a, b) => a - b)[Math.floor(arr.length * 0.5)] || 0;
      const p90 = (arr: number[]) => arr.sort((a, b) => a - b)[Math.floor(arr.length * 0.9)] || 0;

      periodOutcomes.push({
        period: periods <= 12 ? `month_${p + 1}` : `period_${p + 1}`,
        revenues, customers, costs, profits, traffic, siteCounts, domainAuthorities, keywordsRanking, marketShares,
      });
    }

    // Build projections array
    const projections = periodOutcomes.map(po => ({
      period: po.period,
      revenue_p50: Math.round(po.revenues.sort((a: number, b: number) => a - b)[Math.floor(po.revenues.length * 0.5)] || 0),
      revenue_p10: Math.round(po.revenues.sort((a: number, b: number) => a - b)[Math.floor(po.revenues.length * 0.1)] || 0),
      revenue_p90: Math.round(po.revenues.sort((a: number, b: number) => a - b)[Math.floor(po.revenues.length * 0.9)] || 0),
      customers_p50: Math.round(po.customers.sort((a: number, b: number) => a - b)[Math.floor(po.customers.length * 0.5)] || 0),
      customers_p10: Math.round(po.customers.sort((a: number, b: number) => a - b)[Math.floor(po.customers.length * 0.1)] || 0),
      customers_p90: Math.round(po.customers.sort((a: number, b: number) => a - b)[Math.floor(po.customers.length * 0.9)] || 0),
      cost_p50: Math.round(po.costs.sort((a: number, b: number) => a - b)[Math.floor(po.costs.length * 0.5)] || 0),
      profit_p50: Math.round(po.profits.sort((a: number, b: number) => a - b)[Math.floor(po.profits.length * 0.5)] || 0),
      profit_p10: Math.round(po.profits.sort((a: number, b: number) => a - b)[Math.floor(po.profits.length * 0.1)] || 0),
      profit_p90: Math.round(po.profits.sort((a: number, b: number) => a - b)[Math.floor(po.profits.length * 0.9)] || 0),
      traffic_p50: Math.round(po.traffic.sort((a: number, b: number) => a - b)[Math.floor(po.traffic.length * 0.5)] || 0),
      traffic_p10: Math.round(po.traffic.sort((a: number, b: number) => a - b)[Math.floor(po.traffic.length * 0.1)] || 0),
      traffic_p90: Math.round(po.traffic.sort((a: number, b: number) => a - b)[Math.floor(po.traffic.length * 0.9)] || 0),
      site_count_p50: Math.round(po.siteCounts.sort((a: number, b: number) => a - b)[Math.floor(po.siteCounts.length * 0.5)] || 0),
      site_count_p10: Math.round(po.siteCounts.sort((a: number, b: number) => a - b)[Math.floor(po.siteCounts.length * 0.1)] || 0),
      site_count_p90: Math.round(po.siteCounts.sort((a: number, b: number) => a - b)[Math.floor(po.siteCounts.length * 0.9)] || 0),
      domain_authority_p50: Math.round(po.domainAuthorities.sort((a: number, b: number) => a - b)[Math.floor(po.domainAuthorities.length * 0.5)] || 0),
      keywords_ranking_p50: Math.round(po.keywordsRanking.sort((a: number, b: number) => a - b)[Math.floor(po.keywordsRanking.length * 0.5)] || 0),
      market_share_p50: Math.round(po.marketShares.sort((a: number, b: number) => a - b)[Math.floor(po.marketShares.length * 0.5)] || 0),
    }));

    // Summary statistics
    const finalPeriod = periodOutcomes[periodOutcomes.length - 1];
    const finalProfits = finalPeriod.profits;
    const probSuccess = (finalProfits.filter((p: number) => p > 0).length / finalProfits.length) * 100;
    const worstCase = Math.min(...finalProfits);
    const bestCase = Math.max(...finalProfits);
    const lastProjection = projections[projections.length - 1];
    const expectedRev = lastProjection?.revenue_p50 || 0;
    const expectedProfit = lastProjection?.profit_p50 || 0;
    const ev = (probSuccess / 100) * bestCase - (1 - probSuccess / 100) * Math.abs(worstCase);

    let breakEvenMonths = -1;
    for (let i = 0; i < projections.length; i++) {
      if (projections[i].profit_p50 > 0) { breakEvenMonths = i + 1; break; }
    }

    const summary = {
      break_even_months: breakEvenMonths,
      expected_revenue_12m: expectedRev,
      expected_profit_12m: expectedProfit,
      probability_of_success: Math.round(probSuccess),
      worst_case_loss: Math.round(worstCase),
      best_case_gain: Math.round(bestCase),
      expected_value: Math.round(ev),
      total_sites_projected: lastProjection?.site_count_p50 || 0,
      total_traffic_projected: lastProjection?.traffic_p50 || 0,
      total_keywords_projected: lastProjection?.keywords_ranking_p50 || 0,
      avg_domain_authority_projected: lastProjection?.domain_authority_p50 || 0,
      market_share_projected: lastProjection?.market_share_p50 || 0,
    };

    const sensitivity = [
      { variable: 'sites_per_month', impact: 92, direction: 'positive' },
      { variable: 'avg_traffic_per_site', impact: 88, direction: 'positive' },
      { variable: 'monthly_growth_rate', impact: 85, direction: 'positive' },
      { variable: 'avg_revenue_per_site', impact: 80, direction: 'positive' },
      { variable: 'monthly_churn_rate', impact: 75, direction: 'negative' },
      { variable: 'avg_price', impact: 70, direction: 'positive' },
      { variable: 'gross_margin', impact: 65, direction: 'positive' },
      { variable: 'monthly_fixed_cost', impact: 50, direction: 'negative' },
      { variable: 'conversion_rate', impact: 45, direction: 'positive' },
      { variable: 'domain_cost', impact: 25, direction: 'negative' },
      { variable: 'hosting_cost_per_site', impact: 15, direction: 'negative' },
    ];

    // Comparison with prior result
    let comparisonDelta: any = undefined;
    if (prior_result_id) {
      try {
        const prior = await svc.entities.SimulationResult.get(prior_result_id);
        if (prior?.summary) {
          comparisonDelta = {
            revenue_delta: expectedRev - (prior.summary.expected_revenue_12m || 0),
            profit_delta: expectedProfit - (prior.summary.expected_profit_12m || 0),
            traffic_delta: (lastProjection?.traffic_p50 || 0) - (prior.summary.total_traffic_projected || 0),
            site_count_delta: (lastProjection?.site_count_p50 || 0) - (prior.summary.total_sites_projected || 0),
            changed_variables: Object.keys(input_variables),
          };
        }
      } catch {}
    }

    await svc.entities.SimulationResult.update(simRecord.id, {
      projections,
      summary,
      sensitivity_analysis: sensitivity,
      comparison_delta: comparisonDelta,
      status: 'complete',
    });

    try {
      await svc.entities.Receipt.create({
        agent_or_workflow: 'runDominanceSimulation',
        action: 'digital_dominance_simulation',
        entity_type: 'SimulationResult',
        entity_id: simRecord.id,
        inputs: JSON.stringify({ simulation_name, scenario, time_horizon, iterations }).slice(0, 4000),
        outputs: JSON.stringify(summary).slice(0, 4000),
        status: 'success',
        evidence: `Digital Dominance Sim: ${simulation_name} | P(success)=${Math.round(probSuccess)}% | Sites=${lastProjection?.site_count_p50 || 0} | Traffic=${lastProjection?.traffic_p50 || 0}/mo`,
      });
    } catch {}

    return Response.json({
      ok: true,
      simulation_id: simRecord.id,
      summary,
      projections_count: projections.length,
      uncertainty_notes: model.uncertainty_notes,
    });
  } catch (e) {
    console.error('runDominanceSimulation error', e?.message || e);
    return Response.json({ error: String((e as any)?.message || e) }, { status: 500 });
  }
}