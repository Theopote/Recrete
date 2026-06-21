import type { DrawingKnowledgeGraph } from "@/lib/ai/knowledge/drawing-knowledge-graph";
import type { OpenCvAnalysisResult } from "@/lib/ai/vision/opencv-analyzer";
import type { DrawingAnalysisResult } from "@/lib/ai/vision/types";

export interface DrawingAssetRecord {
  id: string;
  documentId: string;
  projectId: string;
  pageNumber: number;
  drawingType: DrawingAnalysisResult["drawingType"];
  scale?: string | null;
  analysisResult: DrawingAnalysisResult;
  knowledgeGraph?: DrawingKnowledgeGraph | null;
  openCvResult?: OpenCvAnalysisResult | null;
  modelName: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export type UpsertDrawingAssetInput = {
  documentId: string;
  projectId: string;
  pageNumber?: number;
  drawingType: DrawingAnalysisResult["drawingType"];
  scale?: string | null;
  analysisResult: DrawingAnalysisResult;
  knowledgeGraph?: DrawingKnowledgeGraph | null;
  openCvResult?: OpenCvAnalysisResult | null;
  modelName: string;
  confidence: number;
};
