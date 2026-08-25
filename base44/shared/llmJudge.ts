// ============================================================
// llmJudge.ts — LLM-as-judge quality evaluation. After each
// generator produces a spec, a second LLM call evaluates the
// output on a rubric (completeness, consistency, feasibility,
// quality) and returns a composite score. Scores below the
// threshold trigger auto-regeneration with judge feedback.
// ============================================================

export interface JudgeScore {
  completeness: number; // 0-100
  consistency: number; // 0-100
  feasibility: number; // 0-100
  quality: number; // 0-100
  overall: number; // weighted composite 0-100
  feedback: string; // actionable feedback for regeneration
}

export const JUDGE_THRESHOLD = 70;

// ── Judge prompt builder ──────────────────────────────────────────────────

function buildJudgePrompt(specType: string, spec: any, context?: string): string {
  const specStr = JSON.stringify(spec).slice(0, 8000);
  return `You are a senior technical reviewer evaluating a ${specType} specification for production readiness. Score the spec on four dimensions (0-100 each):

1. COMPLETENESS — Are all required sections present and detailed? Are there gaps that would block a developer from implementing?
2. CONSISTENCY — Are there contradictions between sections? Do data models match pages? Do features match the tech stack?
3. FEASIBILITY — Is this technically buildable with the stated stack? Are there unrealistic assumptions?
4. QUALITY — Is the depth and specificity sufficient for production? Is it opinionated and actionable, or vague and generic?

${context ? `ADDITIONAL CONTEXT:\n${context}\n` : ""}

SPEC TO EVALUATE:
${specStr}

Return a JSON object with:
- completeness (0-100)
- consistency (0-100)
- feasibility (0-100)
- quality (0-100)
- overall (weighted: completeness 25%, consistency 25%, feasibility 25%, quality 25%)
- feedback (2-3 sentences of actionable improvement advice. If the spec is good, say what could be even better. If it needs regeneration, say exactly what's missing.)`;
}

// ── Judge function ───────────────────────────────────────────────────────

export async function judgeSpec(
  base44: any,
  specType: string,
  spec: any,
  context?: string
): Promise<JudgeScore> {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: buildJudgePrompt(specType, spec, context),
    response_json_schema: {
      type: "object",
      properties: {
        completeness: { type: "number" },
        consistency: { type: "number" },
        feasibility: { type: "number" },
        quality: { type: "number" },
        overall: { type: "number" },
        feedback: { type: "string" },
      },
    },
    // Use a DIFFERENT model family than the generators (which use claude_sonnet_4_6)
    // to break "correlated optimism" — the judge must not be the same model that
    // generated the spec, or it can certify its own mistakes.
    model: "gemini_3_1_pro",
  });

  return {
    completeness: result.completeness ?? 0,
    consistency: result.consistency ?? 0,
    feasibility: result.feasibility ?? 0,
    quality: result.quality ?? 0,
    overall: result.overall ?? 0,
    feedback: result.feedback ?? "",
  };
}

// ── Pass/fail check ──────────────────────────────────────────────────────

export function judgePassed(score: JudgeScore, threshold = JUDGE_THRESHOLD): boolean {
  return score.overall >= threshold;
}