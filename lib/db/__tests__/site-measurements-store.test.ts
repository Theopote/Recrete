import { describe, it, expect, beforeEach } from "vitest";
import {
  resetSiteMeasurementsStore,
  resolveProjectMeasurements,
  getProjectSiteMeasurementsWithFallback,
  updateProjectSiteMeasurements,
} from "@/lib/db/site-measurements-store";
import { resetComplianceStore, saveComplianceRun } from "@/lib/db/compliance-store";
import { runComplianceEngine } from "@/lib/ai/compliance";

describe("site measurements store", () => {
  beforeEach(() => {
    resetSiteMeasurementsStore();
    resetComplianceStore();
  });

  it("falls back to last compliance run when project store is empty", async () => {
    const projectId = "proj-measurements";
    const report = runComplianceEngine(
      {
        id: projectId,
        organizationId: "org-1",
        name: "Demo",
        code: "D-1",
        location: "Xi'an",
        buildingType: "Office",
        originalFunction: "Office",
        currentFunction: "Vacant",
        targetFunction: "Community center",
        constructionYear: 1986,
        structureType: "RC",
        floorCount: 6,
        grossFloorArea: 5000,
        status: "diagnosis",
        renovationGoal: "Reuse",
        budgetLevel: "medium",
        riskLevel: "medium",
        healthScore: 50,
        potentialScore: 50,
        aiReadinessScore: 50,
        dataCompletenessScore: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { measurements: { stairWidth: 1.25, ceilingHeight: 2.95 } }
    );

    await saveComplianceRun({
      projectId,
      report,
      measurements: { stairWidth: 1.25, ceilingHeight: 2.95 },
    });

    const resolved = await resolveProjectMeasurements(projectId);
    expect(resolved.stairWidth).toBe(1.25);
    expect(resolved.ceilingHeight).toBe(2.95);
  });

  it("prefers stored project measurements over history", async () => {
    const projectId = "proj-priority";
    const report = runComplianceEngine(
      {
        id: projectId,
        organizationId: "org-1",
        name: "Demo",
        code: "D-2",
        location: "Xi'an",
        buildingType: "Office",
        originalFunction: "Office",
        currentFunction: "Vacant",
        targetFunction: "Community center",
        constructionYear: 1986,
        structureType: "RC",
        floorCount: 6,
        grossFloorArea: 5000,
        status: "diagnosis",
        renovationGoal: "Reuse",
        budgetLevel: "medium",
        riskLevel: "medium",
        healthScore: 50,
        potentialScore: 50,
        aiReadinessScore: 50,
        dataCompletenessScore: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { measurements: { stairWidth: 1.0 } }
    );

    await saveComplianceRun({
      projectId,
      report,
      measurements: { stairWidth: 1.0, ceilingHeight: 2.8 },
    });

    await updateProjectSiteMeasurements(projectId, {
      measurements: { stairWidth: 1.3 },
    });

    const resolved = await resolveProjectMeasurements(projectId);
    expect(resolved.stairWidth).toBe(1.3);
    expect(resolved.ceilingHeight).toBe(2.8);
  });

  it("returns history fallback metadata for the form", async () => {
    const projectId = "proj-fallback";
    const report = runComplianceEngine(
      {
        id: projectId,
        organizationId: "org-1",
        name: "Demo",
        code: "D-3",
        location: "Xi'an",
        buildingType: "Office",
        originalFunction: "Office",
        currentFunction: "Vacant",
        targetFunction: "Community center",
        constructionYear: 1986,
        structureType: "RC",
        floorCount: 6,
        grossFloorArea: 5000,
        status: "diagnosis",
        renovationGoal: "Reuse",
        budgetLevel: "medium",
        riskLevel: "medium",
        healthScore: 50,
        potentialScore: 50,
        aiReadinessScore: 50,
        dataCompletenessScore: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { measurements: { windowUValue: 2.6 } }
    );

    await saveComplianceRun({
      projectId,
      report,
      measurements: { windowUValue: 2.6 },
    });

    const response = await getProjectSiteMeasurementsWithFallback(projectId);
    expect(response.historyFallback.windowUValue).toBe(2.6);
    expect(response.historyRunId).toBeTruthy();
  });
});
