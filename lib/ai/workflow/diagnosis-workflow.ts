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
import { searchKnowledgeForProjectAsync } from "@/lib/ai/knowledge/embedding-search";
import {
  runDiagnosisExecutiveSummaryChain,
} from "@/lib/ai/langchain/diagnosis-chain";
import { isLangChainEnabled } from "@/lib/ai/langchain/chains";
import { langChainModelLabel } from "@/lib/ai/langchain/report-chain";
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
  executiveSummary?: string;
  expertSummary?: {
    structuralItemCount: number;
    complianceItemCount: number;
    mepItemCount: number;
    energyItemCount: number;
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

function buildExpertSummaryText(counts: {
  structuralItemCount: number;
  complianceItemCount: number;
  mepItemCount: number;
  energyItemCount: number;
}) {
  return [
    counts.structuralItemCount > 0 ? `Structural: ${counts.structuralItemCount} items` : null,
    counts.complianceItemCount > 0 ? `Compliance: ${counts.complianceItemCount} items` : null,
    counts.mepItemCount > 0 ? `MEP: ${counts.mepItemCount} items` : null,
    counts.energyItemCount > 0 ? `Energy: ${counts.energyItemCount} items` : null,
  ]
    .filter(Boolean)
    .join("; ");
}

export async function runDiagnosisWorkflow(
  projectId: string,
  organizationId: string,
  options: DiagnosisWorkflowOptions = {}
): Promise<DiagnosisWorkflowResult | null> {
  const { includeExpertAgents = true, refreshBuildingMemory = true } = options;

  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const ai = getAIService();
  const platform = getAIPlatform();

  const baseItems = await ai.generateDiagnosis(project, project.documents);
  let structuralItemCount = 0;
  let complianceItemCount = 0;
  let mepItemCount = 0;
  let energyItemCount = 0;

  const mergedItems = [...baseItems];

  if (includeExpertAgents) {
    const structuralItems = await platform.structural.generateStructuralDiagnosis(project);
    structuralItemCount = structuralItems.length;
    mergedItems.push(...structuralItems);

    const complianceItems = await platform.compliance.generateComplianceDiagnosis(project);
    complianceItemCount = complianceItems.length;
    mergedItems.push(...complianceItems);

    const mepItems = platform.mep.generateMepDiagnosis(project);
    mepItemCount = mepItems.length;
    mergedItems.push(...mepItems);

    const energyItems = platform.energy.generateEnergyDiagnosis(project);
    energyItemCount = energyItems.length;
    mergedItems.push(...energyItems);
  }

  const diagnosisItems = await addDiagnosisItems(
    projectId,
    dedupeDiagnosisItems(mergedItems)
  );

  const expertSummaryText = includeExpertAgents
    ? buildExpertSummaryText({
        structuralItemCount,
        complianceItemCount,
        mepItemCount,
        energyItemCount,
      })
    : undefined;

  const knowledge = isLangChainEnabled()
    ? await searchKnowledgeForProjectAsync(project, project.targetFunction, 3)
    : [];

  const executiveSummary = await runDiagnosisExecutiveSummaryChain({
    project,
    diagnosisItems,
    expertSummary: expertSummaryText,
    knowledge,
  });

  const insightDrafts = await generateDiagnosisInsights(project, diagnosisItems);

  const executiveInsight: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt"> = {
    title: "Diagnosis Executive Summary",
    type: "risk",
    priority:
      diagnosisItems.some((d) => d.severity === "critical")
        ? "critical"
        : diagnosisItems.some((d) => d.severity === "high")
          ? "high"
          : "medium",
    summary: executiveSummary.slice(0, 500),
    evidence: expertSummaryText ?? null,
    recommendation: "Review full diagnosis matrix and prioritize engineer reviews.",
    confidence: isLangChainEnabled() ? 0.9 : 0.85,
    status: "open",
    sourceType: "diagnosis",
    sourceId: null,
  };

  const taskDrafts = await generateTasksFromDiagnosis(project, diagnosisItems, {
    insightsSummary: executiveSummary.slice(0, 400),
  });

  const insights = await addInsights(projectId, [executiveInsight, ...insightDrafts]);
  const tasks = await addTasks(projectId, taskDrafts);

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "diagnosis_generation",
    inputSummary: `Diagnosis pipeline — base + ${includeExpertAgents ? "expert agents" : "no experts"}${isLangChainEnabled() ? " + LangChain" : ""}`,
    outputSummary: executiveSummary.slice(0, 500),
    generatedItemCount: diagnosisItems.length + insights.length + tasks.length,
    modelName: isLangChainEnabled()
      ? langChainModelLabel("diagnosis")
      : "recrete-expert-matrix-v1",
    confidence: 0.87,
  });

  let buildingMemory: BuildingMemory | null | undefined;
  if (refreshBuildingMemory) {
    buildingMemory = await updateBuildingMemory(projectId, organizationId, "diagnosis_generation");
  }

  return {
    diagnosisItems,
    insights,
    tasks,
    analysisRun,
    buildingMemory,
    executiveSummary,
    expertSummary: includeExpertAgents
      ? { structuralItemCount, complianceItemCount, mepItemCount, energyItemCount }
      : undefined,
  };
}
