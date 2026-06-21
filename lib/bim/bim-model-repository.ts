import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { BimModel, BimModelMetadata } from "@/types/bim";

const DATA_DIR = path.join(process.cwd(), "data", "bim-models");

function manifestPath(projectId: string) {
  return path.join(DATA_DIR, `${projectId}.json`);
}

async function readManifest(projectId: string): Promise<BimModel[]> {
  try {
    const raw = await readFile(manifestPath(projectId), "utf8");
    const parsed = JSON.parse(raw) as BimModel[];
    return parsed.map((m) => ({
      ...m,
      createdAt: new Date(m.createdAt),
      updatedAt: new Date(m.updatedAt),
    }));
  } catch {
    return [];
  }
}

async function writeManifest(projectId: string, models: BimModel[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(manifestPath(projectId), JSON.stringify(models, null, 2), "utf8");
}

export async function listBimModels(projectId: string): Promise<BimModel[]> {
  const models = await readManifest(projectId);
  return models.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getBimModel(projectId: string, modelId: string): Promise<BimModel | null> {
  const models = await readManifest(projectId);
  return models.find((m) => m.id === modelId) ?? null;
}

export async function addBimModel(model: BimModel): Promise<BimModel> {
  const models = await readManifest(model.projectId);
  models.push(model);
  await writeManifest(model.projectId, models);
  return model;
}

export async function updateBimModel(
  projectId: string,
  modelId: string,
  patch: Partial<
    Pick<
      BimModel,
      "status" | "previewUrl" | "errorMessage" | "metadata"
    >
  >
): Promise<BimModel | null> {
  const models = await readManifest(projectId);
  const index = models.findIndex((m) => m.id === modelId);
  if (index < 0) return null;

  models[index] = {
    ...models[index],
    ...patch,
    updatedAt: new Date(),
  };
  await writeManifest(projectId, models);
  return models[index];
}

export async function deleteBimModel(projectId: string, modelId: string): Promise<boolean> {
  const models = await readManifest(projectId);
  const next = models.filter((m) => m.id !== modelId);
  if (next.length === models.length) return false;
  await writeManifest(projectId, next);
  return true;
}

export function buildMetadata(partial: BimModelMetadata): BimModelMetadata {
  return partial;
}
