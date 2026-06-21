import type { CostBenchmark } from "./cost-benchmarks";
import {
  DEFAULT_COST_BENCHMARKS,
  listCostBenchmarks,
  replaceCostBenchmarks,
} from "./cost-benchmark-store";
import type { ProjectCostRecord } from "@/types/cost";
import type { BenchmarkCalibrationResult } from "@/types/cost";

function benchmarkKey(r: Pick<ProjectCostRecord, "region" | "city" | "buildingType" | "strategyType">) {
  return `${r.region}|${r.city ?? ""}|${r.buildingType}|${r.strategyType ?? "adaptive_reuse"}`;
}

function mergeRecordIntoBenchmarks(
  base: CostBenchmark[],
  records: ProjectCostRecord[]
): CostBenchmark[] {
  const merged = structuredClone(base);
  const contributing = records.filter(
    (r) => r.outcome !== "failure" && r.strategyType && r.actualCostPerSqm > 0
  );

  const groups = new Map<string, number[]>();
  for (const r of contributing) {
    const key = benchmarkKey({ ...r, strategyType: r.strategyType! });
    const list = groups.get(key) ?? [];
    list.push(r.actualCostPerSqm);
    groups.set(key, list);
  }

  const quarter = `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`;

  for (const [key, costs] of groups) {
    const [region, city, buildingType, strategyType] = key.split("|");
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    const avg = Math.round(costs.reduce((s, c) => s + c, 0) / costs.length);

    const existingIndex = merged.findIndex(
      (b) =>
        b.region === region &&
        (b.city ?? "") === city &&
        b.buildingType === buildingType &&
        b.strategyType === strategyType
    );

    const seed = merged.find(
      (b) => b.buildingType === buildingType && b.strategyType === strategyType
    );

    if (existingIndex >= 0) {
      const seedCosts = seed ? [seed.costPerSqmMin, seed.costPerSqmMax, seed.costPerSqmAvg] : [];
      const allCosts = [...costs, ...seedCosts];
      merged[existingIndex] = {
        ...merged[existingIndex],
        costPerSqmMin: Math.min(...allCosts),
        costPerSqmMax: Math.max(...allCosts),
        costPerSqmAvg: Math.round(
          (merged[existingIndex].costPerSqmAvg * merged[existingIndex].sampleSize + avg * costs.length) /
            (merged[existingIndex].sampleSize + costs.length)
        ),
        sampleSize: merged[existingIndex].sampleSize + costs.length,
        updatedAt: quarter,
      };
    } else {
      merged.push({
        id: `bm-cal-${Date.now()}-${strategyType}`,
        region,
        city: city || undefined,
        buildingType,
        strategyType,
        costPerSqmMin: min,
        costPerSqmMax: max,
        costPerSqmAvg: avg,
        sampleSize: costs.length,
        updatedAt: quarter,
      });
    }
  }

  return merged;
}

export function recalibrateBenchmarksFromRecords(
  records: ProjectCostRecord[]
): BenchmarkCalibrationResult {
  const calibrated = mergeRecordIntoBenchmarks(DEFAULT_COST_BENCHMARKS, records);
  replaceCostBenchmarks(calibrated);

  const updated = listCostBenchmarks().filter((b) => {
    const match = records.some(
      (r) =>
        r.outcome !== "failure" &&
        r.region === b.region &&
        (r.city ?? "") === (b.city ?? "") &&
        r.buildingType === b.buildingType &&
        r.strategyType === b.strategyType
    );
    return match;
  });

  return {
    updatedCount: updated.length,
    benchmarks: updated.map((b) => ({
      id: b.id,
      region: b.region,
      buildingType: b.buildingType,
      strategyType: b.strategyType,
      costPerSqmMin: b.costPerSqmMin,
      costPerSqmMax: b.costPerSqmMax,
      costPerSqmAvg: b.costPerSqmAvg,
      sampleSize: b.sampleSize,
    })),
  };
}

export function buildProjectCostSnapshot(project: {
  location: string;
  buildingType: string;
  grossFloorArea: number;
}): Pick<ProjectCostRecord, "region" | "city" | "buildingType" | "grossFloorArea"> {
  const city = project.location.split(/[,，]/)[0]?.trim() || undefined;
  const region = inferRegion(project.location);
  const buildingType = normalizeBuildingType(project.buildingType);
  return {
    region,
    city: city ?? null,
    buildingType,
    grossFloorArea: project.grossFloorArea,
  };
}

function normalizeBuildingType(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes("office") || type.includes("办公")) return "Office";
  if (lower.includes("industrial") || type.includes("工业")) return "Industrial";
  if (lower.includes("hotel") || type.includes("酒店")) return "Hotel";
  if (lower.includes("edu") || type.includes("学")) return "Educational";
  return type;
}

function inferRegion(location: string): string {
  const lower = location.toLowerCase();
  const map: Record<string, string[]> = {
    西北: ["西安", "xi'an", "xian", "兰州"],
    华东: ["上海", "shanghai", "杭州", "hangzhou"],
    华北: ["北京", "beijing", "天津"],
    西南: ["成都", "chengdu", "重庆"],
    华南: ["广州", "guangzhou", "深圳"],
  };
  for (const [region, cities] of Object.entries(map)) {
    if (cities.some((c) => lower.includes(c.toLowerCase()) || location.includes(c))) return region;
  }
  return "全国";
}
