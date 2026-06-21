/**
 * Regional cost benchmarks and material price indices for intelligent cost prediction.
 * 区域造价基准与材料价格指数
 */

import { listMaterialPrices } from "./material-price-store";

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

export const costBenchmarks: CostBenchmark[] = [
  {
    id: "bm-xa-office-adaptive",
    region: "西北",
    city: "西安",
    buildingType: "Office",
    strategyType: "adaptive_reuse",
    costPerSqmMin: 1800,
    costPerSqmMax: 3200,
    costPerSqmAvg: 2400,
    sampleSize: 12,
    updatedAt: "2025-Q4",
  },
  {
    id: "bm-xa-office-light",
    region: "西北",
    city: "西安",
    buildingType: "Office",
    strategyType: "light_renewal",
    costPerSqmMin: 900,
    costPerSqmMax: 1600,
    costPerSqmAvg: 1250,
    sampleSize: 18,
    updatedAt: "2025-Q4",
  },
  {
    id: "bm-sh-industrial-adaptive",
    region: "华东",
    city: "上海",
    buildingType: "Industrial",
    strategyType: "adaptive_reuse",
    costPerSqmMin: 2200,
    costPerSqmMax: 3800,
    costPerSqmAvg: 2900,
    sampleSize: 9,
    updatedAt: "2025-Q4",
  },
  {
    id: "bm-bj-industrial-deep",
    region: "华北",
    city: "北京",
    buildingType: "Industrial",
    strategyType: "deep_recreation",
    costPerSqmMin: 3800,
    costPerSqmMax: 5500,
    costPerSqmAvg: 4600,
    sampleSize: 7,
    updatedAt: "2025-Q4",
  },
  {
    id: "bm-cd-edu-adaptive",
    region: "西南",
    city: "成都",
    buildingType: "Educational",
    strategyType: "adaptive_reuse",
    costPerSqmMin: 1600,
    costPerSqmMax: 2800,
    costPerSqmAvg: 2150,
    sampleSize: 11,
    updatedAt: "2025-Q4",
  },
  {
    id: "bm-hz-hotel-facade",
    region: "华东",
    city: "杭州",
    buildingType: "Hotel",
    strategyType: "facade_upgrade",
    costPerSqmMin: 1400,
    costPerSqmMax: 2400,
    costPerSqmAvg: 1850,
    sampleSize: 6,
    updatedAt: "2025-Q4",
  },
  {
    id: "bm-default-adaptive",
    region: "全国",
    buildingType: "Office",
    strategyType: "adaptive_reuse",
    costPerSqmMin: 1600,
    costPerSqmMax: 3000,
    costPerSqmAvg: 2300,
    sampleSize: 45,
    updatedAt: "2025-Q4",
  },
  {
    id: "bm-default-light",
    region: "全国",
    buildingType: "Office",
    strategyType: "light_renewal",
    costPerSqmMin: 800,
    costPerSqmMax: 1500,
    costPerSqmAvg: 1150,
    sampleSize: 52,
    updatedAt: "2025-Q4",
  },
  {
    id: "bm-default-deep",
    region: "全国",
    buildingType: "Industrial",
    strategyType: "deep_recreation",
    costPerSqmMin: 3500,
    costPerSqmMax: 5200,
    costPerSqmAvg: 4300,
    sampleSize: 28,
    updatedAt: "2025-Q4",
  },
];

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

  return (
    costBenchmarks.find(
      (b) =>
        b.strategyType === strategyType &&
        b.buildingType === normalizedType &&
        b.city &&
        cityToken &&
        (b.city.includes(cityToken) || cityToken.includes(b.city))
    ) ??
    costBenchmarks.find(
      (b) =>
        b.strategyType === strategyType &&
        b.buildingType === normalizedType &&
        b.region === region
    ) ??
    costBenchmarks.find((b) => b.strategyType === strategyType && b.region === "全国") ??
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
