import "server-only";

import type { DocumentAsset, DocumentCategory, ProjectWithRelations } from "@/types";
import type { SourceEvidence } from "@/types/ai";
import { drawingAnalyzer } from "./vision/drawing-analyzer";
import { documentExtractor } from "./vision/document-extractor";
import { photoDefectDetector } from "./vision/photo-detector";
import { extractPdfText, readFileAsDataUrl } from "./vision/pdf-utils";
import { buildDrawingKnowledgeGraph } from "./knowledge/drawing-knowledge-graph";
import { isPdf } from "@/lib/storage/file-utils";
import type { DocumentAnalysisOutput, VisionAnalysisOptions } from "./vision/types";
