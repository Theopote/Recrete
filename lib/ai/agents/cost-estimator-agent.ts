import type { ProjectWithRelations, RenovationStrategy } from "@/types";
import { renovationCases } from "../knowledge/case-library";
import {
  findCostBenchmark,
  computeMaterialPriceMultiplier,
  getMaterialPricesForRegion,
  type CostBenchmark,
} from "../knowledge/cost-benchmarks";
import { inferRegion } from "../knowledge/prompt-context";

export interface CostEstimateInput {
  strategyType?: string;
  preservationLevel?: "low" | "medium" | "high";
  contingencyPercent?: number;
}

export interface CostEstimateResult {
  currency: "CNY";
  unit: "sqm";
  estimatedCostPerSqm: number;
  estimatedCostPerSqmMin: number;
  estimatedCostPerSqmMax: number;
  estimatedTotalCost: number;
  costLevel: "low" | "medium" | "high";
  confidence: number;
  referenceCases: Array<{ id: string; title: string; costPerSqm?: number; outcome?: string }>;
  benchmark?: Pick<CostBenchmark, "id" | "region" | "sampleSize" | "updatedAt">;
  breakdown: Array<{ item: string; sharePercent: number }>;
  assumptions: string[];
}

function findReferenceCases(project: ProjectWithRelations, strategyType?: string) {
  return renovationCases
    .filter((c) => {
      const typeMatch = strategyType ? c.strategyType === strategyType : true;
      const locationMatch =
        project.location.includes(c.location.split(",")[0]) ||
        c.location.includes(project.location.split(",")[0]?.trim() ?? "");
      const functionMatch =
        c.targetFunction.toLowerCase().includes(project.targetFunction.toLowerCase().slice(0, 4)) ||
        project.targetFunction.toLowerCase().includes(c.targetFunction.toLowerCase().slice(0, 4));
      return typeMatch && (locationMatch || functionMatch);
    })
    .slice(0, 3);
}

export class CostEstimatorAgent {
  estimateProjectCost(
    project: ProjectWithRelations,
    strategy?: RenovationStrategy | null,
    input: CostEstimateInput = {}
  ): CostEstimateResult {
    const strategyType = input.strategyType ?? strategy?.type ?? "adaptive_reuse";
    const references = findReferenceCases(project, strategyType);
    const region = inferRegion(project.location);
    const benchmark = findCostBenchmark(project.location, project.buildingType, strategyType);
    const materialMultiplier = computeMaterialPriceMultiplier(region);

    const baselineFromCases =
      references.length > 0
        ? references.reduce((s, c) => s + (c.costPerSqm ?? 2500), 0) / references.length
        : benchmark?.costPerSqmAvg ??
          (strategyType === "light_renewal" ? 1200 : strategyType === "deep_recreation" ? 4200 : 2600);

    const preservationMultiplier =
      input.preservationLevel === "high" ? 1.12 : input.preservationLevel === "low" ? 0.92 : 1;

    const areaMultiplier = project.grossFloorArea > 15000 ? 0.95 : 1;
    const estimatedCostPerSqm = Math.round(
      baselineFromCases * preservationMultiplier * areaMultiplier * materialMultiplier
    );

    let estimatedCostPerSqmMin: number;
    let estimatedCostPerSqmMax: number;

    if (benchmark) {
      estimatedCostPerSqmMin = Math.round(
        benchmark.costPerSqmMin * preservationMultiplier * materialMultiplier
      );
      estimatedCostPerSqmMax = Math.round(
        benchmark.costPerSqmMax * preservationMultiplier * materialMultiplier
      );
    } else if (references.length >= 2) {
      const costs = references.map((c) => c.costPerSqm ?? estimatedCostPerSqm);
      estimatedCostPerSqmMin = Math.round(Math.min(...costs) * preservationMultiplier);
      estimatedCostPerSqmMax = Math.round(Math.max(...costs) * preservationMultiplier * 1.15);
    } else {
      estimatedCostPerSqmMin = Math.round(estimatedCostPerSqm * 0.85);
      estimatedCostPerSqmMax = Math.round(estimatedCostPerSqm * 1.2);
    }

    const contingency = input.contingencyPercent ?? 15;
    const estimatedTotalCost = Math.round(
      estimatedCostPerSqm * project.grossFloorArea * (1 + contingency / 100)
    );

    const costLevel: CostEstimateResult["costLevel"] =
      estimatedCostPerSqm < 1800 ? "low" : estimatedCostPerSqm < 3200 ? "medium" : "high";

    const materialNote = getMaterialPricesForRegion(region)
      .slice(0, 2)
      .map((m) => `${m.materialZh} ¥${m.pricePerUnit}/${m.unit}`)
      .join("; ");

    const confidenceBase = references.length > 0 ? 0.78 : 0.62;
    const confidence = benchmark ? Math.min(0.92, confidenceBase + 0.08) : confidenceBase;

    return {
      currency: "CNY",
      unit: "sqm",
      estimatedCostPerSqm,
      estimatedCostPerSqmMin,
      estimatedCostPerSqmMax,
      estimatedTotalCost,
      costLevel,
      confidence,
      referenceCases: references.map((c) => ({
        id: c.id,
        title: c.title,
        costPerSqm: c.costPerSqm,
        outcome: c.outcome,
      })),
      benchmark: benchmark
        ? {
            id: benchmark.id,
            region: benchmark.region,
            sampleSize: benchmark.sampleSize,
            updatedAt: benchmark.updatedAt,
          }
        : undefined,
      breakdown: [
        { item: "MEP replacement", sharePercent: strategyType === "light_renewal" ? 25 : 35 },
        { item: "Envelope / facade", sharePercent: 20 },
        { item: "Structural upgrades", sharePercent: strategyType === "deep_recreation" ? 22 : 12 },
        { item: "Interior fit-out", sharePercent: 28 },
        { item: "Soft costs & contingency", sharePercent: 15 },
      ],
      assumptions: [
        benchmark
          ? `Calibrated against regional benchmark (${benchmark.region}, n=${benchmark.sampleSize}, ${benchmark.updatedAt})`
          : `Based on ${references.length} comparable cases from historical database`,
        `Cost range: ¥${estimatedCostPerSqmMin.toLocaleString()}–${estimatedCostPerSqmMax.toLocaleString()}/m²`,
        materialNote ? `Material index (${region}): ${materialNote}` : `Material price index applied (${region})`,
        `${contingency}% contingency for existing building unknowns`,
        `GFA ${project.grossFloorArea.toLocaleString()} sqm`,
        strategy ? `Strategy: ${strategy.name}` : `Strategy type: ${strategyType}`,
      ],
    };
  }
}

export const costEstimatorAgent = new CostEstimatorAgent();

export function estimateProjectCost(
  project: ProjectWithRelations,
  strategy?: RenovationStrategy | null,
  input?: CostEstimateInput
) {
  return costEstimatorAgent.estimateProjectCost(project, strategy, input);
}
