import { describe, it, expect } from "vitest";
import {
  buildRuleBasedExecutiveSummary,
  diagnosisSummaryUsesAI,
} from "@/lib/ai/diagnosis-executive-summary";
import type { DiagnosisItem, ProjectWithRelations } from "@/types";

function demoProject(): ProjectWithRelations {
  return {
    id: "p1",
    organizationId: "org-1",
    name: "Test Tower",
    code: "TT-001",
    location: "Shanghai",
    buildingType: "Office",
    originalFunction: "Office",
    currentFunction: "Vacant",
    targetFunction: "Hotel",
    constructionYear: 1995,
    structureType: "RC frame",
    floorCount: 12,
    grossFloorArea: 9000,
    status: "diagnosis",
    renovationGoal: "Adaptive reuse",
    budgetLevel: "medium",
    riskLevel: "medium",
    healthScore: 60,
    potentialScore: 75,
    aiReadinessScore: 70,
    dataCompletenessScore: 55,
    description: "Test",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function demoItem(overrides: Partial<DiagnosisItem> = {}): DiagnosisItem {
  return {
    id: "d1",
    projectId: "p1",
    title: "Carbonation depth exceeds limit",
    category: "structure",
    severity: "high",
    description: "Field samples show carbonation near rebar depth on level 3 slabs.",
    recommendation: "Commission structural assessment.",
    requiresEngineerReview: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("buildRuleBasedExecutiveSummary", () => {
  it("produces structured summary without LangChain or OpenAI", () => {
    const summary = buildRuleBasedExecutiveSummary({
      project: demoProject(),
      diagnosisItems: [
        demoItem(),
        demoItem({
          id: "d2",
          title: "Missing fire compartment survey",
          category: "fire_safety",
          severity: "critical",
        }),
      ],
      expertSummary: "Structural: 1 items; Compliance: 1 items",
    });

    expect(summary).toContain("Test Tower");
    expect(summary).toContain("Priority findings");
    expect(summary).toContain("Carbonation depth exceeds limit");
    expect(summary).toContain("Recommended next steps");
    expect(summary.length).toBeGreaterThan(200);
  });
});

describe("diagnosisSummaryUsesAI", () => {
  it("returns true when OpenAI configured without LangChain", () => {
    expect(
      diagnosisSummaryUsesAI({ langChainEnabled: false, openAIConfigured: true })
    ).toBe(true);
  });

  it("returns false when neither path is available", () => {
    expect(
      diagnosisSummaryUsesAI({ langChainEnabled: false, openAIConfigured: false })
    ).toBe(false);
  });
});
