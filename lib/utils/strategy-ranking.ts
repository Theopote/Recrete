import type { ProjectWithRelations, StrategyWithMetrics } from "@/types";
import type { StrategyLabParams } from "@/types/ai";

export type StrategyCriterionKey =
  | "cost"
  | "schedule"
  | "risk"
  | "designValue"
  | "feasibility"
  | "preservation"
  | "areaFit";

export type StrategyScoreWeights = Record<StrategyCriterionKey, number>;

export interface StrategyScoreBreakdown {
  cost: number;
  schedule: number;
  risk: number;
  designValue: number;
  feasibility: number;
  preservation: number;
  areaFit: number;
}

export interface StrategyCriterionContribution {
  key: StrategyCriterionKey;
  labelEn: string;
  labelZh: string;
  rawScore: number;
  weight: number;
  weightedPoints: number;
}

export interface StrategyRankResult {
  strategyId: string;
  rank: number;
  compositeScore: number;
  areaFitScore: number;
  breakdown: StrategyScoreBreakdown;
  contributions: StrategyCriterionContribution[];
  weights: StrategyScoreWeights;
  lifecycleBonus: number;
  summary: string;
}

export const CRITERION_META: Record<
  StrategyCriterionKey,
  { labelEn: string; labelZh: string; higherIsBetter: boolean }
> = {
  cost: { labelEn: "Cost control", labelZh: "成本可控", higherIsBetter: true },
  schedule: { labelEn: "Schedule fit", labelZh: "工期匹配", higherIsBetter: true },
  risk: { labelEn: "Risk profile", labelZh: "风险可控", higherIsBetter: true },
  designValue: { labelEn: "Design value", labelZh: "设计价值", higherIsBetter: true },
  feasibility: { labelEn: "Feasibility", labelZh: "可实施性", higherIsBetter: true },
  preservation: { labelEn: "Preservation fit", labelZh: "保留契合", higherIsBetter: true },
  areaFit: { labelEn: "Area fit", labelZh: "面积匹配", higherIsBetter: true },
};

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
    safety_upgrade: () => 85,
  };
  const fn = typeScores[strategyType];
  return fn ? fn(area) : 70;
}

export function resolveStrategyWeights(params: StrategyLabParams): StrategyScoreWeights {
  const w: StrategyScoreWeights = {
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

  const total = Object.values(w).reduce((sum, value) => sum + value, 0);
  for (const key of Object.keys(w) as StrategyCriterionKey[]) {
    w[key] /= total;
  }
  return w;
}

export function resolveStrategyLabParams(
  project: ProjectWithRelations,
  params?: Partial<StrategyLabParams>
): StrategyLabParams {
  return {
    targetFunction: params?.targetFunction ?? project.targetFunction,
    budgetLevel: params?.budgetLevel ?? project.budgetLevel,
    grossFloorArea: params?.grossFloorArea ?? project.grossFloorArea,
    preservationLevel:
      params?.preservationLevel ??
      (project.building?.heritageLevel !== "none" ? "high" : "medium"),
    constructionIntensity: params?.constructionIntensity ?? "medium",
    scheduleRequirement: params?.scheduleRequirement ?? "moderate",
    designAmbition: params?.designAmbition ?? "balanced",
    riskTolerance:
      params?.riskTolerance ?? (project.riskLevel === "high" ? "low" : "medium"),
  };
}

function buildContributions(
  breakdown: StrategyScoreBreakdown,
  weights: StrategyScoreWeights
): StrategyCriterionContribution[] {
  return (Object.keys(weights) as StrategyCriterionKey[]).map((key) => {
    const meta = CRITERION_META[key];
    const rawScore = breakdown[key];
    return {
      key,
      labelEn: meta.labelEn,
      labelZh: meta.labelZh,
      rawScore,
      weight: weights[key],
      weightedPoints: Math.round(rawScore * weights[key]),
    };
  });
}

function buildRankSummary(
  breakdown: StrategyScoreBreakdown,
  params: StrategyLabParams,
  lifecycleBonus: number
): string {
  const parts: string[] = [];
  if (breakdown.areaFit >= 85) parts.push("面积匹配度高");
  if (breakdown.cost >= 75 && params.budgetLevel === "low") parts.push("成本可控");
  if (breakdown.designValue >= 80 && params.designAmbition === "ambitious") {
    parts.push("设计价值突出");
  }
  if (breakdown.feasibility >= 80) parts.push("可实施性强");
  if (breakdown.preservation >= 80 && params.preservationLevel === "high") {
    parts.push("保留要求契合");
  }
  if (lifecycleBonus > 0) parts.push("全周期能耗优势");
  return parts.length > 0 ? parts.join(" · ") : "综合表现均衡";
}

export function buildRecommendationReason(
  rank: StrategyRankResult,
  strategyName: string,
  params: StrategyLabParams
): string {
  const topDrivers = [...rank.contributions]
    .sort((a, b) => b.weightedPoints - a.weightedPoints)
    .slice(0, 3)
    .map(
      (item) =>
        `${item.labelZh} ${item.rawScore}×${Math.round(item.weight * 100)}%=${item.weightedPoints}`
    );

  const paramHints: string[] = [];
  if (params.budgetLevel === "low") paramHints.push("预算有限");
  if (params.designAmbition === "ambitious") paramHints.push("设计进取");
  if (params.preservationLevel === "high") paramHints.push("高保留要求");
  if (params.riskTolerance === "low") paramHints.push("低风险偏好");
  if (params.scheduleRequirement === "urgent") paramHints.push("工期紧迫");

  const context =
    paramHints.length > 0 ? `（权重依据：${paramHints.join("、")}）` : "";

  return `「${strategyName}」综合 ${rank.compositeScore} 分排名第 ${rank.rank}。主要得分项：${topDrivers.join("；")}。${context}`.trim();
}

export function rankStrategies(
  strategies: StrategyWithMetrics[],
  project: ProjectWithRelations,
  params: StrategyLabParams
): StrategyRankResult[] {
  const areaM2 = params.grossFloorArea ?? project.grossFloorArea ?? 0;
  const weights = resolveStrategyWeights(params);

  const scored = strategies.map((strategy) => {
    const m = strategy.metrics;
    const areaFit = computeAreaFitScore(areaM2, strategy.type);

    const breakdown: StrategyScoreBreakdown = {
      cost: 100 - m.cost,
      schedule: 100 - m.schedule,
      risk: 100 - m.risk,
      designValue: m.designValue,
      feasibility: m.feasibility,
      preservation: m.preservationLevel,
      areaFit,
    };

    const lifecycleBonus =
      strategy.type === "energy_retrofit"
        ? Math.min(15, (100 - m.lifecycleCost) * 0.15)
        : 0;

    const contributions = buildContributions(breakdown, weights);
    const compositeScore = Math.min(
      100,
      Math.round(
        contributions.reduce((sum, item) => sum + item.weightedPoints, 0) + lifecycleBonus
      )
    );

    return {
      strategyId: strategy.id,
      rank: 0,
      compositeScore,
      areaFitScore: areaFit,
      breakdown,
      contributions,
      weights,
      lifecycleBonus,
      summary: buildRankSummary(breakdown, params, lifecycleBonus),
    };
  });

  scored.sort((a, b) => b.compositeScore - a.compositeScore);
  return scored.map((item, index) => ({ ...item, rank: index + 1 }));
}

export function attachStrategyRankings(
  strategies: StrategyWithMetrics[],
  project: ProjectWithRelations,
  params?: Partial<StrategyLabParams>
): StrategyWithMetrics[] {
  if (strategies.length === 0) return strategies;

  const resolvedParams = resolveStrategyLabParams(project, params);
  const rankings = rankStrategies(strategies, project, resolvedParams);
  const rankMap = new Map(rankings.map((entry) => [entry.strategyId, entry]));

  return strategies
    .map((strategy) => {
      const rankEntry = rankMap.get(strategy.id);
      if (!rankEntry) return strategy;
      return {
        ...strategy,
        rank: rankEntry.rank,
        compositeScore: rankEntry.compositeScore,
        areaFitScore: rankEntry.areaFitScore,
        scoreBreakdown: rankEntry.breakdown,
        scoreContributions: rankEntry.contributions,
        scoreWeights: rankEntry.weights,
        rankSummary: rankEntry.summary,
        lifecycleBonus: rankEntry.lifecycleBonus,
      };
    })
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
}
