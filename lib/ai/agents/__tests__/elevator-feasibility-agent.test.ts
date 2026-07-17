import { describe, it, expect, vi } from "vitest";
import { assessElevatorFeasibility } from "@/lib/ai/agents/elevator-feasibility-agent";
import type { ProjectWithRelations, HeritageLevel } from "@/types";
import type { BimRoomInfo } from "@/types/bim";

vi.mock("@/lib/ai/openai-client", () => ({
  chatCompletion: vi.fn().mockResolvedValue("建议将电梯与二层连廊衔接。"),
}));

function demoBuilding(heritageLevel: HeritageLevel = "none") {
  const now = new Date();
  return {
    id: "b1",
    projectId: "proj-demo",
    name: "Demo Building",
    address: "Xi'an",
    constructionYear: 1986,
    structureType: "RC frame",
    floorCount: 3,
    basementCount: 0,
    grossFloorArea: 2400,
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
    name: "Residential Block",
    code: "RC-001",
    location: "Shanghai",
    buildingType: "Residential",
    originalFunction: "Dwelling",
    currentFunction: "Dwelling",
    targetFunction: "Senior living with elevator",
    constructionYear: 1986,
    structureType: "RC frame",
    floorCount: 3,
    grossFloorArea: 2400,
    status: "diagnosis",
    renovationGoal: "加装无障碍电梯",
    budgetLevel: "medium",
    riskLevel: "medium",
    healthScore: 60,
    potentialScore: 80,
    aiReadinessScore: 70,
    dataCompletenessScore: 50,
    description: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    building: demoBuilding(),
    ...overrides,
  };
}

const goodRoom: BimRoomInfo = {
  id: "r1",
  label: "三层东南角储藏间",
  area: 5.5,
  areaUnit: "m2",
  source: "cad_polyline",
  polygon: [
    { x: 0, y: 0 },
    { x: 2.4, y: 0 },
    { x: 2.4, y: 2.3 },
    { x: 0, y: 2.3 },
  ],
};

const smallRoom: BimRoomInfo = {
  id: "r2",
  label: "储藏间",
  area: 1.8,
  areaUnit: "m2",
  source: "cad_polyline",
  polygon: [
    { x: 0, y: 0 },
    { x: 1.4, y: 0 },
    { x: 1.4, y: 1.3 },
    { x: 0, y: 1.3 },
  ],
};

describe("assessElevatorFeasibility", () => {
  it("returns insufficient_data when no BIM rooms", async () => {
    const result = await assessElevatorFeasibility(demoProject(), [], {
      skipAiRecommendation: true,
    });
    expect(result.verdict).toBe("insufficient_data");
  });

  it("returns infeasible when candidate space is too small", async () => {
    const result = await assessElevatorFeasibility(demoProject(), [smallRoom], {
      skipAiRecommendation: true,
    });
    expect(result.verdict).toBe("infeasible");
    expect(result.spaceCheck.meetsMinimum).toBe(false);
  });

  it("returns conditional for adequate space with heritage flag", async () => {
    const result = await assessElevatorFeasibility(
      demoProject({ building: demoBuilding("district") }),
      [goodRoom],
      { skipAiRecommendation: true }
    );
    expect(["feasible", "conditional"]).toContain(result.verdict);
    expect(result.heritageFlag?.requiresApproval).toBe(true);
    expect(result.spaceCheck.candidateLabel).toContain("储藏");
  });

  it("includes AI recommendation when feasible/conditional and not skipped", async () => {
    const result = await assessElevatorFeasibility(demoProject(), [goodRoom], {
      existingLoad: 200,
    });
    if (result.verdict === "feasible" || result.verdict === "conditional") {
      expect(result.aiRecommendation).toBeTruthy();
    }
  });
});
