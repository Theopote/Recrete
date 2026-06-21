import type { MaterialPriceIndex } from "@/lib/ai/knowledge/cost-benchmarks";
import {
  DEFAULT_MATERIAL_PRICES,
  hydrateMaterialPriceStore,
} from "@/lib/ai/knowledge/material-price-store";
import { prisma } from "@/lib/db/prisma";

function toIndex(row: {
  id: string;
  material: string;
  materialZh: string;
  unit: string;
  pricePerUnit: number;
  region: string;
  trendPercent: number;
  updatedAt: Date;
}): MaterialPriceIndex {
  const d = row.updatedAt;
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return {
    id: row.id,
    material: row.material,
    materialZh: row.materialZh,
    unit: row.unit,
    pricePerUnit: row.pricePerUnit,
    region: row.region,
    trendPercent: row.trendPercent,
    updatedAt: month,
  };
}

async function ensureSeeded(): Promise<void> {
  const count = await prisma.materialPrice.count();
  if (count > 0) return;

  await prisma.materialPrice.createMany({
    data: DEFAULT_MATERIAL_PRICES.map((p) => ({
      id: p.id,
      material: p.material,
      materialZh: p.materialZh,
      unit: p.unit,
      pricePerUnit: p.pricePerUnit,
      region: p.region,
      trendPercent: p.trendPercent,
    })),
  });
}

export async function listMaterialPrices(filters?: {
  region?: string;
}): Promise<MaterialPriceIndex[]> {
  await ensureSeeded();
  const rows = await prisma.materialPrice.findMany({
    where:
      filters?.region && filters.region !== "all"
        ? { OR: [{ region: filters.region }, { region: "全国" }] }
        : undefined,
    orderBy: [{ region: "asc" }, { materialZh: "asc" }],
  });
  const items = rows.map(toIndex);
  hydrateMaterialPriceStore(items);
  return items;
}

export async function getMaterialPriceById(id: string): Promise<MaterialPriceIndex | null> {
  await ensureSeeded();
  const row = await prisma.materialPrice.findUnique({ where: { id } });
  return row ? toIndex(row) : null;
}

export async function createMaterialPrice(
  input: Omit<MaterialPriceIndex, "id" | "updatedAt">
): Promise<MaterialPriceIndex> {
  const row = await prisma.materialPrice.create({
    data: {
      material: input.material,
      materialZh: input.materialZh,
      unit: input.unit,
      pricePerUnit: input.pricePerUnit,
      region: input.region,
      trendPercent: input.trendPercent,
    },
  });
  const item = toIndex(row);
  await listMaterialPrices();
  return item;
}

export async function updateMaterialPrice(
  id: string,
  input: Partial<Omit<MaterialPriceIndex, "id">>
): Promise<MaterialPriceIndex | null> {
  try {
    const row = await prisma.materialPrice.update({
      where: { id },
      data: {
        material: input.material,
        materialZh: input.materialZh,
        unit: input.unit,
        pricePerUnit: input.pricePerUnit,
        region: input.region,
        trendPercent: input.trendPercent,
      },
    });
    const item = toIndex(row);
    await listMaterialPrices();
    return item;
  } catch {
    return null;
  }
}

export async function deleteMaterialPrice(id: string): Promise<boolean> {
  try {
    await prisma.materialPrice.delete({ where: { id } });
    await listMaterialPrices();
    return true;
  } catch {
    return false;
  }
}

export async function resetMaterialPrices(): Promise<MaterialPriceIndex[]> {
  await prisma.materialPrice.deleteMany();
  await ensureSeeded();
  return listMaterialPrices();
}
