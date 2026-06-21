import { shouldUseDatabase } from "@/lib/db/resolve";
import * as fileStore from "@/lib/bim/bim-file-store";
import * as db from "@/lib/db/prisma-bim-models";
import type { BimModel } from "@/types/bim";

export async function listBimModels(projectId: string): Promise<BimModel[]> {
  if (await shouldUseDatabase()) {
    return db.listBimModelsDb(projectId);
  }
  return fileStore.listBimModelsFromFile(projectId);
}

export async function getBimModel(projectId: string, modelId: string): Promise<BimModel | null> {
  if (await shouldUseDatabase()) {
    return db.getBimModelDb(projectId, modelId);
  }
  return fileStore.getBimModelFromFile(projectId, modelId);
}

export async function addBimModel(model: BimModel): Promise<BimModel> {
  if (await shouldUseDatabase()) {
    return db.addBimModelDb(model);
  }
  return fileStore.addBimModelToFile(model);
}

export async function updateBimModel(
  projectId: string,
  modelId: string,
  patch: Partial<
    Pick<BimModel, "status" | "previewUrl" | "gltfUrl" | "errorMessage" | "metadata">
  >
): Promise<BimModel | null> {
  if (await shouldUseDatabase()) {
    return db.updateBimModelDb(projectId, modelId, patch);
  }
  return fileStore.updateBimModelInFile(projectId, modelId, patch);
}

export async function deleteBimModel(projectId: string, modelId: string): Promise<boolean> {
  if (await shouldUseDatabase()) {
    return db.deleteBimModelDb(projectId, modelId);
  }
  return fileStore.deleteBimModelFromFile(projectId, modelId);
}

export { buildMetadata } from "@/lib/bim/bim-file-store";
