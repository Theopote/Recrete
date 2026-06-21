import type { CostBenchmark } from "./cost-benchmarks";

export const DEFAULT_COST_BENCHMARKS: CostBenchmark[] = [
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

declare global {
  // eslint-disable-next-line no-var
  var __recreteCostBenchmarks: CostBenchmark[] | undefined;
}

function currentQuarterLabel(): string {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

function getStore(): CostBenchmark[] {
  if (!globalThis.__recreteCostBenchmarks) {
    globalThis.__recreteCostBenchmarks = structuredClone(DEFAULT_COST_BENCHMARKS);
  }
  return globalThis.__recreteCostBenchmarks;
}

export function listCostBenchmarks(): CostBenchmark[] {
  return [...getStore()];
}

export function hydrateCostBenchmarkStore(benchmarks: CostBenchmark[]): void {
  globalThis.__recreteCostBenchmarks = structuredClone(benchmarks);
}

export function upsertCostBenchmark(entry: CostBenchmark): void {
  const store = getStore();
  const index = store.findIndex(
    (b) =>
      b.region === entry.region &&
      (b.city ?? "") === (entry.city ?? "") &&
      b.buildingType === entry.buildingType &&
      b.strategyType === entry.strategyType
  );
  const withUpdated = { ...entry, updatedAt: currentQuarterLabel() };
  if (index >= 0) {
    store[index] = { ...store[index], ...withUpdated, id: store[index].id };
  } else {
    store.push({
      ...withUpdated,
      id: entry.id ?? `bm-${Date.now()}`,
    });
  }
}

export function replaceCostBenchmarks(benchmarks: CostBenchmark[]): void {
  globalThis.__recreteCostBenchmarks = structuredClone(benchmarks);
}

export function resetCostBenchmarks(): void {
  globalThis.__recreteCostBenchmarks = structuredClone(DEFAULT_COST_BENCHMARKS);
}
