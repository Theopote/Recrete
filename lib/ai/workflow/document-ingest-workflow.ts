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
import { analyzeDocumentAsset } from "@/lib/ai/document-analysis-pipeline";
import { runConflictDetectionWorkflow } from "./conflict-workflow";
import type { DocumentAsset } from "@/types";
import type { BuildingMemory, SourceEvidence, AIAnalysisRun } from "@/types/ai";

export interface DocumentIngestOptions {
  language?: "auto" | "zh" | "en";
  createIssues?: boolean;
  refreshBuildingMemory?: boolean;
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
  docId: string,
  options: DocumentIngestOptions = {}
): Promise<DocumentIngestResult | null> {
  const {
    language = "auto",
    createIssues = true,
    refreshBuildingMemory = true,
  } = options;

  const project = await getProjectById(projectId);
  if (!project) return null;

  const doc = await getDocumentById(docId);
  if (!doc || doc.projectId !== projectId) return null;

  const buildingAge = project.constructionYear
    ? new Date().getFullYear() - project.constructionYear
    : undefined;

  const analysis = await analyzeDocumentAsset(
    projectId,
    doc,
    { language, includeOCR: true, extractTables: true, detectDefects: true },
    buildingAge
  );

  const document = (await updateDocument(docId, {
    aiSummary: analysis.aiSummary,
    extractedText: analysis.extractedText,
  }))!;

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
    buildingMemory = await updateBuildingMemory(projectId);
    await runConflictDetectionWorkflow(projectId, {
      refreshBuildingMemory: false,
      persistInsights: true,
    });
  }

  return {
    document,
    analysis,
    evidence,
    issuesCreated,
    analysisRun,
    buildingMemory,
  };
}
