import { describe, it, expect } from "vitest";
import { runComplianceEngine } from "@/lib/ai/compliance/engine";
import { hasElevatorIntent } from "@/lib/ai/compliance/elevator-intent";
import type { ProjectWithRelations, HeritageLevel } from "@/types";

function demoBuilding(heritageLevel: HeritageLevel = "none") {
  const now = new Date();
  return {
    id: "b1",
    projectId: "proj-demo",
    name: "Demo Building",
    address: "Xi'an",
    constructionYear: 1986,
    structureType: "RC frame",
    floorCount: 8,
    basementCount: 1,
    grossFloorArea: 12800,
    currentCondition: "fair",
    heritageLevel,
    createdAt: now,
    updatedAt: now,
  };
}

function demoProject(overrides: Partial<ProjectWithRelations> = {}): ProjectWithRelations {
  return {
    id: "proj-demo",
    organizationId: "org-1",
    name: "Old Concrete Office Renewal",
    code: "RC-XA-1986-001",
    location: "Xi'an, China",
    buildingType: "Office building",
    originalFunction: "Government office",
    currentFunction: "Vacant office",
    targetFunction: "Community cultural center with elevator",
    constructionYear: 1986,
    structureType: "Reinforced concrete frame",
    floorCount: 8,
    grossFloorArea: 12800,
    status: "diagnosis",
    renovationGoal: "加装电梯，改造为社区文化中心",
    budgetLevel: "medium",
    riskLevel: "medium",
    healthScore: 58,
    potentialScore: 82,
    aiReadinessScore: 72,
    dataCompletenessScore: 58,
    description: "Demo project",
    createdAt: new Date(),
    updatedAt: new Date(),
    building: demoBuilding(),
    ...overrides,
  };
}

describe("elevator rules", () => {
  it("detects elevator intent from renovation goal", () => {
    expect(hasElevatorIntent(demoProject())).toBe(true);
    expect(
      hasElevatorIntent(
        demoProject({ renovationGoal: "外立面翻新", targetFunction: "办公" })
      )
    ).toBe(false);
  });

  it("flags non-compliant shaft dimensions", () => {
    const report = runComplianceEngine(demoProject(), {
      measurements: { candidateShaftWidth: 1.4, candidateShaftDepth: 1.3 },
    });
    const shaft = report.checks.find((c) => c.ruleId === "elevator-shaft-dimensions");
    expect(shaft?.status).toBe("non_compliant");
  });

  it("flags compliant shaft dimensions", () => {
    const report = runComplianceEngine(demoProject(), {
      measurements: { candidateShaftWidth: 2.4, candidateShaftDepth: 2.3 },
    });
    const shaft = report.checks.find((c) => c.ruleId === "elevator-shaft-dimensions");
    expect(shaft?.status).toBe("compliant");
  });

  it("triggers heritage review for protected buildings", () => {
    const report = runComplianceEngine(
      demoProject({ building: demoBuilding("district") }),
      { measurements: { candidateShaftWidth: 2.4, candidateShaftDepth: 2.3 } }
    );
    const heritage = report.checks.find((c) => c.ruleId === "elevator-heritage-review");
    expect(heritage?.status).toBe("requires_verification");
  });
});
