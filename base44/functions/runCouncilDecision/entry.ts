// runCouncilDecision — The Vision Cortex Council Decision Protocol (§3, §42).
//
// Runs an 11-round debate across specialized intelligence archetypes:
//   1. Independent reasoning (all archetypes)
//   2. Evidence presentation
//   3. Cross-examination
//   4. Contrarian challenge
//   5. Risk review
//   6. Economic review
//   7. Engineering review
//   8. Security review
//   9. Simulation
//   10. Decision
//   11. Post-decision confidence
//
// Dissent is preserved. Confidence is scored. No agent has authority merely
// because it is called "Chief". The council's authority comes from evidence
// and demonstrated performance, weighted by AgentPerformance scores.
//
// Each archetype gets a tailored system prompt. The Contrarian actively
// attacks consensus. The Epistemic Auditor classifies fact vs inference
// vs hypothesis vs assumption. Results are saved as a CouncilDecision record.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const ARCHETYPES = [
  { name: 'systems_architect', focus: 'decompose the system, identify dependencies, see second/third-order effects' },
  { name: 'grand_synthesist', focus: 'combine insights from unrelated domains, find hidden connections' },
  { name: 'contrarian', focus: 'actively attack consensus, search for overlooked explanations, falsify accepted conclusions' },
  { name: 'epistemic_auditor', focus: 'ask what is actually known, distinguish fact/inference/speculation/assumption, maintain confidence and provenance' },
  { name: 'economist', focus: 'evaluate TAM/SAM/SOM, willingness to pay, unit economics, capital requirements, competitive response' },
  { name: 'risk_engineer', focus: 'identify failure modes, downside scenarios, blast radius, reversibility' },
  { name: 'software_architect', focus: 'technical feasibility, architecture, complexity, maintainability' },
  { name: 'security_engineer', focus: 'threat model, attack surface, credential exposure, abuse vectors' },
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { question, context = '', decision_type = 'strategic', triggered_by = 'manual', subject_id, subject_type } = body;
    if (!question) return Response.json({ error: 'question is required' }, { status: 400 });

    const scanId = `council_${Date.now()}`;
    const svc = base44.asServiceRole;

    // Create the decision record (status=debating)
    const decision = await svc.entities.CouncilDecision.create({
      question,
      context,
      decision_type,
      rounds: [],
      archetype_positions: [],
      status: 'debating',
      triggered_by,
      scan_id: scanId,
      decision_confidence: 0,
    });

    // Load agent performance scores to weight the debate
    let perfMap: Record<string, number> = {};
    try {
      const perfs = await svc.entities.AgentPerformance.list('-created_date', 50);
      for (const p of perfs) {
        perfMap[p.agent_name] = p.overall_score || 50;
      }
    } catch {}

    // ── ROUND 1: Independent reasoning from each archetype ──────────────
    const archetypePositions: any[] = [];
    const round1Promises = ARCHETYPES.map(async (arch) => {
      const weight = perfMap[arch.name] || 50;
      const res = await svc.integrations.Core.InvokeLLM({
        prompt: `You are the ${arch.name.toUpperCase()} in a multi-agent AI council. Your role: ${arch.focus}.

QUESTION: ${question}

CONTEXT: ${context}

Provide your INDEPENDENT analysis. Do not defer to other agents. State your position, your key argument, your confidence (0-100), and the risks you identify. Be direct. If you are uncertain, say so — false certainty is worse than acknowledged uncertainty.

Respond as JSON: { "position": string, "confidence": number, "key_argument": string, "risks_identified": string[] }`,
        response_json_schema: {
          type: 'object',
          properties: {
            position: { type: 'string' },
            confidence: { type: 'number' },
            key_argument: { type: 'string' },
            risks_identified: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      return { archetype: arch.name, weight, ...(typeof res === 'object' ? res : JSON.parse(res)) };
    });

    const round1Results = await Promise.all(round1Promises);
    for (const r of round1Results) {
      archetypePositions.push({
        archetype: r.archetype,
        position: r.position || '',
        confidence: Math.max(0, Math.min(100, r.confidence || 50)),
        key_argument: r.key_argument || '',
        risks_identified: r.risks_identified || [],
      });
    }

    // ── ROUNDS 2-8: Evidence, cross-examination, contrarian, risk, economic, engineering, security ──
    const roundDefs = [
      { num: 2, name: 'evidence_presentation', archetype: 'epistemic_auditor', prompt: 'Present the strongest evidence for and against each position. Classify each claim as FACT, OBSERVATION, CALCULATION, INFERENCE, HYPOTHESIS, PREDICTION, ASSUMPTION, or UNKNOWN. Preserve conflicts — do not silently pick the preferred answer.' },
      { num: 3, name: 'cross_examination', archetype: 'systems_architect', prompt: 'Cross-examine the positions. What assumptions are being made? What evidence is missing? What questions remain unanswered?' },
      { num: 4, name: 'contrarian_challenge', archetype: 'contrarian', prompt: 'Actively attack the emerging consensus. What if everyone is wrong? What overlooked explanation could invalidate the leading position? Attempt to falsify the accepted conclusions.' },
      { num: 5, name: 'risk_review', archetype: 'risk_engineer', prompt: 'Review all identified risks. What is the blast radius if this goes wrong? Is it reversible? What is the worst-case scenario?' },
      { num: 6, name: 'economic_review', archetype: 'economist', prompt: 'Review the economics. What is the expected value: (P(success) × upside) - (P(failure) × downside) - capital cost - opportunity cost? Is this the best use of resources?' },
      { num: 7, name: 'engineering_review', archetype: 'software_architect', prompt: 'Review technical feasibility. Can this be built? How complex is it? What are the maintainability concerns?' },
      { num: 8, name: 'security_review', archetype: 'security_engineer', prompt: 'Review security implications. What is the threat model? What attack surfaces does this create? What could be abused?' },
    ];

    const rounds: any[] = [{
      round_number: 1,
      round_name: 'independent_reasoning',
      archetype: 'all',
      analysis: `${archetypePositions.length} archetypes provided independent analysis`,
      evidence: '',
      confidence: archetypePositions.reduce((s, a) => s + a.confidence, 0) / Math.max(1, archetypePositions.length),
      dissent: '',
    }];

    let contrarianChallenge = '';
    let epistemicAudit = '';

    for (const rd of roundDefs) {
      const res = await svc.integrations.Core.InvokeLLM({
        prompt: `You are the ${rd.archetype.toUpperCase()} in a multi-agent AI council. Round ${rd.num}: ${rd.name.replace(/_/g, ' ')}.

QUESTION: ${question}
CONTEXT: ${context}

ARCHETYPE POSITIONS SO FAR:
${JSON.stringify(archetypePositions.map(a => ({ archetype: a.archetype, position: a.position, confidence: a.confidence })), null, 2)}

YOUR TASK: ${rd.prompt}

Respond as JSON: { "analysis": string, "evidence": string, "confidence": number, "dissent": string }`,
        response_json_schema: {
          type: 'object',
          properties: {
            analysis: { type: 'string' },
            evidence: { type: 'string' },
            confidence: { type: 'number' },
            dissent: { type: 'string' },
          },
        },
      });
      const parsed = typeof res === 'object' ? res : JSON.parse(res);
      rounds.push({
        round_number: rd.num,
        round_name: rd.name,
        archetype: rd.archetype,
        analysis: parsed.analysis || '',
        evidence: parsed.evidence || '',
        confidence: Math.max(0, Math.min(100, parsed.confidence || 50)),
        dissent: parsed.dissent || '',
      });
      if (rd.num === 4) contrarianChallenge = parsed.analysis || '';
      if (rd.num === 2) epistemicAudit = parsed.analysis || '';
    }

    // ── ROUND 9: Simulation ─────────────────────────────────────────────
    const simRes = await svc.integrations.Core.InvokeLLM({
      prompt: `You are the SIMULATION SCIENTIST in a multi-agent AI council. Round 9: simulation.

QUESTION: ${question}
CONTEXT: ${context}

Based on the debate so far, project the likely outcomes of the leading decision. Run a mental Monte Carlo: what are the p10 (adverse), p50 (expected), and p90 (optimistic) outcomes? What is the probability of success? What are the key uncertainties?

Respond as JSON: { "simulation_summary": string, "p10_outcome": string, "p50_outcome": string, "p90_outcome": string, "probability_of_success": number, "key_uncertainties": string[] }`,
      response_json_schema: {
        type: 'object',
        properties: {
          simulation_summary: { type: 'string' },
          p10_outcome: { type: 'string' },
          p50_outcome: { type: 'string' },
          p90_outcome: { type: 'string' },
          probability_of_success: { type: 'number' },
          key_uncertainties: { type: 'array', items: { type: 'string' } },
        },
      },
    });
    const simParsed = typeof simRes === 'object' ? simRes : JSON.parse(simRes);
    const simulationSummary = simParsed.simulation_summary || '';
    rounds.push({
      round_number: 9,
      round_name: 'simulation',
      archetype: 'simulation_scientist',
      analysis: simulationSummary,
      evidence: `p10: ${simParsed.p10_outcome || ''} | p50: ${simParsed.p50_outcome || ''} | p90: ${simParsed.p90_outcome || ''}`,
      confidence: simParsed.probability_of_success || 50,
      dissent: '',
    });

    // ── ROUND 10: Decision ──────────────────────────────────────────────
    const decRes = await svc.integrations.Core.InvokeLLM({
      prompt: `You are the COUNCIL DECISION SYNTHESIZER. Round 10: final decision.

QUESTION: ${question}
CONTEXT: ${context}

ALL ROUNDS:
${JSON.stringify(rounds.map(r => ({ round: r.round_number, name: r.round_name, analysis: r.analysis, confidence: r.confidence })), null, 2)}

ARCHETYPE POSITIONS:
${JSON.stringify(archetypePositions.map(a => ({ archetype: a.archetype, position: a.position, confidence: a.confidence })), null, 2)}

SIMULATION: ${simulationSummary}
PROBABILITY OF SUCCESS: ${simParsed.probability_of_success}

Synthesize the council's final decision. Weight by confidence and evidence quality, not by archetype name. Preserve any meaningful dissent. Calculate expected value. Identify failure modes. Recommend next action. State whether human approval is required (red-tier: financial, destructive, legal, production-impacting).

Respond as JSON: { "final_decision": string, "decision_confidence": number, "dissent_preserved": string, "expected_value": number, "failure_modes": string[], "recommended_next_action": string, "approval_required": boolean }`,
      response_json_schema: {
        type: 'object',
        properties: {
          final_decision: { type: 'string' },
          decision_confidence: { type: 'number' },
          dissent_preserved: { type: 'string' },
          expected_value: { type: 'number' },
          failure_modes: { type: 'array', items: { type: 'string' } },
          recommended_next_action: { type: 'string' },
          approval_required: { type: 'boolean' },
        },
      },
    });
    const decParsed = typeof decRes === 'object' ? decRes : JSON.parse(decRes);

    // ── ROUND 11: Post-decision confidence ──────────────────────────────
    const confRes = await svc.integrations.Core.InvokeLLM({
      prompt: `You are the EPISTEMIC AUDITOR. Round 11: post-decision confidence audit.

DECISION: ${decParsed.final_decision}

Audit the decision. What is actually known vs assumed? What would need to be true for this decision to be correct? What evidence would change this decision? Is the confidence justified?

Respond as JSON: { "post_decision_confidence": number, "what_must_be_true": string[], "what_would_change_it": string[], "confidence_justified": boolean }`,
      response_json_schema: {
        type: 'object',
        properties: {
          post_decision_confidence: { type: 'number' },
          what_must_be_true: { type: 'array', items: { type: 'string' } },
          what_would_change_it: { type: 'array', items: { type: 'string' } },
          confidence_justified: { type: 'boolean' },
        },
      },
    });
    const confParsed = typeof confRes === 'object' ? confRes : JSON.parse(confRes);
    rounds.push({
      round_number: 11,
      round_name: 'post_decision_confidence',
      archetype: 'epistemic_auditor',
      analysis: `Confidence: ${confParsed.post_decision_confidence}. Justified: ${confParsed.confidence_justified}. Must be true: ${(confParsed.what_must_be_true || []).join('; ')}`,
      evidence: `Would change it: ${(confParsed.what_would_change_it || []).join('; ')}`,
      confidence: confParsed.post_decision_confidence || decParsed.decision_confidence || 50,
      dissent: confParsed.confidence_justified === false ? 'Confidence not fully justified by evidence' : '',
    });

    // ── Save the final decision ──────────────────────────────────────────
    const finalConfidence = confParsed.post_decision_confidence || decParsed.decision_confidence || 50;
    await svc.entities.CouncilDecision.update(decision.id, {
      rounds,
      archetype_positions: archetypePositions,
      contrarian_challenge: contrarianChallenge,
      epistemic_audit: epistemicAudit,
      simulation_summary: simulationSummary,
      final_decision: decParsed.final_decision || '',
      decision_confidence: Math.max(0, Math.min(100, finalConfidence)),
      dissent_preserved: decParsed.dissent_preserved || '',
      expected_value: decParsed.expected_value || 0,
      failure_modes: decParsed.failure_modes || [],
      recommended_next_action: decParsed.recommended_next_action || '',
      approval_required: decParsed.approval_required || false,
      status: 'decided',
    });

    // ── Receipt ─────────────────────────────────────────────────────────
    try {
      await svc.entities.Receipt.create({
        agent_or_workflow: 'runCouncilDecision',
        action: 'council_debate',
        entity_type: 'CouncilDecision',
        entity_id: decision.id,
        inputs: JSON.stringify({ question, decision_type }).slice(0, 4000),
        outputs: JSON.stringify({ confidence: finalConfidence, approval_required: decParsed.approval_required }).slice(0, 4000),
        status: 'success',
        evidence: `Council decision: ${decParsed.final_decision?.slice(0, 200)} (confidence: ${finalConfidence})`,
      });
    } catch {}

    return Response.json({
      ok: true,
      decision_id: decision.id,
      final_decision: decParsed.final_decision,
      confidence: finalConfidence,
      approval_required: decParsed.approval_required || false,
      dissent_preserved: decParsed.dissent_preserved,
      rounds_completed: rounds.length,
    });
  } catch (e) {
    console.error('runCouncilDecision error', e?.message || e);
    return Response.json({ error: String((e as any)?.message || e) }, { status: 500 });
  }
}