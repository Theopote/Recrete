import "server-only";

import { addDocument, getProjectById } from "@/lib/db/repository";
import { listBimModels, addBimModel, getBimModel } from "@/lib/db/bim-models";
import { getDrawingAssetByDocument, upsertDrawingAsset } from "@/lib/db/drawing-assets";
import { enqueueBimCadConversionJob, enqueueDocumentIngestJob } from "@/lib/jobs/enqueue";
import { createDocumentAnalysisTask } from "@/lib/ai/tasks/document-analysis-tasks";
import { detectBimFormat } from "@/lib/bim/formats";
import { shouldUseDatabase } from "@/lib/db/resolve";
import { prisma } from "@/lib/db/prisma";
import type { BimModel, BimModelFormat, BimRoomInfo } from "@/types/bim";
import type { DocumentAsset } from "@/types";
import type {
  BoundingBox,
  DrawingAnalysisResult,
  RoomInfo,
} from "@/lib/ai/vision/types";

import {
  isCadDrawingFile,
  shouldOpenBuildingCondition,
} from "@/lib/building-condition/cad-file-utils";

export { isCadDrawingFile, shouldOpenBuildingCondition };

async function resolveOrganizationId(projectId: string): Promise<string> {
  if (await shouldUseDatabase()) {
    const row = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });
    return row?.organizationId ?? "org-1";
  }
  for (const orgId of ["org-1", "org-demo"]) {
    const project = await getProjectById(projectId, orgId);
    if (project) return orgId;
  }
  return "org-1";
}

async function findDocumentByFileUrl(
  projectId: string,
  fileUrl: string
): Promise<DocumentAsset | null> {
  const organizationId = await resolveOrganizationId(projectId);
  const project = await getProjectById(projectId, organizationId);
  return project?.documents?.find((d) => d.fileUrl === fileUrl) ?? null;
}

async function findBimModelByFileUrl(
  projectId: string,
  fileUrl: string
): Promise<BimModel | null> {
  const models = await listBimModels(projectId);
  return models.find((m) => m.fileUrl === fileUrl) ?? null;
}

function generateBimModelId() {
  return `bim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const MIME_BY_FORMAT: Record<Extract<BimModelFormat, "dwg" | "dxf">, string> = {
  dwg: "application/acad",
  dxf: "application/dxf",
};

export interface DocumentCadBimLinkResult {
  modelId: string;
  created: boolean;
}

/** Document upload path → ensure a BIM model exists for the same CAD file. */
export async function syncDocumentCadToBimModel(input: {
  projectId: string;
  document: DocumentAsset;
  uploadedById: string;
}): Promise<DocumentCadBimLinkResult | null> {
  if (!isCadDrawingFile(input.document.name)) return null;

  const { format } = detectBimFormat(input.document.name);
  if (format !== "dwg" && format !== "dxf") return null;

  const existing = await findBimModelByFileUrl(input.projectId, input.document.fileUrl);
  if (existing) {
    return { modelId: existing.id, created: false };
  }

  const now = new Date();
  const modelId = generateBimModelId();
  const model: BimModel = {
    id: modelId,
    projectId: input.projectId,
    name: input.document.name,
    format,
    status: "processing",
    fileUrl: input.document.fileUrl,
    previewUrl: null,
    gltfUrl: null,
    fileSize: input.document.fileSize,
    mimeType: input.document.mimeType || MIME_BY_FORMAT[format],
    errorMessage: null,
    uploadedById: input.uploadedById,
    createdAt: now,
    updatedAt: now,
  };

  await addBimModel(model);
  await enqueueBimCadConversionJob({
    projectId: input.projectId,
    modelId,
    fileUrl: input.document.fileUrl,
    format,
  });

  return { modelId, created: true };
}

export interface BimCadDocumentLinkResult {
  documentId: string;
  analysisTaskId?: string;
  created: boolean;
}

/** BIM viewer upload path → ensure a project document + AI ingest exists for the same CAD file. */
export async function syncBimCadToDocument(input: {
  projectId: string;
  organizationId: string;
  model: BimModel;
  uploadedById: string;
}): Promise<BimCadDocumentLinkResult | null> {
  if (!isCadDrawingFile(input.model.name)) return null;

  const existing = await findDocumentByFileUrl(input.projectId, input.model.fileUrl);
  if (existing) {
    if (!existing.aiSummary) {
      const task = await createDocumentAnalysisTask({
        projectId: input.projectId,
        documentId: existing.id,
        documentName: existing.name,
      });
      await enqueueDocumentIngestJob({
        projectId: input.projectId,
        organizationId: input.organizationId,
        documentId: existing.id,
        taskId: task.id,
      });
      return { documentId: existing.id, analysisTaskId: task.id, created: false };
    }
    return { documentId: existing.id, created: false };
  }

  const doc = await addDocument(input.projectId, {
    name: input.model.name,
    type: input.model.format,
    fileUrl: input.model.fileUrl,
    fileSize: input.model.fileSize,
    mimeType: input.model.mimeType,
    category: "old_drawings",
    description: "Linked from BIM / CAD viewer upload",
    uploadedById: input.uploadedById,
  });

  const task = await createDocumentAnalysisTask({
    projectId: input.projectId,
    documentId: doc.id,
    documentName: doc.name,
  });
  await enqueueDocumentIngestJob({
    projectId: input.projectId,
    organizationId: input.organizationId,
    documentId: doc.id,
    taskId: task.id,
  });

  return { documentId: doc.id, analysisTaskId: task.id, created: true };
}

function roomPolygonToBBox(room: BimRoomInfo): BoundingBox {
  if (room.polygon && room.polygon.length >= 3) {
    const xs = room.polygon.map((p) => p.x);
    const ys = room.polygon.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: Math.max(maxX - minX, 1), height: Math.max(maxY - minY, 1) };
  }
  if (room.centroid) {
    return { x: room.centroid.x - 20, y: room.centroid.y - 20, width: 40, height: 40 };
  }
  return { x: 0, y: 0, width: 100, height: 80 };
}

function buildDrawingResultFromBimModel(model: BimModel): DrawingAnalysisResult {
  const rooms: RoomInfo[] = (model.metadata?.rooms ?? []).map((room) => ({
    id: room.id,
    label: room.label,
    area: room.area,
    function: room.layer,
    location: roomPolygonToBBox(room),
  }));

  const totalArea = model.metadata?.totalArea;
  const summary =
    rooms.length > 0
      ? `CAD 数字化：识别 ${rooms.length} 个空间${totalArea ? `，合计约 ${totalArea.toFixed(1)} m²` : ""}。`
      : `CAD 文件 ${model.name} 已转换预览。`;

  return {
    drawingType: "floor_plan",
    scale: undefined,
    rooms,
    dimensions: [],
    annotations: [],
    structuralElements: [],
    extractedText: [model.name],
    confidence: 0.72,
    summary,
  };
}

/** After CAD conversion, merge room geometry into DrawingAsset (unified building condition data). */
export async function syncDrawingAssetFromBimCad(
  projectId: string,
  modelId: string
): Promise<boolean> {
  const model = await getBimModel(projectId, modelId);
  if (!model || model.status !== "ready") return false;
  if (!model.metadata?.rooms?.length) return false;

  const doc = await findDocumentByFileUrl(projectId, model.fileUrl);
  if (!doc) return false;

  const existing = await getDrawingAssetByDocument(projectId, doc.id, 1);
  if (existing && existing.modelName !== "cad-spatial" && existing.confidence >= 0.72) {
    return false;
  }

  await upsertDrawingAsset({
    documentId: doc.id,
    projectId,
    pageNumber: 1,
    drawingType: "floor_plan",
    scale: null,
    analysisResult: buildDrawingResultFromBimModel(model),
    knowledgeGraph: existing?.knowledgeGraph ?? null,
    openCvResult: existing?.openCvResult ?? null,
    modelName: "cad-spatial",
    confidence: 0.72,
  });

  return true;
}
