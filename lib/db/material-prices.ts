import { shouldUseDatabase } from "@/lib/db/resolve";
import type { MaterialPriceIndex } from "@/lib/ai/knowledge/cost-benchmarks";
import * as store from "@/lib/ai/knowledge/material-price-store";
import * as db from "@/lib/db/prisma-material-prices";

export async function listMaterialPrices(filters?: { region?: string }): Promise<MaterialPriceIndex[]> {
  return (await shouldUseDatabase()) ? db.listMaterialPrices(filters) : store.listMaterialPrices(filters);
}

export async function getMaterialPriceById(id: string): Promise<MaterialPriceIndex | null> {
  if (await shouldUseDatabase()) {
    return db.getMaterialPriceById(id);
  }
  return store.getMaterialPriceById(id) ?? null;
}

export async function createMaterialPrice(
  input: Omit<MaterialPriceIndex, "id" | "updatedAt">
): Promise<MaterialPriceIndex> {
  if (await shouldUseDatabase()) {
    return db.createMaterialPrice(input);
  }
  return store.createMaterialPrice(input);
}

export async function updateMaterialPrice(
  id: string,
  input: Partial<Omit<MaterialPriceIndex, "id">>
): Promise<MaterialPriceIndex | null> {
  if (await shouldUseDatabase()) {
    return db.updateMaterialPrice(id, input);
  }
  return store.updateMaterialPrice(id, input);
}

export async function deleteMaterialPrice(id: string): Promise<boolean> {
  if (await shouldUseDatabase()) {
    return db.deleteMaterialPrice(id);
  }
  return store.deleteMaterialPrice(id);
}

export async function resetMaterialPrices(): Promise<MaterialPriceIndex[]> {
  if (await shouldUseDatabase()) {
    return db.resetMaterialPrices();
  }
  store.resetMaterialPrices();
  return store.listMaterialPrices();
}
