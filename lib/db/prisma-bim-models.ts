import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { BimModel, BimModelFormat, BimModelMetadata, BimModelStatus } from "@/types/bim";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function toBimModel(row: {
  id: string;
  projectId: string;
  name: string;
  format: string;
  status: string;
  fileUrl: string;
  previewUrl: string | null;
  gltfUrl: string | null;
  fileSize: number;
  mimeType: string;
  errorMessage: string | null;
  metadata: unknown;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
}): BimModel {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    format: row.format as BimModelFormat,
    status: row.status as BimModelStatus,
    fileUrl: row.fileUrl,
    previewUrl: row.previewUrl,
    gltfUrl: row.gltfUrl,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    errorMessage: row.errorMessage,
    metadata: (row.metadata as BimModelMetadata | null) ?? undefined,
    uploadedById: row.uploadedById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listBimModelsDb(projectId: string): Promise<BimModel[]> {
  const rows = await prisma.bimModel.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toBimModel);
}

export async function getBimModelDb(projectId: string, modelId: string): Promise<BimModel | null> {
  const row = await prisma.bimModel.findFirst({
    where: { id: modelId, projectId },
  });
  return row ? toBimModel(row) : null;
}

export async function addBimModelDb(model: BimModel): Promise<BimModel> {
  const row = await prisma.bimModel.create({
    data: {
      id: model.id,
      projectId: model.projectId,
      name: model.name,
      format: model.format,
      status: model.status,
      fileUrl: model.fileUrl,
      previewUrl: model.previewUrl,
      gltfUrl: model.gltfUrl,
      fileSize: model.fileSize,
      mimeType: model.mimeType,
      errorMessage: model.errorMessage,
      metadata: model.metadata ? toJson(model.metadata) : undefined,
      uploadedById: model.uploadedById,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    },
  });
  return toBimModel(row);
}

export async function updateBimModelDb(
  projectId: string,
  modelId: string,
  patch: Partial<
    Pick<BimModel, "status" | "previewUrl" | "gltfUrl" | "errorMessage" | "metadata">
  >
): Promise<BimModel | null> {
  try {
    const row = await prisma.bimModel.update({
      where: { id: modelId },
      data: {
        status: patch.status,
        previewUrl: patch.previewUrl,
        gltfUrl: patch.gltfUrl,
        errorMessage: patch.errorMessage,
        metadata: patch.metadata ? toJson(patch.metadata) : undefined,
        updatedAt: new Date(),
      },
    });
    if (row.projectId !== projectId) return null;
    return toBimModel(row);
  } catch {
    return null;
  }
}

export async function deleteBimModelDb(projectId: string, modelId: string): Promise<boolean> {
  try {
    const existing = await prisma.bimModel.findFirst({
      where: { id: modelId, projectId },
    });
    if (!existing) return false;
    await prisma.bimModel.delete({ where: { id: modelId } });
    return true;
  } catch {
    return false;
  }
}

export async function importBimModelsDb(models: BimModel[]): Promise<number> {
  let imported = 0;
  for (const model of models) {
    const exists = await prisma.bimModel.findUnique({ where: { id: model.id } });
    if (exists) continue;
    await addBimModelDb(model);
    imported += 1;
  }
  return imported;
}
