import type { ProjectWithRelations, RenovationStrategy } from "@/types";
import { allRenovationCases } from "../knowledge/case-library";
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
  wbsItems: WbsCostItem[];
  assumptions: string[];
}

export interface WbsCostItem {
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  sharePercent: number;
}

function buildWbsItems(
  project: ProjectWithRelations,
  strategyType: string,
  estimatedTotalCost: number,
  breakdown: Array<{ item: string; sharePercent: number }>
): WbsCostItem[] {
  const area = project.grossFloorArea;
  const subBreakdown: Record<string, Array<{ name: string; shareOfParent: number }>> = {
    "拆除与清运": [
      { name: "局部拆除工程", shareOfParent: 45 },
      { name: "建筑垃圾清运", shareOfParent: 35 },
      { name: "降噪防尘措施", shareOfParent: 20 },
    ],
    "装饰装修": [
      { name: "墙面涂料翻新", shareOfParent: 30 },
      { name: "地面铺装更换", shareOfParent: 28 },
      { name: "天花吊顶整修", shareOfParent: 22 },
      { name: "门窗套与收口", shareOfParent: 20 },
    ],
    "MEP 局部更新": [
      { name: "配电箱与线路更新", shareOfParent: 35 },
      { name: "给排水局部改造", shareOfParent: 30 },
      { name: "暖通设备检修更换", shareOfParent: 35 },
    ],
    "结构加固与新建构件": [
      { name: "碳纤维/粘钢加固", shareOfParent: 40 },
      { name: "新增钢梁/楼板", shareOfParent: 35 },
      { name: "节点连接与防腐", shareOfParent: 25 },
    ],
    "MEP 系统重建": [
      { name: "强电主干与配电", shareOfParent: 30 },
      { name: "暖通空调系统", shareOfParent: 35 },
      { name: "给排水与消防管网", shareOfParent: 35 },
    ],
    "外立面与屋面": [
      { name: "外立面清洗修补", shareOfParent: 40 },
      { name: "门窗更换", shareOfParent: 35 },
      { name: "屋面防水整修", shareOfParent: 25 },
    ],
    "室内装修与专项工程": [
      { name: "功能分区隔墙", shareOfParent: 35 },
      { name: "地坪与饰面", shareOfParent: 35 },
      { name: "专项设备安装", shareOfParent: 30 },
    ],
    "MEP 更换与扩容": [
      { name: "电气扩容改造", shareOfParent: 38 },
      { name: "暖通系统升级", shareOfParent: 32 },
      { name: "给排水改造", shareOfParent: 30 },
    ],
    "室内装修": [
      { name: "公共区域装修", shareOfParent: 40 },
      { name: "租户区装修", shareOfParent: 35 },
      { name: "固定家具与标识", shareOfParent: 25 },
    ],
  };

  const items: WbsCostItem[] = [];
  breakdown.forEach((row, index) => {
    const parentCost = Math.round(estimatedTotalCost * (row.sharePercent / 100));
    const subs = subBreakdown[row.item];

    if (subs && subs.length > 0) {
      subs.forEach((sub, subIndex) => {
        const totalCost = Math.round(parentCost * (sub.shareOfParent / 100));
        const unitCost = area > 0 ? Math.round(totalCost / area) : 0;
        items.push({
          code: `WBS-${String(index + 1).padStart(2, "0")}.${subIndex + 1}`,
          name: `${row.item} · ${sub.name}`,
          unit: "m²",
          quantity: area,
          unitCost,
          totalCost,
          sharePercent: Math.round(row.sharePercent * (sub.shareOfParent / 100) * 10) / 10,
        });
      });
    } else {
      const unitCost = area > 0 ? Math.round(parentCost / area) : 0;
      items.push({
        code: `WBS-${String(index + 1).padStart(2, "0")}`,
        name: row.item,
        unit: "m²",
        quantity: area,
        unitCost,
        totalCost: parentCost,
        sharePercent: row.sharePercent,
      });
    }
  });

  return items;
}

function buildCostBreakdown(strategyType: string) {
  if (strategyType === "light_renewal") {
    return [
      { item: "拆除与清运", sharePercent: 8 },
      { item: "装饰装修", sharePercent: 22 },
      { item: "MEP 局部更新", sharePercent: 25 },
      { item: "外立面整修", sharePercent: 18 },
      { item: "结构局部修补", sharePercent: 7 },
      { item: "消防与无障碍", sharePercent: 10 },
      { item: "设计监理与不可预见费", sharePercent: 10 },
    ];
  }
  if (strategyType === "deep_recreation") {
    return [
      { item: "拆除与结构改造", sharePercent: 12 },
      { item: "结构加固与新建构件", sharePercent: 22 },
      { item: "MEP 系统重建", sharePercent: 28 },
      { item: "外立面与屋面", sharePercent: 15 },
      { item: "室内装修与专项工程", sharePercent: 13 },
      { item: "消防节能与智能化", sharePercent: 5 },
      { item: "设计监理与不可预见费", sharePercent: 5 },
    ];
  }
  return [
    { item: "拆除与改造工程", sharePercent: 10 },
    { item: "结构加固", sharePercent: 12 },
    { item: "MEP 更换与扩容", sharePercent: 30 },
    { item: "外立面与门窗", sharePercent: 18 },
    { item: "室内装修", sharePercent: 20 },
    { item: "消防无障碍与专项", sharePercent: 5 },
    { item: "设计监理与不可预见费", sharePercent: 5 },
  ];
}

function findReferenceCases(project: ProjectWithRelations, strategyType?: string) {
  return allRenovationCases
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

    const breakdown = buildCostBreakdown(strategyType);
    const wbsItems = buildWbsItems(project, strategyType, estimatedTotalCost, breakdown);

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
      breakdown,
      wbsItems,
      assumptions: [
        benchmark
          ? `Calibrated against regional benchmark (${benchmark.region}, n=${benchmark.sampleSize}, ${benchmark.updatedAt})`
          : `Based on ${references.length} comparable cases from historical database`,
        `Cost range: ¥${estimatedCostPerSqmMin.toLocaleString()}–${estimatedCostPerSqmMax.toLocaleString()}/m²`,
        materialNote ? `Material index (${region}): ${materialNote}` : `Material price index applied (${region})`,
        `${contingency}% contingency for existing building unknowns`,
        `GFA ${project.grossFloorArea.toLocaleString()} sqm`,
        `WBS 分项 ${wbsItems.length} 项，按策略类型 ${strategyType} 分配`,
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
