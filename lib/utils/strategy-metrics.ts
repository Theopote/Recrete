import { levelToPercent } from "@/lib/utils";
import { computeLifecycleCostScore } from "@/lib/ai/agents/cost-risk-agent";
import type { ProjectWithRelations, RenovationStrategy, StrategyComparisonMetrics } from "@/types";

export function computeStrategyMetrics(
  strategy: Pick<
    RenovationStrategy,
    "costLevel" | "scheduleLevel" | "riskLevel" | "type" | "feasibilityScore"
  >,
  project?: ProjectWithRelations | null,
  allStrategies?: RenovationStrategy[]
): StrategyComparisonMetrics {
  const cost = levelToPercent(strategy.costLevel);
  const schedule = levelToPercent(strategy.scheduleLevel);
  const risk = levelToPercent(strategy.riskLevel);

  const designValueMap: Record<string, number> = {
    light_renewal: 40,
    medium_renovation: 60,
    deep_recreation: 95,
    adaptive_reuse: 85,
    facade_upgrade: 70,
    energy_retrofit: 55,
    safety_upgrade: 45,
  };

  const preservationMap: Record<string, number> = {
    light_renewal: 90,
    medium_renovation: 70,
    deep_recreation: 35,
    adaptive_reuse: 75,
    facade_upgrade: 60,
    energy_retrofit: 65,
    safety_upgrade: 80,
  };

  const lifecycleCost =
    project != null
      ? computeLifecycleCostScore(project, strategy, allStrategies)
      : cost;

  return {
    cost,
    schedule,
    risk,
    designValue: designValueMap[strategy.type] ?? 55,
    constructionDifficulty: Math.round((cost + schedule) / 2),
    preservationLevel: preservationMap[strategy.type] ?? 60,
    feasibility:
      strategy.feasibilityScore ??
      (strategy.type === "light_renewal" ? 88 : strategy.type === "adaptive_reuse" ? 72 : 55),
    lifecycleCost,
  };
}
