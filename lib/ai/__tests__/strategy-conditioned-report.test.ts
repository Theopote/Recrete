import { describe, it, expect } from "vitest";
import {
  buildStrategyConditionedReportContent,
  reportTypeNeedsStrategy,
} from "@/lib/ai/strategy-conditioned-report";
import { runComplianceEngine } from "@/lib/ai/compliance";
import type { ProjectWithRelations, RenovationStrategy } from "@/types";

function demoProject(): ProjectWithRelations {
  return {
    id: "p1",
    organizationId: "org-1",
    name: "Heritage Warehouse",
    code: "HW-001",
    location: "Xi'an, China",
    buildingType: "Industrial",
    originalFunction: "Warehouse",
    currentFunction: "Vacant",
    targetFunction: "Community cultural center",
    constructionYear: 1986,
    structureType: "RC frame",
    floorCount: 4,
    grossFloorArea: 5200,
    status: "strategy",
    renovationGoal: "Light-touch cultural hub",
    budgetLevel: "medium",
    riskLevel: "medium",
    healthScore: 62,
    potentialScore: 80,
    aiReadinessScore: 70,
    dataCompletenessScore: 60,
    description: "Demo",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function demoStrategy(): RenovationStrategy {
  return {
    id: "s-light",
    projectId: "p1",
    name: "Light Renewal",
    type: "light_renewal",
    summary: "Minimal intervention preserving existing layout.",
    designGoal: "Open community program with low disruption.",
    spatialStrategy: "Retain main hall; adapt side wings.",
    structuralStrategy: "Local repairs only.",
    facadeStrategy: "Clean and repaint.",
    mepStrategy: "Upgrade HVAC zones selectively.",
    costLevel: "low",
    scheduleLevel: "low",
    riskLevel: "low",
    pros: ["Low cost", "Fast delivery"],
    cons: ["Limited program flexibility"],
    recommendationReason: "Best balance of cost and heritage preservation.",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("buildStrategyConditionedReportContent", () => {
  it("includes selected strategy and compliance remediation", () => {
    const project = demoProject();
    const strategy = demoStrategy();
    const compliance = runComplianceEngine(project);

    const { title, content } = buildStrategyConditionedReportContent({
      project,
      selectedStrategy: strategy,
      allStrategies: [strategy],
      diagnosisItems: [],
      issues: [],
      complianceReport: compliance,
    });

    expect(title).toContain("Light Renewal");
    expect(content).toContain("Selected strategy profile");
    expect(content).toContain("Compliance remediation");
    expect(content).toContain(strategy.recommendationReason!);
  });
});

describe("reportTypeNeedsStrategy", () => {
  it("flags strategy-conditioned report types", () => {
    expect(reportTypeNeedsStrategy("renovation_strategy_report")).toBe(true);
    expect(reportTypeNeedsStrategy("owner_presentation")).toBe(true);
    expect(reportTypeNeedsStrategy("diagnosis_report")).toBe(false);
  });
});
