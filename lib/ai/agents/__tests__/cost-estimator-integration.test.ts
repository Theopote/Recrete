import { describe, it, expect, beforeEach } from "vitest";
import { costEstimatorAgent } from "@/lib/ai/agents/cost-estimator-agent";
import { resetCostRecords } from "@/lib/ai/knowledge/cost-record-store";
import { resetCostBenchmarks } from "@/lib/ai/knowledge/cost-benchmark-store";
import { createCostRecord } from "@/lib/ai/knowledge/cost-record-store";
import { buildCostDataSourceNote } from "@/lib/ai/knowledge/cost-knowledge-sync";
import { syncCostKnowledgeForEstimation } from "@/lib/ai/knowledge/cost-knowledge-sync.server";
import type { ProjectWithRelations } from "@/types";

function sampleProject(overrides: Partial<ProjectWithRelations> = {}): ProjectWithRelations {
  return {
    id: "proj-cost-1",
    name: "Test Tower",
    code: "TT-001",
    location: "西安, 陕西",
    buildingType: "Office",
    targetFunction: "Office",
    grossFloorArea: 12000,
    status: "active",
    organizationId: "org-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    strategies: [
      {
        id: "strat-1",
        name: "Adaptive reuse",
        type: "adaptive_reuse",
        costLevel: "medium",
        scheduleLevel: "medium",
        riskLevel: "medium",
        projectId: "proj-cost-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    ...overrides,
  } as ProjectWithRelations;
}

describe("cost estimator knowledge integration", () => {
  beforeEach(() => {
    resetCostRecords();
    resetCostBenchmarks();
  });

  it("blends project actual cost records into baseline", () => {
    const project = sampleProject();
    const estimateWithout = costEstimatorAgent.estimateProjectCost(project, project.strategies![0], {
      strategyType: "adaptive_reuse",
      costKnowledge: {
        materialPriceCount: 6,
        materialPriceSource: "seed",
        costRecordCount: 0,
        calibratedRecordCount: 0,
        benchmarkCount: 9,
      },
      projectCostRecords: [],
    });

    const estimateWith = costEstimatorAgent.estimateProjectCost(project, project.strategies![0], {
      strategyType: "adaptive_reuse",
      costKnowledge: {
        materialPriceCount: 6,
        materialPriceSource: "seed",
        costRecordCount: 1,
        calibratedRecordCount: 1,
        benchmarkCount: 9,
      },
      projectCostRecords: [
        {
          id: "pcr-1",
          projectId: project.id,
          strategyType: "adaptive_reuse",
          actualCostPerSqm: 3100,
          actualTotalCost: 37_200_000,
          outcome: "success",
          region: "西北",
          city: "西安",
          buildingType: "Office",
          grossFloorArea: 12000,
          recordedAt: new Date(),
          createdAt: new Date(),
        },
      ],
    });

    expect(estimateWith.estimatedCostPerSqm).toBeGreaterThan(estimateWithout.estimatedCostPerSqm);
    expect(estimateWith.provenance.projectActualRecordCount).toBe(1);
    expect(estimateWith.provenance.baselineSources).toContain("1 project actual(s)");
    expect(estimateWith.confidence).toBeGreaterThan(estimateWithout.confidence);
  });

  it("calibrates benchmarks from cost records during sync", async () => {
    createCostRecord({
      projectId: "other-project",
      strategyType: "adaptive_reuse",
      actualCostPerSqm: 2800,
      actualTotalCost: 33_600_000,
      outcome: "success",
      region: "西北",
      city: "西安",
      buildingType: "Office",
      grossFloorArea: 12000,
    });

    const snapshot = await syncCostKnowledgeForEstimation();
    expect(snapshot.calibratedRecordCount).toBe(1);

    const project = sampleProject();
    const estimate = costEstimatorAgent.estimateProjectCost(project, project.strategies![0], {
      strategyType: "adaptive_reuse",
      costKnowledge: snapshot,
    });

    expect(estimate.provenance.benchmarkSource).toBe("calibrated");
    expect(estimate.provenance.dataSourceNote).toContain("completed project cost record");
  });

  it("builds data source note with material prices and project actuals", () => {
    const note = buildCostDataSourceNote(
      {
        materialPriceCount: 8,
        materialPriceSource: "database",
        costRecordCount: 3,
        calibratedRecordCount: 2,
        benchmarkCount: 10,
      },
      {
        projectActualRecordCount: 1,
        hasBenchmark: true,
        baselineSources: ["1 project actual(s)", "benchmark 西北"],
      }
    );

    expect(note).toContain("material prices from knowledge base");
    expect(note).toContain("completed project cost record");
    expect(note).toContain("actual cost record(s) for this project");
  });
});
