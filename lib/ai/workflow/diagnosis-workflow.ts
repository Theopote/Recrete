import "server-only";

import {
  getProjectById,
  addDiagnosisItems,
  addInsights,
  addTasks,
  addAnalysisRun,
  updateBuildingMemory,
} from "@/lib/db/repository";
import { getAIService, getAIPlatform } from "@/lib/ai";
import {
  generateDiagnosisInsights,
  generateTasksFromDiagnosis,
} from "@/lib/ai/agents/diagnosis-agent";
import type { DiagnosisItem } from "@/types";
import type { AIInsight, AITask, BuildingMemory, AIAnalysisRun } from "@/types/ai";

export interface DiagnosisWorkflowOptions {
  includeExpertAgents?: boolean;
  refreshBuildingMemory?: boolean;
}

export interface DiagnosisWorkflowResult {
  diagnosisItems: DiagnosisItem[];
  insights: AIInsight[];
  tasks: AITask[];
  analysisRun: AIAnalysisRun;
  buildingMemory?: BuildingMemory | null;
  expertSummary?: {
    structuralItemCount: number;
    complianceItemCount: number;
  };
}

function dedupeDiagnosisItems(
  items: Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]
) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function runDiagnosisWorkflow(
  projectId: string,
  options: DiagnosisWorkflowOptions = {}
): Promise<DiagnosisWorkflowResult | null> {
  const { includeExpertAgents = true, refreshBuildingMemory = true } = options;

  const project = await getProjectById(projectId);
  if (!project) return null;

  const ai = getAIService();
  const platform = getAIPlatform();

  const baseItems = await ai.generateDiagnosis(project, project.documents);
  let structuralItemCount = 0;
  let complianceItemCount = 0;

  const mergedItems = [...baseItems];

  if (includeExpertAgents) {
    const structuralItems = await platform.structural.generateStructuralDiagnosis(project);
    structuralItemCount = structuralItems.length;
    mergedItems.push(...structuralItems);

    const complianceItems = await platform.compliance.generateComplianceDiagnosis(project);
    complianceItemCount = complianceItems.length;
    mergedItems.push(...complianceItems);
  }

  const diagnosisItems = await addDiagnosisItems(
    projectId,
    dedupeDiagnosisItems(mergedItems)
  );

  const insightDrafts = await generateDiagnosisInsights(project, diagnosisItems);
  const taskDrafts = await generateTasksFromDiagnosis(project, diagnosisItems);

  const insights = await addInsights(projectId, insightDrafts);
  const tasks = await addTasks(projectId, taskDrafts);

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "diagnosis_generation",
    inputSummary: `Diagnosis workflow for ${project.name} — base + ${includeExpertAgents ? "expert agents" : "no experts"}`,
    outputSummary: `Created ${diagnosisItems.length} diagnosis items, ${insights.length} insights, ${tasks.length} tasks`,
    generatedItemCount: diagnosisItems.length + insights.length + tasks.length,
    modelName: "recrete-expert-matrix-v1",
    confidence: 0.87,
  });

  let buildingMemory: BuildingMemory | null | undefined;
  if (refreshBuildingMemory) {
    buildingMemory = await updateBuildingMemory(projectId);
  }

  return {
    diagnosisItems,
    insights,
    tasks,
    analysisRun,
    buildingMemory,
    expertSummary: includeExpertAgents
      ? { structuralItemCount, complianceItemCount }
      : undefined,
  };
}
