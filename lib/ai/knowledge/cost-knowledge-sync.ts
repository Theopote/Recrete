import { shouldUseDatabase } from "@/lib/db/resolve";
import { listMaterialPrices } from "@/lib/db/material-prices";
import { listProjectCostRecords } from "@/lib/db/project-costs";
import { recalibrateBenchmarksFromRecords } from "./benchmark-calibration";
import { listCostBenchmarks } from "./cost-benchmark-store";
import type { ProjectCostRecord } from "@/types/cost";

export interface CostKnowledgeSnapshot {
  materialPriceCount: number;
  materialPriceSource: "database" | "seed";
  costRecordCount: number;
  calibratedRecordCount: number;
  benchmarkCount: number;
}

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

export function buildCostDataSourceNote(
  snapshot: CostKnowledgeSnapshot,
  options?: {
    projectActualRecordCount?: number;
    hasBenchmark?: boolean;
    baselineSources?: string[];
  }
): string {
  const parts: string[] = [];

  if (snapshot.materialPriceCount > 0) {
    parts.push(
      snapshot.materialPriceSource === "database"
        ? `${snapshot.materialPriceCount} material prices from knowledge base`
        : `${snapshot.materialPriceCount} seed material price indices`
    );
  }

  if (snapshot.calibratedRecordCount > 0) {
    parts.push(
      `${snapshot.calibratedRecordCount} completed project cost record(s) calibrating regional benchmarks`
    );
  } else if (options?.hasBenchmark) {
    parts.push("regional cost benchmarks (seed library)");
  }

  if (options?.projectActualRecordCount && options.projectActualRecordCount > 0) {
    parts.push(
      `${options.projectActualRecordCount} actual cost record(s) for this project blended into estimate`
    );
  }

  if (options?.baselineSources?.length) {
    parts.push(`baseline: ${options.baselineSources.join(", ")}`);
  }

  if (
    !options?.hasBenchmark &&
    snapshot.calibratedRecordCount === 0 &&
    !(options?.projectActualRecordCount && options.projectActualRecordCount > 0)
  ) {
    parts.push("validate with local QS before budget decisions");
  }

  return parts.join(" · ") || "Cost derived from seed defaults — validate locally.";
}
