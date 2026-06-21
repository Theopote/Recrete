import type { DiagnosisItem, ProjectWithRelations, RenovationStrategy } from "@/types";
import type { AIInsight, StrategyLabParams } from "@/types/ai";
import { withMockDelay } from "../providers/utils";
import { mockAIService } from "../mock-ai-service";
import { searchKnowledgeForProjectAsync } from "../knowledge/embedding-search";
import { runStrategyContextChain } from "../langchain/chains";

function defaultParams(project: ProjectWithRelations): StrategyLabParams {
  return {
    targetFunction: project.targetFunction,
    budgetLevel: project.budgetLevel,
    grossFloorArea: project.grossFloorArea,
    preservationLevel: project.building?.heritageLevel !== "none" ? "high" : "medium",
    constructionIntensity: "medium",
    scheduleRequirement: "moderate",
    designAmbition: "balanced",
    riskTolerance: project.riskLevel === "high" ? "low" : "medium",
  };
}

function applyParamsToStrategies(
  strategies: Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">[],
  params: StrategyLabParams
) {
  const ambitionBoost =
    params.designAmbition === "ambitious"
      ? " Emphasis on landmark design quality and bold spatial moves."
      : params.designAmbition === "conservative"
        ? " Prioritize code compliance and minimal intervention."
        : "";

  const preservationNote =
    params.preservationLevel === "high"
      ? " Heritage and character-defining elements must be preserved."
      : params.preservationLevel === "low"
        ? " Greater freedom for structural and envelope modification."
        : "";

  return strategies.map((s) => ({
    ...s,
    summary: `${s.summary}${ambitionBoost}${preservationNote}`,
    designGoal:
      params.designAmbition === "ambitious" && s.type === "adaptive_reuse"
        ? `${s.designGoal} Push for signature architectural identity.`
        : s.designGoal,
    costLevel:
      params.budgetLevel === "low" && s.costLevel === "high" ? ("medium" as const) : s.costLevel,
    riskLevel:
      params.riskTolerance === "low" && s.riskLevel === "high" ? ("medium" as const) : s.riskLevel,
  }));
}

export async function generateRenovationStrategies(
  project: ProjectWithRelations,
  diagnosisItems: DiagnosisItem[],
  params?: StrategyLabParams
): Promise<Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  const resolvedParams = params ?? defaultParams(project);
  const strategies = await mockAIService.generateRenovationStrategies(project, diagnosisItems);
  const enriched = applyParamsToStrategies(strategies, resolvedParams);

  const cases = await searchKnowledgeForProjectAsync(project, resolvedParams.targetFunction, 3);

  const diagnosisSummary = diagnosisItems
    .filter((d) => d.severity === "critical" || d.severity === "high")
    .map((d) => `${d.title} (${d.severity})`)
    .join("; ");

  const contextBrief = await runStrategyContextChain({
    project,
    params: resolvedParams,
    knowledge: cases,
    diagnosisSummary,
  });

  if (cases.length > 0) {
    enriched[1] = {
      ...enriched[1],
      summary: `${enriched[1].summary}\n\nReference case: ${cases[0].title} — ${cases[0].excerpt}`,
    };
  }

  if (contextBrief && enriched[0]) {
    enriched[0] = {
      ...enriched[0],
      designGoal: `${enriched[0].designGoal}\n\n[AI Context] ${contextBrief.slice(0, 300)}`,
    };
  }

  const areaM2 = resolvedParams.grossFloorArea ?? project.grossFloorArea ?? 0;

  return enriched.map((s) => {
    let feasibilityScore =
      s.type === "light_renewal" ? 90 : s.type === "adaptive_reuse" ? 72 : 55;
    if (areaM2 > 0) {
      if (s.type === "deep_recreation" && areaM2 < 1500) feasibilityScore -= 15;
      if (s.type === "light_renewal" && areaM2 > 10000) feasibilityScore -= 10;
      if (s.type === "energy_retrofit" && areaM2 > 500) feasibilityScore += 5;
    }

    const areaNote =
      areaM2 > 0
        ? ` Total floor area ${areaM2.toLocaleString()} m² considered in feasibility scoring.`
        : "";

    return {
      ...s,
      summary: `${s.summary}${areaNote}`,
      designValueScore: s.type === "adaptive_reuse" ? 85 : s.type === "deep_recreation" ? 95 : 45,
      feasibilityScore: Math.max(30, Math.min(100, feasibilityScore)),
      preservationScore:
        resolvedParams.preservationLevel === "high"
          ? 88
          : s.type === "light_renewal"
            ? 90
            : s.type === "adaptive_reuse"
              ? 75
              : 40,
    };
  });
}

export async function refineStrategy(
  project: ProjectWithRelations,
  strategy: RenovationStrategy,
  instruction: string
): Promise<Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">> {
  return withMockDelay(() => {
    const lower = instruction.toLowerCase();
    const updated = { ...strategy };

    if (lower.includes("ambitious") || lower.includes("bold") || lower.includes("激进") || lower.includes("更大胆")) {
      updated.designGoal = `${strategy.designGoal} Elevated design ambition with signature spatial moments.`;
      updated.facadeStrategy = `Bold new facade expression — ${strategy.facadeStrategy}`;
      updated.costLevel = strategy.costLevel === "low" ? "medium" : "high";
      updated.riskLevel = strategy.riskLevel === "low" ? "medium" : "high";
      updated.designValueScore = Math.min(100, (strategy.designValueScore ?? 70) + 15);
    }

    if (lower.includes("conservative") || lower.includes("保守") || lower.includes("lower cost") || lower.includes("降低成本")) {
      updated.costLevel = "low";
      updated.scheduleLevel = "low";
      updated.riskLevel = "low";
      updated.structuralStrategy = `Minimize structural intervention — ${strategy.structuralStrategy}`;
      updated.feasibilityScore = Math.min(100, (strategy.feasibilityScore ?? 70) + 10);
    }

    if (lower.includes("facade") || lower.includes("立面") || lower.includes("envelope")) {
      updated.facadeStrategy = `Revised facade approach: high-performance envelope with distinctive cladding rhythm. ${strategy.facadeStrategy}`;
      updated.summary = `${strategy.summary} Facade strategy refined per iteration request.`;
    }

    if (lower.includes("rooftop") || lower.includes("屋顶") || lower.includes("terrace")) {
      updated.spatialStrategy = `${strategy.spatialStrategy} Add rooftop terrace program if structural capacity verified.`;
      updated.structuralStrategy = `${strategy.structuralStrategy} Include rooftop load assessment and potential strengthening.`;
    }

    if (lower.includes("preserve") || lower.includes("heritage") || lower.includes("保留") || lower.includes("遗产")) {
      updated.preservationScore = Math.min(100, (strategy.preservationScore ?? 70) + 15);
      updated.spatialStrategy = `Heritage-sensitive approach — ${strategy.spatialStrategy}`;
    }

    updated.summary = `${strategy.summary}\n\n[Iteration] ${instruction.trim()}`;
    updated.name = strategy.name.includes("(refined)")
      ? strategy.name
      : `${strategy.name} (refined)`;

    return {
      name: updated.name,
      type: updated.type,
      summary: updated.summary,
      designGoal: updated.designGoal,
      spatialStrategy: updated.spatialStrategy,
      structuralStrategy: updated.structuralStrategy,
      facadeStrategy: updated.facadeStrategy,
      mepStrategy: updated.mepStrategy,
      costLevel: updated.costLevel,
      scheduleLevel: updated.scheduleLevel,
      riskLevel: updated.riskLevel,
      designValueScore: updated.designValueScore,
      feasibilityScore: updated.feasibilityScore,
      preservationScore: updated.preservationScore,
      pros: updated.pros,
      cons: updated.cons,
      recommendationReason: updated.recommendationReason,
    };
  }, 900);
}

export async function compareStrategies(strategies: RenovationStrategy[]) {
  return withMockDelay(
    () =>
      strategies.map((s) => ({
        id: s.id,
        name: s.name,
        costLevel: s.costLevel,
        scheduleLevel: s.scheduleLevel,
        riskLevel: s.riskLevel,
        designValueScore: s.designValueScore ?? 50,
        feasibilityScore: s.feasibilityScore ?? 50,
        preservationScore: s.preservationScore ?? 50,
        recommended: !!s.recommendationReason,
      })),
    400
  );
}

export async function recommendStrategy(
  project: ProjectWithRelations,
  strategies: RenovationStrategy[]
): Promise<{ strategyId: string; reason: string; insight: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt"> } | null> {
  return withMockDelay(() => {
    const recommended = strategies.find((s) => s.recommendationReason) ?? strategies[0];
    if (!recommended) return null;

    return {
      strategyId: recommended.id,
      reason: recommended.recommendationReason ?? `${recommended.name} best aligns with ${project.targetFunction} goals.`,
      insight: {
        title: `Recommended: ${recommended.name}`,
        type: "design_strategy",
        priority: "medium",
        summary: recommended.summary,
        evidence: `${strategies.length} strategies compared for ${project.name}`,
        recommendation: recommended.recommendationReason ?? recommended.summary,
        confidence: 0.84,
        status: "open",
        sourceType: "strategy",
        sourceId: recommended.id,
      },
    };
  }, 500);
}