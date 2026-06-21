import type { MaterialPriceIndex } from "./cost-benchmarks";

export const DEFAULT_MATERIAL_PRICES: MaterialPriceIndex[] = [
  {
    id: "mpi-concrete",
    material: "Ready-mix concrete C30",
    materialZh: "商品混凝土 C30",
    unit: "m³",
    pricePerUnit: 420,
    region: "西北",
    trendPercent: 2.1,
    updatedAt: "2025-12",
  },
  {
    id: "mpi-rebar",
    material: "HRB400 rebar",
    materialZh: "HRB400 螺纹钢",
    unit: "t",
    pricePerUnit: 3850,
    region: "西北",
    trendPercent: -1.5,
    updatedAt: "2025-12",
  },
  {
    id: "mpi-curtain",
    material: "Aluminum curtain wall",
    materialZh: "铝合金幕墙",
    unit: "m²",
    pricePerUnit: 680,
    region: "华东",
    trendPercent: 3.8,
    updatedAt: "2025-12",
  },
  {
    id: "mpi-insulation",
    material: "External insulation board",
    materialZh: "外墙保温板",
    unit: "m²",
    pricePerUnit: 95,
    region: "全国",
    trendPercent: 1.2,
    updatedAt: "2025-12",
  },
  {
    id: "mpi-gypsum",
    material: "Gypsum board partition",
    materialZh: "石膏板隔墙",
    unit: "m²",
    pricePerUnit: 45,
    region: "全国",
    trendPercent: 0.8,
    updatedAt: "2025-12",
  },
  {
    id: "mpi-hvac",
    material: "VRF HVAC system",
    materialZh: "多联机空调系统",
    unit: "kW",
    pricePerUnit: 3200,
    region: "华东",
    trendPercent: 1.5,
    updatedAt: "2025-12",
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __recreteMaterialPrices: MaterialPriceIndex[] | undefined;
}

function currentMonthLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getStore(): MaterialPriceIndex[] {
  if (!globalThis.__recreteMaterialPrices) {
    globalThis.__recreteMaterialPrices = structuredClone(DEFAULT_MATERIAL_PRICES);
  }
  return globalThis.__recreteMaterialPrices;
}

export function hydrateMaterialPriceStore(prices: MaterialPriceIndex[]): void {
  globalThis.__recreteMaterialPrices = structuredClone(prices);
}

export function listMaterialPrices(filters?: { region?: string }): MaterialPriceIndex[] {
  const items = [...getStore()].sort((a, b) => a.region.localeCompare(b.region));
  if (!filters?.region || filters.region === "all") return items;
  return items.filter((m) => m.region === filters.region || m.region === "全国");
}

export function getMaterialPriceById(id: string): MaterialPriceIndex | undefined {
  return getStore().find((m) => m.id === id);
}

export function createMaterialPrice(
  input: Omit<MaterialPriceIndex, "id" | "updatedAt"> & { id?: string }
): MaterialPriceIndex {
  const store = getStore();
  const item: MaterialPriceIndex = {
    id: input.id ?? `mpi-${Date.now()}`,
    material: input.material,
    materialZh: input.materialZh,
    unit: input.unit,
    pricePerUnit: input.pricePerUnit,
    region: input.region,
    trendPercent: input.trendPercent,
    updatedAt: currentMonthLabel(),
  };
  store.unshift(item);
  return item;
}

export function updateMaterialPrice(
  id: string,
  input: Partial<Omit<MaterialPriceIndex, "id">>
): MaterialPriceIndex | null {
  const store = getStore();
  const index = store.findIndex((m) => m.id === id);
  if (index === -1) return null;

  store[index] = {
    ...store[index],
    ...input,
    updatedAt: currentMonthLabel(),
  };
  return store[index];
}

export function deleteMaterialPrice(id: string): boolean {
  const store = getStore();
  const index = store.findIndex((m) => m.id === id);
  if (index === -1) return false;
  store.splice(index, 1);
  return true;
}

export function resetMaterialPrices(): void {
  globalThis.__recreteMaterialPrices = structuredClone(DEFAULT_MATERIAL_PRICES);
}
