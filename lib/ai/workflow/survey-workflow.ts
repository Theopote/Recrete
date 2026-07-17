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
import { syncProjectDataCompleteness } from "@/lib/documents/sync-project-completeness";
import { createDocumentAnalysisTask } from "@/lib/ai/tasks/document-analysis-tasks";
import { enqueueDocumentIngestJob } from "@/lib/jobs/enqueue";
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

export interface SurveyQueueResult {
  taskIds: string[];
  queued: number;
  message: string;
}

export async function queueSurveyDocumentJobs(
  projectId: string,
  organizationId: string,
  options: SurveyWorkflowOptions = {}
): Promise<SurveyQueueResult | null> {
  const { onlyUnanalyzed = true } = options;

  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const docs = project.documents ?? [];
  const targets = onlyUnanalyzed ? docs.filter((d) => !d.aiSummary) : docs;

  const taskIds: string[] = [];
  for (const doc of targets) {
    const task = await createDocumentAnalysisTask({
      projectId,
      documentId: doc.id,
      documentName: doc.name,
    });
    await enqueueDocumentIngestJob({
      projectId,
      organizationId,
      documentId: doc.id,
      taskId: task.id,
      language: options.language,
      createIssues: options.createIssues,
      refreshBuildingMemory: false,
    });
    taskIds.push(task.id);
  }

  return {
    taskIds,
    queued: taskIds.length,
    message:
      taskIds.length > 0
        ? `已排队 ${taskIds.length} 个文档分析任务`
        : "没有待分析的文档",
  };
}

export async function runSurveyFinalizeWorkflow(
  projectId: string,
  organizationId: string,
  options: SurveyWorkflowOptions = {}
): Promise<SurveyWorkflowResult | null> {
  const { refreshBuildingMemory = true } = options;

  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const docs = project.documents ?? [];
  const missingDrafts = await detectMissingInformation(project);
  const taskDrafts = await generateSurveyTaskList(project);

  const missingInsights = await addInsights(projectId, missingDrafts);
  const surveyTasks = await addTasks(projectId, taskDrafts);

  const summaries = docs.map((doc) => ({
    documentId: doc.id,
    category: doc.category,
    aiSummary: doc.aiSummary ?? `Pending analysis for ${doc.name}`,
    confidence: doc.aiSummary ? 0.85 : 0,
  }));

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "missing_info_detection",
    inputSummary: `Survey finalize — ${docs.length} documents on file`,
    outputSummary: `Persisted ${missingInsights.length} missing-info insights and ${surveyTasks.length} survey tasks`,
    generatedItemCount: missingInsights.length + surveyTasks.length,
    modelName: "recrete-survey-v1",
    confidence: 0.86,
  });

  let buildingMemory: BuildingMemory | null | undefined;
  if (refreshBuildingMemory) {
    buildingMemory = await updateBuildingMemory(projectId, organizationId, "survey_analysis");
  }

  await syncProjectDataCompleteness(projectId, organizationId);

  return {
    summaries,
    missingInsights,
    surveyTasks,
    analysisRun,
    buildingMemory,
    stats: {
      documentsProcessed: docs.filter((d) => d.aiSummary).length,
      evidenceCreated: 0,
      issuesCreated: 0,
    },
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

  return runSurveyFinalizeWorkflow(projectId, organizationId, {
    ...options,
    refreshBuildingMemory,
    onlyUnanalyzed: false,
  }).then((finalize) =>
    finalize
      ? {
          ...finalize,
          stats: {
            documentsProcessed: targets.length,
            evidenceCreated,
            issuesCreated,
          },
        }
      : null
  );
}
