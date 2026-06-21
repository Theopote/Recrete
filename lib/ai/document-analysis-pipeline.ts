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

export interface PipelineResult extends DocumentAnalysisOutput {
  documentId: string;
  evidence: Omit<SourceEvidence, "id" | "createdAt">[];
  suggestedIssues?: SuggestedIssue[];
}

export interface SuggestedIssue {
  title: string;
  category: import("@/types").IssueCategory;
  priority: import("@/types").IssuePriority;
  description: string;
  location?: string;
}

const DRAWING_CATEGORIES: DocumentCategory[] = ["old_drawings"];
const PHOTO_CATEGORIES: DocumentCategory[] = ["survey_photos"];
const REPORT_CATEGORIES: DocumentCategory[] = [
  "structure_documents",
  "mep_documents",
  "reports",
  "historical_documents",
  "cost_documents",
  "meeting_records",
];

export function resolveAnalysisKind(doc: DocumentAsset): DocumentAnalysisOutput["kind"] {
  if (DRAWING_CATEGORIES.includes(doc.category)) return "drawing";
  if (PHOTO_CATEGORIES.includes(doc.category)) return "photo";
  if (REPORT_CATEGORIES.includes(doc.category)) return "report";
  if (doc.mimeType.startsWith("image/")) return "photo";
  if (isPdf(doc.mimeType, doc.name)) return "report";
  if (/\.(dwg|dxf)$/i.test(doc.name)) return "drawing";
  return "unknown";
}

export async function analyzeDocumentAsset(
  projectId: string,
  doc: DocumentAsset,
  options: VisionAnalysisOptions = {},
  buildingAge?: number
): Promise<PipelineResult> {
  const kind = resolveAnalysisKind(doc);

  switch (kind) {
    case "drawing":
      return analyzeDrawingDocument(projectId, doc, options);
    case "photo":
      return analyzePhotoDocument(projectId, doc, options, buildingAge);
    case "report":
      return analyzeReportDocument(projectId, doc, options);
    default:
      return analyzeGenericDocument(projectId, doc, options);
  }
}

export async function analyzeProjectDocuments(
  project: ProjectWithRelations,
  options: VisionAnalysisOptions = {}
): Promise<PipelineResult[]> {
  const docs = project.documents ?? [];
  const buildingAge = project.constructionYear
    ? new Date().getFullYear() - project.constructionYear
    : undefined;

  return Promise.all(
    docs.map((doc) => analyzeDocumentAsset(project.id, doc, options, buildingAge))
  );
}

async function analyzeDrawingDocument(
  projectId: string,
  doc: DocumentAsset,
  options: VisionAnalysisOptions
): Promise<PipelineResult> {
  if (/\.(dwg|dxf)$/i.test(doc.name)) {
    return {
      documentId: doc.id,
      kind: "drawing",
      aiSummary: `[DWG/CAD] ${doc.name} — CAD file stored. Convert to PDF/image for full vision analysis. Drawing metadata pending conversion.`,
      extractedText: JSON.stringify({ format: "dwg", status: "pending_conversion" }),
      confidence: 0.5,
      modelName: "pending",
      evidence: [],
    };
  }

  const imageData = await readFileAsDataUrl(
    doc.fileUrl,
    doc.mimeType.startsWith("image/") ? doc.mimeType : "image/jpeg"
  );

  const drawing = await drawingAnalyzer.analyzeDrawing(imageData, options);
  const graph = buildDrawingKnowledgeGraph(projectId, doc.id, doc.name, drawing);

  const evidence = buildDrawingEvidence(projectId, doc.id, drawing);
  const extractedText = [
    ...drawing.extractedText,
    "",
    "--- Knowledge Graph ---",
    JSON.stringify(graph, null, 2),
  ].join("\n");

  return {
    documentId: doc.id,
    kind: "drawing",
    aiSummary: drawing.summary,
    extractedText,
    confidence: drawing.confidence,
    modelName: drawingAnalyzer.modelName,
    drawing,
    knowledgeGraphJson: JSON.stringify(graph),
    evidence,
  };
}

async function analyzePhotoDocument(
  projectId: string,
  doc: DocumentAsset,
  options: VisionAnalysisOptions,
  buildingAge?: number
): Promise<PipelineResult> {
  const imageData = await readFileAsDataUrl(doc.fileUrl, doc.mimeType || "image/jpeg");
  const photo = await photoDefectDetector.analyzePhoto(
    imageData,
    { location: doc.description ?? doc.category, buildingAge },
    options
  );

  const evidence = photo.defects.map((defect) => ({
    projectId,
    sourceType: "photo" as const,
    sourceId: doc.id,
    documentId: doc.id,
    locationLabel: `${photo.photoCategory} — ${defect.type}`,
    quote: defect.description,
    boundingBox: JSON.stringify(defect.location),
    confidence: defect.confidence,
  }));

  const suggestedIssues = photo.defects
    .filter((d) => d.severity === "high" || d.severity === "critical")
    .map((defect) => ({
      title: `${defect.type} detected — ${doc.name}`,
      category: mapDefectToIssueCategory(defect.type),
      priority: defect.severity === "critical" ? ("urgent" as const) : ("high" as const),
      description: `${defect.description}\n\nSuggested action: ${defect.suggestedAction}`,
      location: doc.description ?? undefined,
    }));

  const metricsSummary = [
    `Category: ${photo.photoCategory}`,
    `Severity score: ${photo.severityScore}/100`,
    `Cracks: ${photo.damageMetrics.crackCount}`,
    photo.damageMetrics.maxCrackWidthMm
      ? `Max crack width: ${photo.damageMetrics.maxCrackWidthMm}mm`
      : null,
    photo.damageMetrics.affectedAreaSqm
      ? `Affected area: ${photo.damageMetrics.affectedAreaSqm} sqm`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    documentId: doc.id,
    kind: "photo",
    aiSummary: `${photo.summary}\n\n[${metricsSummary}]`,
    extractedText: JSON.stringify({
      photoCategory: photo.photoCategory,
      damageMetrics: photo.damageMetrics,
      defects: photo.defects,
    }),
    confidence: photo.confidence,
    modelName: photoDefectDetector.modelName,
    photo,
    evidence,
    suggestedIssues,
  };
}

async function analyzeReportDocument(
  projectId: string,
  doc: DocumentAsset,
  options: VisionAnalysisOptions
): Promise<PipelineResult> {
  if (isPdf(doc.mimeType, doc.name)) {
    try {
      const pdfText = await extractPdfText(doc.fileUrl);

      if (!pdfText.isLikelyScan && pdfText.fullText.length > 100) {
        const extracted = documentExtractor.analyzeExtractedText(pdfText.fullText, {
          filename: doc.name,
          category: doc.category,
        });

        return {
          documentId: doc.id,
          kind: "report",
          aiSummary: extracted.summary,
          extractedText: extracted.extractedText,
          confidence: 0.88,
          modelName: "pdf-text-extraction",
          document: extracted,
          evidence: buildReportEvidence(projectId, doc.id, extracted),
        };
      }

      const imageData = await readFileAsDataUrl(doc.fileUrl, "application/pdf");
      const extracted = await documentExtractor.extractDocument(
        imageData,
        { filename: doc.name, category: doc.category },
        { ...options, extractTables: true, includeOCR: true }
      );

      return {
        documentId: doc.id,
        kind: "report",
        aiSummary: extracted.summary,
        extractedText: extracted.extractedText,
        confidence: 0.82,
        modelName: documentExtractor.modelName,
        document: extracted,
        evidence: buildReportEvidence(projectId, doc.id, extracted),
      };
    } catch (error) {
      console.error("PDF analysis error:", error);
    }
  }

  if (doc.mimeType.startsWith("image/")) {
    const imageData = await readFileAsDataUrl(doc.fileUrl, doc.mimeType);
    const extracted = await documentExtractor.extractDocument(
      imageData,
      { filename: doc.name, category: doc.category },
      { ...options, extractTables: true, includeOCR: true }
    );

    return {
      documentId: doc.id,
      kind: "report",
      aiSummary: extracted.summary,
      extractedText: extracted.extractedText,
      confidence: 0.8,
      modelName: documentExtractor.modelName,
      document: extracted,
      evidence: buildReportEvidence(projectId, doc.id, extracted),
    };
  }

  return analyzeGenericDocument(projectId, doc, options);
}

async function analyzeGenericDocument(
  projectId: string,
  doc: DocumentAsset,
  options: VisionAnalysisOptions
): Promise<PipelineResult> {
  if (doc.mimeType.startsWith("image/")) {
    return analyzePhotoDocument(projectId, doc, options);
  }

  return {
    documentId: doc.id,
    kind: "unknown",
    aiSummary: `Document "${doc.name}" uploaded (${doc.category}). Automatic analysis not supported for this file type.`,
    extractedText: "",
    confidence: 0.3,
    modelName: "none",
    evidence: [],
  };
}

function buildDrawingEvidence(
  projectId: string,
  documentId: string,
  drawing: Awaited<ReturnType<typeof drawingAnalyzer.analyzeDrawing>>
): Omit<SourceEvidence, "id" | "createdAt">[] {
  const evidence: Omit<SourceEvidence, "id" | "createdAt">[] = [];

  for (const ann of drawing.annotations.slice(0, 5)) {
    evidence.push({
      projectId,
      sourceType: "document",
      sourceId: documentId,
      documentId,
      locationLabel: `${drawing.drawingType} annotation`,
      quote: ann.text,
      boundingBox: JSON.stringify(ann.location),
      confidence: drawing.confidence,
    });
  }

  for (const room of drawing.rooms.slice(0, 5)) {
    evidence.push({
      projectId,
      sourceType: "document",
      sourceId: documentId,
      documentId,
      locationLabel: `Room ${room.label}`,
      quote: `${room.label}${room.area ? ` — ${room.area} sqm` : ""}${room.function ? ` (${room.function})` : ""}`,
      boundingBox: JSON.stringify(room.location),
      confidence: drawing.confidence,
    });
  }

  return evidence;
}

function buildReportEvidence(
  projectId: string,
  documentId: string,
  extracted: Awaited<ReturnType<typeof documentExtractor.extractDocument>>
): Omit<SourceEvidence, "id" | "createdAt">[] {
  return extracted.keyFindings.slice(0, 8).map((finding) => ({
    projectId,
    sourceType: "document" as const,
    sourceId: documentId,
    documentId,
    locationLabel: extracted.title ?? "Report finding",
    quote: finding,
    confidence: 0.85,
  }));
}

function mapDefectToIssueCategory(
  type: string
): import("@/types").IssueCategory {
  const map: Record<string, import("@/types").IssueCategory> = {
    crack: "crack",
    spalling: "spalling",
    corrosion: "corrosion",
    leakage: "leakage",
    deformation: "structure_exposure",
    deterioration: "facade_damage",
  };
  return map[type] ?? "other";
}

export { buildDrawingKnowledgeGraph, mergeDrawingGraphs } from "./knowledge/drawing-knowledge-graph";
