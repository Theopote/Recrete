import { describe, it, expect } from "vitest";
import { detectPipelineClashes } from "@/lib/ai/agents/mep-agent";
import {
  isDuplicateMepClashIssue,
  mepClashIssueKey,
  persistMepClashIssues,
} from "@/lib/db/mep-clash-store";
import { resetStore } from "@/lib/db/mock-repository";
import type { ProjectWithRelations } from "@/types";

function demoProject(overrides: Partial<ProjectWithRelations> = {}): ProjectWithRelations {
  return {
    id: "proj-demo",
    organizationId: "org-1",
    name: "Office Renewal",
    code: "RC-001",
    location: "Xi'an, China",
    buildingType: "Office",
    originalFunction: "Government office",
    currentFunction: "Vacant office",
    targetFunction: "Community cultural center",
    constructionYear: 1986,
    structureType: "RC frame",
    floorCount: 8,
    grossFloorArea: 12800,
    status: "diagnosis",
    renovationGoal: "Adaptive reuse",
    budgetLevel: "medium",
    riskLevel: "medium",
    healthScore: 58,
    potentialScore: 82,
    aiReadinessScore: 72,
    dataCompletenessScore: 58,
    description: "Demo",
    createdAt: new Date(),
    updatedAt: new Date(),
    building: null,
    ...overrides,
  };
}

describe("mep pipeline clash detection", () => {
  it("detects shaft overcrowding when risers exceed shaft area", () => {
    const report = detectPipelineClashes(demoProject(), {
      shaftWidthMm: 900,
      shaftDepthMm: 900,
      riserCount: 5,
    });

    expect(report.clashCount).toBeGreaterThan(0);
    expect(report.clashes.some((c) => c.id === "shaft-overcrowding")).toBe(true);
    expect(report.clashes[0]?.title).toMatchObject({ en: expect.any(String), zh: expect.any(String) });
  });

  it("detects plenum clearance conflict", () => {
    const report = detectPipelineClashes(demoProject(), {
      ceilingPlenumMm: 400,
      mainBeamDepthMm: 350,
      hvacMainDuctWidthMm: 400,
    });

    const plenum = report.clashes.find((c) => c.id === "plenum-clearance");
    expect(plenum).toBeDefined();
    expect(plenum?.requiredClearanceMm).toBe(900);
    expect(plenum?.clearanceMm).toBe(400);
  });

  it("detects function-change shaft verification when dimensions missing", () => {
    const report = detectPipelineClashes(demoProject());

    expect(report.clashes.some((c) => c.id === "function-change-shaft")).toBe(true);
  });

  it("returns empty clashes when inputs are adequate", () => {
    const report = detectPipelineClashes(
      demoProject({ currentFunction: "Office", targetFunction: "Office" }),
      {
        shaftWidthMm: 1600,
        shaftDepthMm: 1200,
        riserCount: 2,
        ceilingPlenumMm: 900,
        mainBeamDepthMm: 300,
        hvacMainDuctWidthMm: 350,
        floorToFloorHeightM: 3.6,
        electricalCapacityKva: 150,
        requiredElectricalKva: 120,
        plumbingCondition: "good",
      }
    );

    expect(report.clashCount).toBe(0);
  });
});

describe("mep clash issue persistence", () => {
  it("creates mep_conflict issues and deduplicates by clash id", async () => {
    resetStore();
    const clashes = detectPipelineClashes(demoProject(), {
      shaftWidthMm: 900,
      shaftDepthMm: 900,
      riserCount: 5,
    }).clashes;

    const first = await persistMepClashIssues({
      projectId: "proj-demo",
      clashes,
      existingIssues: [],
      locale: "zh",
    });
    expect(first.created.length).toBeGreaterThan(0);
    expect(first.created.every((issue) => issue.category === "mep_conflict")).toBe(true);
    expect(first.created.every((issue) => issue.aiDetected)).toBe(true);

    const second = await persistMepClashIssues({
      projectId: "proj-demo",
      clashes,
      existingIssues: first.created,
      locale: "zh",
    });
    expect(second.created.length).toBe(0);
    expect(second.skipped).toBe(clashes.length);
  });

  it("identifies duplicate open issues by key prefix", () => {
    const key = mepClashIssueKey("shaft-overcrowding");
    expect(
      isDuplicateMepClashIssue(
        [
          {
            id: "issue-1",
            projectId: "proj-demo",
            title: `${key} Vertical shaft overcrowding`,
            category: "mep_conflict",
            priority: "high",
            status: "open",
            description: "test",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        "shaft-overcrowding"
      )
    ).toBe(true);
  });
});
