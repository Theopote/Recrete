/**
 * Regional cost benchmarks and material price indices for intelligent cost prediction.
 * 区域造价基准与材料价格指数
 */

import { listMaterialPrices } from "./material-price-store";
import { listCostBenchmarks } from "./cost-benchmark-store";

export interface CostBenchmark {
  id: string;
  region: string;
  city?: string;
  buildingType: string;
  strategyType: string;
  costPerSqmMin: number;
  costPerSqmMax: number;
  costPerSqmAvg: number;
  sampleSize: number;
  updatedAt: string;
}

export interface MaterialPriceIndex {
  id: string;
  material: string;
  materialZh: string;
  unit: string;
  pricePerUnit: number;
  region: string;
  trendPercent: number;
  updatedAt: string;
}

function normalizeBuildingType(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes("office") || type.includes("办公")) return "Office";
  if (lower.includes("industrial") || type.includes("工业")) return "Industrial";
  if (lower.includes("hotel") || type.includes("酒店")) return "Hotel";
  if (lower.includes("edu") || type.includes("学")) return "Educational";
  return type;
}

function inferRegionFromLocation(location: string): string {
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

export function findCostBenchmark(
  location: string,
  buildingType: string,
  strategyType: string
): CostBenchmark | null {
  const region = inferRegionFromLocation(location);
  const cityToken = location.split(/[,，]/)[0]?.trim();
  const normalizedType = normalizeBuildingType(buildingType);

  const benchmarks = listCostBenchmarks();

  return (
    benchmarks.find(
      (b) =>
        b.strategyType === strategyType &&
        b.buildingType === normalizedType &&
        b.city &&
        cityToken &&
        (b.city.includes(cityToken) || cityToken.includes(b.city))
    ) ??
    benchmarks.find(
      (b) =>
        b.strategyType === strategyType &&
        b.buildingType === normalizedType &&
        b.region === region
    ) ??
    benchmarks.find((b) => b.strategyType === strategyType && b.region === "全国") ??
    null
  );
}

export function getMaterialPricesForRegion(region: string): MaterialPriceIndex[] {
  return listMaterialPrices({ region }).filter(
    (m) => m.region === region || m.region === "全国"
  );
}

export function computeMaterialPriceMultiplier(region: string): number {
  const prices = getMaterialPricesForRegion(region);
  if (prices.length === 0) return 1;
  const avgTrend = prices.reduce((s, p) => s + p.trendPercent, 0) / prices.length;
  return 1 + avgTrend / 100;
}
