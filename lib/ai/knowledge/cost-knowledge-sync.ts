export interface CostKnowledgeSnapshot {
  materialPriceCount: number;
  materialPriceSource: "database" | "seed";
  costRecordCount: number;
  calibratedRecordCount: number;
  benchmarkCount: number;
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
