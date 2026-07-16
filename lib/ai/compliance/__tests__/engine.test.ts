import { describe, it, expect } from "vitest";
import { runComplianceEngine, getScenariosForProject } from "@/lib/ai/compliance";
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
    targetFunction: "Community cultural center",
    constructionYear: 1986,
    structureType: "Reinforced concrete frame",
    floorCount: 8,
    grossFloorArea: 12800,
    status: "diagnosis",
    renovationGoal: "Transform into public cultural hub",
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

describe("compliance engine", () => {
  it("resolves scenarios for function conversion and public target", () => {
    const scenarios = getScenariosForProject(demoProject());
    expect(scenarios).toContain("function_conversion");
    expect(scenarios).toContain("public_building_renovation");
    expect(scenarios).toContain("pre_renovation_inspection");
  });

  it("flags non-compliant stair width and fire compartment", () => {
    const report = runComplianceEngine(demoProject(), {
      measurements: {
        stairWidth: 1.0,
        fireCompartmentArea: 3200,
        ceilingHeight: 2.9,
        hasAccessibleEntrance: false,
      },
    });

    const stair = report.checks.find((c) => c.ruleId === "evacuation-stair-width");
    const fire = report.checks.find((c) => c.ruleId === "fire-compartment-area");
    const access = report.checks.find((c) => c.ruleId === "accessible-entrance");

    expect(stair?.status).toBe("non_compliant");
    expect(fire?.status).toBe("non_compliant");
    expect(access?.status).toBe("non_compliant");
    expect(report.overallCompliance).toBe("non_compliant");
    expect(report.criticalIssues.length).toBeGreaterThan(0);
  });

  it("passes when measurements meet code limits", () => {
    const report = runComplianceEngine(demoProject(), {
      measurements: {
        stairWidth: 1.3,
        fireCompartmentArea: 2000,
        ceilingHeight: 3.0,
        hasAccessibleEntrance: true,
        windowUValue: 2.0,
      },
    });

    const failed = report.checks.filter((c) => c.status === "non_compliant");
    expect(failed.length).toBe(0);
    expect(report.overallCompliance).toBe("compliant");
  });

  it("includes heritage rules when building has heritage level", () => {
    const report = runComplianceEngine(
      demoProject({
        building: demoBuilding("provincial"),
      })
    );

    const heritage = report.checks.filter((c) => c.category === "heritage");
    expect(heritage.length).toBeGreaterThanOrEqual(2);
    expect(report.scenarios).toContain("heritage_renovation");
  });

  it("returns bilingual remediation for requires_verification checks", () => {
    const report = runComplianceEngine(demoProject());

    const verificationChecks = report.checks.filter((c) => c.status === "requires_verification");
    expect(verificationChecks.length).toBeGreaterThan(0);
    for (const check of verificationChecks) {
      expect(check.remediation).toMatchObject({
        en: expect.any(String),
        zh: expect.any(String),
      });
    }

    const ceiling = report.checks.find((c) => c.ruleId === "ceiling-height");
    expect(ceiling?.remediation).toMatchObject({
      en: expect.stringContaining("Survey ceiling"),
      zh: expect.stringContaining("净高"),
    });
  });

  it("returns bilingual remediation and recommendations", () => {
    const report = runComplianceEngine(demoProject(), {
      measurements: {
        stairWidth: 1.0,
        fireCompartmentArea: 3200,
        ceilingHeight: 2.9,
        hasAccessibleEntrance: false,
      },
    });

    const stair = report.checks.find((c) => c.ruleId === "evacuation-stair-width");
    expect(stair?.remediation).toMatchObject({
      en: expect.stringContaining("Widen stairs"),
      zh: expect.stringContaining("加宽楼梯"),
    });
    expect(report.recommendations.some((r) => typeof r === "object" && "zh" in r)).toBe(true);
    expect(report.criticalIssues.every((i) => typeof i === "object" && "en" in i && "zh" in i)).toBe(
      true
    );
  });
});
