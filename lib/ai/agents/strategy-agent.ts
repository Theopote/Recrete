import type { DiagnosisItem, ProjectWithRelations, RenovationStrategy } from "@/types";
import type { AIInsight, StrategyLabParams } from "@/types/ai";
import { withMockDelay } from "../providers/utils";
import { mockAIService } from "../mock-ai-service";

export async function generateRenovationStrategies(
  project: ProjectWithRelations,
  diagnosisItems: DiagnosisItem[],
  _params?: StrategyLabParams
): Promise<Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  const strategies = await mockAIService.generateRenovationStrategies(project, diagnosisItems);
  return strategies.map((s) => ({
    ...s,
    designValueScore: s.type === "adaptive_reuse" ? 85 : s.type === "deep_recreation" ? 95 : 45,
    feasibilityScore: s.type === "light_renewal" ? 90 : s.type === "adaptive_reuse" ? 72 : 55,
    preservationScore: s.type === "light_renewal" ? 90 : s.type === "adaptive_reuse" ? 75 : 40,
  }));
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
