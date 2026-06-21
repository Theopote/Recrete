import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DrawingKnowledgeGraph } from "@/lib/ai/knowledge/drawing-knowledge-graph";
import type { OpenCvAnalysisResult } from "@/lib/ai/vision/opencv-analyzer";
import type { DrawingAnalysisResult } from "@/lib/ai/vision/types";
import type { DrawingAssetRecord, UpsertDrawingAssetInput } from "@/types/drawing";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function toDrawingAssetRecord(row: {
  id: string;
  documentId: string;
  projectId: string;
  pageNumber: number;
  drawingType: string;
  scale: string | null;
  analysisResult: unknown;
  knowledgeGraph: unknown;
  openCvResult: unknown;
  modelName: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}): DrawingAssetRecord {
  return {
    id: row.id,
    documentId: row.documentId,
    projectId: row.projectId,
    pageNumber: row.pageNumber,
    drawingType: row.drawingType as DrawingAnalysisResult["drawingType"],
    scale: row.scale,
    analysisResult: row.analysisResult as DrawingAnalysisResult,
    knowledgeGraph: (row.knowledgeGraph as DrawingKnowledgeGraph | null) ?? null,
    openCvResult: (row.openCvResult as OpenCvAnalysisResult | null) ?? null,
    modelName: row.modelName,
    confidence: row.confidence,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listDrawingAssetsByProjectDb(
  projectId: string
): Promise<DrawingAssetRecord[]> {
  const rows = await prisma.drawingAsset.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toDrawingAssetRecord);
}

export async function upsertDrawingAssetDb(
  input: UpsertDrawingAssetInput
): Promise<DrawingAssetRecord> {
  const pageNumber = input.pageNumber ?? 1;
  const row = await prisma.drawingAsset.upsert({
    where: {
      documentId_pageNumber: {
        documentId: input.documentId,
        pageNumber,
      },
    },
    create: {
      documentId: input.documentId,
      projectId: input.projectId,
      pageNumber,
      drawingType: input.drawingType,
      scale: input.scale ?? null,
      analysisResult: toJson(input.analysisResult),
      knowledgeGraph: input.knowledgeGraph ? toJson(input.knowledgeGraph) : undefined,
      openCvResult: input.openCvResult ? toJson(input.openCvResult) : undefined,
      modelName: input.modelName,
      confidence: input.confidence,
    },
    update: {
      drawingType: input.drawingType,
      scale: input.scale ?? null,
      analysisResult: toJson(input.analysisResult),
      knowledgeGraph: input.knowledgeGraph ? toJson(input.knowledgeGraph) : undefined,
      openCvResult: input.openCvResult ? toJson(input.openCvResult) : undefined,
      modelName: input.modelName,
      confidence: input.confidence,
      updatedAt: new Date(),
    },
  });
  return toDrawingAssetRecord(row);
}
