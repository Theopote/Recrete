import "server-only";

import {
  getProjectById,
  addInsights,
  addTasks,
  addAnalysisRun,
  updateBuildingMemory,
} from "@/lib/db/repository";
import { detectMissingInformation, generateSurveyTaskList } from "@/lib/ai/agents/survey-agent";
import { runDocumentIngestWorkflow } from "./document-ingest-workflow";
import type { BuildingMemory, AIInsight, AITask, AIAnalysisRun } from "@/types/ai";

export interface SurveyWorkflowOptions {
  language?: "auto" | "zh" | "en";
  createIssues?: boolean;
  refreshBuildingMemory?: boolean;
  onlyUnanalyzed?: boolean;
}

export interface SurveyWorkflowResult {
  summaries: Array<{
    documentId: string;
    category: string;
    aiSummary: string;
    confidence: number;
  }>;
  missingInsights: AIInsight[];
  surveyTasks: AITask[];
  analysisRun: AIAnalysisRun;
  buildingMemory?: BuildingMemory | null;
  stats: {
    documentsProcessed: number;
    evidenceCreated: number;
    issuesCreated: number;
  };
}

export async function runSurveyWorkflow(
  projectId: string,
  organizationId: string,
  options: SurveyWorkflowOptions = {}
): Promise<SurveyWorkflowResult | null> {
  const {
    language = "auto",
    createIssues = true,
    refreshBuildingMemory = true,
    onlyUnanalyzed = true,
  } = options;

  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const docs = project.documents ?? [];
  const targets = onlyUnanalyzed ? docs.filter((d) => !d.aiSummary) : docs;

  let evidenceCreated = 0;
  let issuesCreated = 0;

  for (const doc of targets) {
    const result = await runDocumentIngestWorkflow(projectId, organizationId, doc.id, {
      language,
      createIssues,
      refreshBuildingMemory: false,
    });
    if (result) {
      evidenceCreated += result.evidence.length;
      issuesCreated += result.issuesCreated.length;
    }
  }

  const updatedProject = (await getProjectById(projectId, organizationId))!;
  const missingDrafts = await detectMissingInformation(updatedProject);
  const taskDrafts = await generateSurveyTaskList(updatedProject);

  const missingInsights = await addInsights(projectId, missingDrafts);
  const surveyTasks = await addTasks(projectId, taskDrafts);

  const summaries = (updatedProject.documents ?? []).map((doc) => ({
    documentId: doc.id,
    category: doc.category,
    aiSummary: doc.aiSummary ?? `Pending analysis for ${doc.name}`,
    confidence: doc.aiSummary ? 0.85 : 0,
  }));

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "missing_info_detection",
    inputSummary: `Survey workflow — ${docs.length} documents (${targets.length} processed)`,
    outputSummary: `Persisted ${missingInsights.length} missing-info insights and ${surveyTasks.length} survey tasks`,
    generatedItemCount: targets.length + missingInsights.length + surveyTasks.length + evidenceCreated,
    modelName: "recrete-survey-v1",
    confidence: 0.86,
  });

  let buildingMemory: BuildingMemory | null | undefined;
  if (refreshBuildingMemory) {
    buildingMemory = await updateBuildingMemory(projectId, organizationId);
  }

  return {
    summaries,
    missingInsights,
    surveyTasks,
    analysisRun,
    buildingMemory,
    stats: {
      documentsProcessed: targets.length,
      evidenceCreated,
      issuesCreated,
    },
  };
}
