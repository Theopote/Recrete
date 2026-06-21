import type { ProjectWithRelations, StrategyWithMetrics } from "@/types";
import type { StrategyLabParams } from "@/types/ai";

export interface StrategyRankResult {
  strategyId: string;
  rank: number;
  compositeScore: number;
  areaFitScore: number;
  breakdown: {
    cost: number;
    schedule: number;
    risk: number;
    designValue: number;
    feasibility: number;
    preservation: number;
    areaFit: number;
  };
  summary: string;
}

/** Area fit: how well strategy type matches available floor area */
export function computeAreaFitScore(
  grossFloorArea: number,
  strategyType: string
): number {
  const area = grossFloorArea || 1;
  const typeScores: Record<string, (a: number) => number> = {
    light_renewal: (a) => (a < 500 ? 95 : a < 2000 ? 88 : a < 8000 ? 72 : 58),
    adaptive_reuse: (a) => (a < 800 ? 70 : a < 5000 ? 92 : a < 20000 ? 85 : 78),
    medium_renovation: (a) => (a < 800 ? 70 : a < 5000 ? 92 : a < 20000 ? 85 : 78),
    deep_recreation: (a) => (a < 1500 ? 55 : a < 10000 ? 88 : a < 50000 ? 95 : 82),
    energy_retrofit: (a) => (a < 300 ? 65 : a < 15000 ? 90 : 85),
    facade_upgrade: (a) => (a < 500 ? 75 : 88),
    safety_upgrade: (a) => 85,
  };
  const fn = typeScores[strategyType];
  return fn ? fn(area) : 70;
}

function paramWeights(params: StrategyLabParams) {
  const w = {
    cost: 0.12,
    schedule: 0.08,
    risk: 0.12,
    designValue: 0.18,
    feasibility: 0.2,
    preservation: 0.1,
    areaFit: 0.2,
  };

  if (params.budgetLevel === "low") {
    w.cost = 0.22;
    w.designValue = 0.12;
  } else if (params.budgetLevel === "premium" || params.budgetLevel === "high") {
    w.designValue = 0.28;
    w.cost = 0.08;
  }

  if (params.designAmbition === "ambitious") {
    w.designValue += 0.1;
    w.preservation -= 0.05;
  } else if (params.designAmbition === "conservative") {
    w.preservation += 0.1;
    w.risk += 0.05;
    w.designValue -= 0.08;
  }

  if (params.preservationLevel === "high") {
    w.preservation += 0.12;
    w.designValue -= 0.05;
  }

  if (params.riskTolerance === "low") {
    w.risk += 0.1;
    w.feasibility += 0.08;
  }

  if (params.scheduleRequirement === "urgent") {
    w.schedule += 0.12;
    w.feasibility += 0.05;
  }

  const total = Object.values(w).reduce((s, v) => s + v, 0);
  for (const key of Object.keys(w) as (keyof typeof w)[]) {
    w[key] /= total;
  }
  return w;
}

export function rankStrategies(
  strategies: StrategyWithMetrics[],
  project: ProjectWithRelations,
  params: StrategyLabParams
): StrategyRankResult[] {
  const areaM2 = params.grossFloorArea ?? project.grossFloorArea ?? 0;
  const weights = paramWeights(params);

  const scored = strategies.map((strategy) => {
    const m = strategy.metrics;
    const areaFit = computeAreaFitScore(areaM2, strategy.type);

    const costScore = 100 - m.cost;
    const scheduleScore = 100 - m.schedule;
    const riskScore = 100 - m.risk;
    const lifecycleBonus =
      strategy.type === "energy_retrofit" ? Math.min(15, (100 - m.lifecycleCost) * 0.15) : 0;

    const compositeScore = Math.round(
      costScore * weights.cost +
        scheduleScore * weights.schedule +
        riskScore * weights.risk +
        m.designValue * weights.designValue +
        m.feasibility * weights.feasibility +
        m.preservationLevel * weights.preservation +
        areaFit * weights.areaFit +
        lifecycleBonus
    );

    const parts: string[] = [];
    if (areaFit >= 85) parts.push("面积匹配度高");
    if (costScore >= 75 && params.budgetLevel === "low") parts.push("成本可控");
    if (m.designValue >= 80 && params.designAmbition === "ambitious") parts.push("设计价值突出");
    if (m.feasibility >= 80) parts.push("可实施性强");
    if (strategy.recommendationReason) parts.push("AI 推荐");

    return {
      strategyId: strategy.id,
      rank: 0,
      compositeScore: Math.min(100, compositeScore),
      areaFitScore: areaFit,
      breakdown: {
        cost: costScore,
        schedule: scheduleScore,
        risk: riskScore,
        designValue: m.designValue,
        feasibility: m.feasibility,
        preservation: m.preservationLevel,
        areaFit,
      },
      summary: parts.length > 0 ? parts.join(" · ") : "综合表现均衡",
    };
  });

  scored.sort((a, b) => b.compositeScore - a.compositeScore);
  return scored.map((item, index) => ({ ...item, rank: index + 1 }));
}
