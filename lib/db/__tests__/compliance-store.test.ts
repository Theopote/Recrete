import { describe, it, expect, beforeEach } from "vitest";
import { runComplianceEngine } from "@/lib/ai/compliance";
import type { ProjectWithRelations, HeritageLevel } from "@/types";
import {
  resetComplianceStore,
  saveComplianceRun,
  listComplianceRuns,
  applyComplianceDiagnosis,
  persistComplianceResult,
  filterNewComplianceDiagnosis,
} from "@/lib/db/compliance-store";
import { resetStore, getProjectById } from "@/lib/db/mock-repository";

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

function demoProject(): ProjectWithRelations {
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
  };
}

describe("compliance-store", () => {
  beforeEach(() => {
    resetComplianceStore();
    resetStore();
  });

  it("persists compliance run with checks in memory mode", async () => {
    const report = runComplianceEngine(demoProject(), {
      measurements: { stairWidth: 1.0, hasAccessibleEntrance: false },
    });

    const run = await saveComplianceRun({
      projectId: "proj-demo",
      report,
      measurements: { stairWidth: 1.0 },
    });

    expect(run.id).toBeTruthy();
    expect(run.checks?.length).toBe(report.checks.length);
    expect(run.overallCompliance).toBe(report.overallCompliance);

    const history = await listComplianceRuns("proj-demo", 5);
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(run.id);
  });

  it("writes new diagnosis items and skips duplicates", async () => {
    const report = runComplianceEngine(demoProject(), {
      measurements: { stairWidth: 1.0, hasAccessibleEntrance: false },
    });

    const diagnosisDrafts = [
      {
        title: "Evacuation stairway width",
        category: "fire_safety" as const,
        severity: "critical" as const,
        status: "identified" as const,
        description: "Below minimum width",
        evidence: "GB 50016",
        recommendation: "Widen stairs",
        requiresEngineerReview: true,
      },
      {
        title: "Accessible entrance",
        category: "accessibility" as const,
        severity: "high" as const,
        status: "identified" as const,
        description: "No accessible entrance",
        evidence: "GB 50763",
        recommendation: "Add ramp",
        requiresEngineerReview: false,
      },
    ];

    const first = await persistComplianceResult({
      projectId: "proj-demo",
      report,
      diagnosisDrafts,
      applyDiagnosis: true,
    });

    expect(first.diagnosis?.created).toHaveLength(2);
    expect(first.run.diagnosisApplied).toBe(true);
    expect(first.run.diagnosisCount).toBe(2);

    const projectAfter = await getProjectById("proj-demo");
    expect(projectAfter?.diagnosis?.length).toBeGreaterThanOrEqual(2);

    const second = await persistComplianceResult({
      projectId: "proj-demo",
      report,
      diagnosisDrafts,
      applyDiagnosis: true,
    });

    expect(second.diagnosis?.created).toHaveLength(0);
    expect(second.diagnosis?.skipped).toBe(2);
  });

  it("tags diagnosis evidence with compliance run id", async () => {
    const run = await saveComplianceRun({
      projectId: "proj-demo",
      report: runComplianceEngine(demoProject()),
    });

    const items = [
      {
        title: "Unique compliance finding",
        category: "architecture" as const,
        severity: "medium" as const,
        status: "identified" as const,
        description: "Test",
        evidence: "GB 50352",
        recommendation: "Verify",
        requiresEngineerReview: false,
      },
    ];

    const filtered = await filterNewComplianceDiagnosis("proj-demo", items);
    expect(filtered).toHaveLength(1);

    const result = await applyComplianceDiagnosis("proj-demo", run.id, items);
    expect(result.created[0].evidence).toContain(`[compliance-run:${run.id}]`);
  });
});
