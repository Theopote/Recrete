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
import { inferRegion } from "./prompt-context";
import {
  formatWebSearchSnippets,
  isWebSearchConfigured,
  searchMarketCostsOnline,
} from "./web-search.server";
import type { MarketCostWebContext } from "./cost-knowledge-sync";

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

export async function fetchMarketCostWebNote(
  context: MarketCostWebContext
): Promise<string | undefined> {
  if (!isWebSearchConfigured()) return undefined;

  const web = await searchMarketCostsOnline({
    region: context.region,
    buildingType: context.buildingType,
    strategyType: context.strategyType,
  });

  if (web.results.length === 0) return undefined;

  return formatWebSearchSnippets(web.results, {
    prefix: "联网造价参考（需本地核实）",
    maxItems: 2,
  });
}

export async function prepareAndEstimateProjectCost(
  project: ProjectWithRelations,
  strategy?: RenovationStrategy | null,
  input: CostEstimateInput = {}
) {
  const { snapshot, projectRecords } = await prepareCostEstimateContext(project.id);
  const region = inferRegion(project.location);
  const webMarketNote =
    input.webMarketNote ??
    (await fetchMarketCostWebNote({
      region,
      buildingType: project.buildingType,
      strategyType: input.strategyType ?? strategy?.type,
    }));

  return costEstimatorAgent.estimateProjectCost(project, strategy, {
    ...input,
    projectCostRecords: input.projectCostRecords ?? projectRecords,
    costKnowledge: input.costKnowledge ?? snapshot,
    webMarketNote,
  });
}
