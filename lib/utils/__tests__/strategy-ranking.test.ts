import { describe, expect, it } from "vitest";
import {
  buildRecommendationReason,
  computeAreaFitScore,
  rankStrategies,
  resolveStrategyWeights,
} from "@/lib/utils/strategy-ranking";
import type { ProjectWithRelations, RenovationStrategy, StrategyWithMetrics } from "@/types";
import type { StrategyLabParams } from "@/types/ai";

const baseProject = {
  id: "proj-1",
  grossFloorArea: 3200,
  targetFunction: "Community cultural center",
  budgetLevel: "medium",
  riskLevel: "medium",
  building: { heritageLevel: "none" },
} as ProjectWithRelations;

const baseParams: StrategyLabParams = {
  targetFunction: "Community cultural center",
  budgetLevel: "medium",
  grossFloorArea: 3200,
  preservationLevel: "medium",
  constructionIntensity: "medium",
  scheduleRequirement: "moderate",
  designAmbition: "balanced",
  riskTolerance: "medium",
};

function strategy(
  overrides: Partial<RenovationStrategy> & Pick<RenovationStrategy, "id" | "name" | "type">,
  metricsOverrides?: Partial<StrategyWithMetrics["metrics"]>
): StrategyWithMetrics {
  const base: RenovationStrategy = {
    projectId: "proj-1",
    summary: "Test",
    designGoal: "Test",
    spatialStrategy: "Test",
    structuralStrategy: "Test",
    facadeStrategy: "Test",
    mepStrategy: "Test",
    costLevel: "medium",
    scheduleLevel: "medium",
    riskLevel: "medium",
    pros: [],
    cons: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  const metrics = {
    cost: 50,
    schedule: 50,
    risk: 50,
    designValue: 60,
    constructionDifficulty: 50,
    preservationLevel: 65,
    feasibility: 70,
    lifecycleCost: 50,
    ...metricsOverrides,
  };
  return { ...base, metrics };
}

describe("strategy ranking", () => {
  it("increases cost weight when budget is low", () => {
    const balanced = resolveStrategyWeights(baseParams);
    const lowBudget = resolveStrategyWeights({ ...baseParams, budgetLevel: "low" });
    expect(lowBudget.cost).toBeGreaterThan(balanced.cost);
    expect(lowBudget.designValue).toBeLessThan(balanced.designValue);
  });

  it("scores adaptive reuse higher for mid-size buildings", () => {
    expect(computeAreaFitScore(3200, "adaptive_reuse")).toBeGreaterThan(
      computeAreaFitScore(3200, "deep_recreation")
    );
  });

  it("ranks strategies deterministically with explainable contributions", () => {
    const strategies = [
      strategy(
        {
          id: "s-light",
          name: "Light Renewal",
          type: "light_renewal",
          costLevel: "low",
          scheduleLevel: "low",
          riskLevel: "low",
          feasibilityScore: 90,
        },
        { cost: 25, schedule: 25, risk: 25, feasibility: 90, designValue: 45, preservationLevel: 90 }
      ),
      strategy(
        {
          id: "s-adaptive",
          name: "Adaptive Reuse",
          type: "adaptive_reuse",
          costLevel: "medium",
          scheduleLevel: "medium",
          riskLevel: "medium",
          designValueScore: 88,
          feasibilityScore: 78,
        },
        { cost: 50, schedule: 50, risk: 50, feasibility: 78, designValue: 88, preservationLevel: 75 }
      ),
      strategy(
        {
          id: "s-deep",
          name: "Deep Recreation",
          type: "deep_recreation",
          costLevel: "high",
          scheduleLevel: "high",
          riskLevel: "high",
          designValueScore: 95,
          feasibilityScore: 52,
        },
        { cost: 85, schedule: 85, risk: 85, feasibility: 52, designValue: 95, preservationLevel: 35 }
      ),
    ];

    const rankings = rankStrategies(strategies, baseProject, baseParams);
    expect(rankings).toHaveLength(3);
    expect(rankings[0].rank).toBe(1);
    expect(rankings[0].contributions).toHaveLength(7);
    expect(rankings[0].contributions.reduce((sum, item) => sum + item.weightedPoints, 0)).toBeLessThanOrEqual(
      rankings[0].compositeScore
    );

    const topContributionSum = rankings[0].contributions.reduce(
      (sum, item) => sum + item.weightedPoints,
      0
    );
    expect(topContributionSum).toBeGreaterThan(0);
  });

  it("prefers lower-cost strategies when budget is low", () => {
    const strategies = [
      strategy(
        {
          id: "s-light",
          name: "Light Renewal",
          type: "light_renewal",
          costLevel: "low",
          scheduleLevel: "low",
          riskLevel: "low",
        },
        { cost: 25, schedule: 25, risk: 25, designValue: 45, preservationLevel: 90, feasibility: 88 }
      ),
      strategy(
        {
          id: "s-deep",
          name: "Deep Recreation",
          type: "deep_recreation",
          costLevel: "high",
          scheduleLevel: "high",
          riskLevel: "high",
          designValueScore: 98,
        },
        { cost: 90, schedule: 90, risk: 90, designValue: 98, preservationLevel: 35, feasibility: 55 }
      ),
    ];

    const rankings = rankStrategies(strategies, baseProject, {
      ...baseParams,
      budgetLevel: "low",
    });

    expect(rankings[0].strategyId).toBe("s-light");
  });

  it("builds a human-readable recommendation reason", () => {
    const rankings = rankStrategies(
      [
        strategy(
          {
            id: "s-adaptive",
            name: "Adaptive Reuse",
            type: "adaptive_reuse",
            costLevel: "medium",
            scheduleLevel: "medium",
            riskLevel: "medium",
            designValueScore: 88,
          },
          { cost: 50, schedule: 50, risk: 50, designValue: 88, preservationLevel: 75, feasibility: 72 }
        ),
      ],
      baseProject,
      baseParams
    );

    const reason = buildRecommendationReason(rankings[0], "Adaptive Reuse", baseParams);
    expect(reason).toContain("Adaptive Reuse");
    expect(reason).toContain("综合");
    expect(reason).toContain("×");
  });
});
