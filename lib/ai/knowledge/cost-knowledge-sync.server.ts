import "server-only";

import { shouldUseDatabase } from "@/lib/db/resolve";
import { listMaterialPrices } from "@/lib/db/material-prices";
import { listProjectCostRecords } from "@/lib/db/project-costs";
import type { ProjectWithRelations, RenovationStrategy } from "@/types";
import type { ProjectCostRecord } from "@/types/cost";
import { recalibrateBenchmarksFromRecords } from "./benchmark-calibration";
import { listCostBenchmarks } from "./cost-benchmark-store";
import type { CostKnowledgeSnapshot } from "./cost-knowledge-sync";
import {
  costEstimatorAgent,
  type CostEstimateInput,
} from "../agents/cost-estimator-agent";

export type { CostKnowledgeSnapshot } from "./cost-knowledge-sync";

export async function syncCostKnowledgeForEstimation(): Promise<CostKnowledgeSnapshot> {
  const useDb = await shouldUseDatabase();
  const prices = await listMaterialPrices();
  const allRecords = await listProjectCostRecords();

  if (!useDb) {
    recalibrateBenchmarksFromRecords(allRecords);
  }

  const contributing = allRecords.filter(
    (record) => record.outcome !== "failure" && record.strategyType && record.actualCostPerSqm > 0
  );

  return {
    materialPriceCount: prices.length,
    materialPriceSource: useDb ? "database" : "seed",
    costRecordCount: allRecords.length,
    calibratedRecordCount: contributing.length,
    benchmarkCount: listCostBenchmarks().length,
  };
}

export async function prepareCostEstimateContext(projectId: string): Promise<{
  snapshot: CostKnowledgeSnapshot;
  projectRecords: ProjectCostRecord[];
}> {
  const snapshot = await syncCostKnowledgeForEstimation();
  const projectRecords = await listProjectCostRecords(projectId);
  return { snapshot, projectRecords };
}

export async function prepareAndEstimateProjectCost(
  project: ProjectWithRelations,
  strategy?: RenovationStrategy | null,
  input: CostEstimateInput = {}
) {
  const { snapshot, projectRecords } = await prepareCostEstimateContext(project.id);
  return costEstimatorAgent.estimateProjectCost(project, strategy, {
    ...input,
    projectCostRecords: input.projectCostRecords ?? projectRecords,
    costKnowledge: input.costKnowledge ?? snapshot,
  });
}
