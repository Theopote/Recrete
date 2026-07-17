import "server-only";

import {
  getProjectById,
  getDocumentById,
  updateDocument,
  addSourceEvidence,
  addAnalysisRun,
  addIssue,
  updateBuildingMemory,
} from "@/lib/db/repository";
import { upsertDrawingAsset } from "@/lib/db/drawing-assets";
import { syncMeasurementsFromDrawings } from "@/lib/building-condition/sync-drawing-measurements";
import { analyzeDocumentAsset } from "@/lib/ai/document-analysis-pipeline";
import { buildDrawingKnowledgeGraph } from "@/lib/ai/knowledge/drawing-knowledge-graph";
import { runConflictDetectionWorkflow } from "./conflict-workflow";
import type { DocumentAsset } from "@/types";
import type { BuildingMemory, SourceEvidence, AIAnalysisRun } from "@/types/ai";
import {
  completeDocumentAnalysisTask,
  failDocumentAnalysisTask,
  updateDocumentAnalysisTask,
} from "@/lib/ai/tasks/document-analysis-tasks";
import {
  formatAnalysisTimeoutError,
  getDocumentAnalysisTimeoutMs,
} from "@/lib/ai/document-analysis-limits";

function withAnalysisTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  const timeoutMs = getDocumentAnalysisTimeoutMs();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(formatAnalysisTimeoutError(timeoutMs)));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export interface DocumentIngestOptions {
  language?: "auto" | "zh" | "en";
  createIssues?: boolean;
  refreshBuildingMemory?: boolean;
  taskId?: string;
}

export interface DocumentIngestResult {
  document: DocumentAsset;
  analysis: Awaited<ReturnType<typeof analyzeDocumentAsset>>;
  evidence: SourceEvidence[];
  issuesCreated: import("@/types").SiteIssue[];
  analysisRun: AIAnalysisRun;
  buildingMemory?: BuildingMemory | null;
}

export async function runDocumentIngestWorkflow(
  projectId: string,
  organizationId: string,
  docId: string,
  options: DocumentIngestOptions = {}
): Promise<DocumentIngestResult | null> {
  const {
    language = "auto",
    createIssues = true,
    refreshBuildingMemory = true,
    taskId,
  } = options;

  const touch = async (phase: import("@/lib/ai/tasks/document-analysis-tasks").AnalysisTaskPhase, progress: number, message: string) => {
    if (taskId) {
      await updateDocumentAnalysisTask(taskId, {
        status: "processing",
        phase,
        progress,
        message,
      });
    }
  };

  try {
  await touch("reading_file", 10, "Reading document metadata");

  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const doc = await getDocumentById(docId);
  if (!doc || doc.projectId !== projectId) return null;

  const buildingAge = project.constructionYear
    ? new Date().getFullYear() - project.constructionYear
    : undefined;

  await touch("vision_analysis", 35, "Running vision / document analysis");

  const analysis = await withAnalysisTimeout(
    analyzeDocumentAsset(
      projectId,
      doc,
      { language, includeOCR: true, extractTables: true, detectDefects: true },
      buildingAge,
      {
        projectName: project.name,
        targetFunction: project.targetFunction,
        location: project.location,
        renovationGoal: project.renovationGoal,
      }
    ),
    doc.name
  );

  await touch("persisting", 70, "Saving analysis results and evidence");

  const document = (await updateDocument(docId, {
    aiSummary: analysis.aiSummary,
    extractedText: analysis.extractedText,
  }))!;

  if (analysis.kind === "drawing" && analysis.drawing) {
    const pages =
      analysis.drawingPages && analysis.drawingPages.length > 0
        ? analysis.drawingPages
        : [
            {
              pageNumber: 1,
              drawing: analysis.drawing,
              knowledgeGraphJson: analysis.knowledgeGraphJson,
              openCvResult: analysis.openCvResult,
              aiSummary: analysis.aiSummary,
              extractedText: analysis.extractedText,
              confidence: analysis.confidence,
            },
          ];

    for (const page of pages) {
      const knowledgeGraph =
        page.knowledgeGraphJson
          ? (JSON.parse(page.knowledgeGraphJson) as ReturnType<
              typeof buildDrawingKnowledgeGraph
            >)
          : buildDrawingKnowledgeGraph(
              projectId,
              doc.id,
              page.pageNumber > 1 ? `${doc.name} (p${page.pageNumber})` : doc.name,
              page.drawing
            );

      await upsertDrawingAsset({
        documentId: doc.id,
        projectId,
        pageNumber: page.pageNumber,
        drawingType: page.drawing.drawingType,
        scale: page.drawing.scale ?? null,
        analysisResult: page.drawing,
        knowledgeGraph,
        openCvResult: page.openCvResult ?? null,
        modelName: analysis.modelName,
        confidence: page.confidence,
      });
    }

    await syncMeasurementsFromDrawings(projectId, {
      drawings: pages.map((page) => page.drawing),
      drawingLabels: pages.map(
        (page) =>
          `${page.drawing.drawingType} p${page.pageNumber} (${doc.name})`
      ),
    });
  }

  const evidence: SourceEvidence[] = [];
  for (const ev of analysis.evidence) {
    evidence.push(await addSourceEvidence(ev));
  }

  const issuesCreated = [];
  if (createIssues && analysis.suggestedIssues) {
    for (const issue of analysis.suggestedIssues) {
      issuesCreated.push(
        await addIssue(projectId, {
          title: issue.title,
          category: issue.category,
          priority: issue.priority,
          location: issue.location ?? null,
          description: issue.description,
          photoUrl: doc.fileUrl,
          assignedToId: null,
          aiDetected: true,
        })
      );
    }
  }

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "document_analysis",
    inputSummary: `Analyzed document: ${doc.name} (${analysis.kind})`,
    outputSummary: analysis.aiSummary.slice(0, 500),
    generatedItemCount: evidence.length + issuesCreated.length,
    modelName: analysis.modelName,
    confidence: analysis.confidence,
  });

  let buildingMemory: BuildingMemory | null | undefined;
  if (refreshBuildingMemory) {
    await touch("building_memory", 90, "Updating Building Memory");
    buildingMemory = await updateBuildingMemory(projectId, organizationId, "document_analysis");
    await runConflictDetectionWorkflow(projectId, organizationId, {
      refreshBuildingMemory: false,
      persistInsights: true,
    });
  }

  if (taskId) {
    await completeDocumentAnalysisTask(taskId, `Analyzed ${doc.name} (${analysis.kind})`);
  }

  return {
    document,
    analysis,
    evidence,
    issuesCreated,
    analysisRun,
    buildingMemory,
  };
  } catch (error) {
    if (taskId) {
      const message =
        error instanceof Error
          ? error.message
          : "Document analysis failed";
      await failDocumentAnalysisTask(taskId, message);
    }
    throw error;
  }
}
