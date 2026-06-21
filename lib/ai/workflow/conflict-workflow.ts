import "server-only";

import {
  getProjectById,
  getProjectEvidence,
  addInsights,
  addAnalysisRun,
  updateBuildingMemory,
} from "@/lib/db/repository";
import { detectDataConflicts, conflictsToInsights } from "@/lib/ai/agents/conflict-agent";
import type { AIInsight, AIAnalysisRun, BuildingMemory } from "@/types/ai";
import type { DataConflict } from "@/lib/ai/agents/conflict-agent";
import { generateId } from "@/lib/mock-data";

export interface ConflictWorkflowResult {
  conflicts: DataConflict[];
  insights: AIInsight[];
  analysisRun: AIAnalysisRun;
  buildingMemory?: BuildingMemory | null;
}

export async function runConflictDetectionWorkflow(
  projectId: string,
  options: { refreshBuildingMemory?: boolean; persistInsights?: boolean } = {}
): Promise<ConflictWorkflowResult | null> {
  const { refreshBuildingMemory = false, persistInsights = true } = options;

  const project = await getProjectById(projectId);
  if (!project) return null;

  const evidence = await getProjectEvidence(projectId);
  const recentDocumentSummaries = (project.documents ?? [])
    .filter((d) => d.aiSummary)
    .slice(-5)
    .map((d) => d.aiSummary!);

  const detected = detectDataConflicts({
    project,
    buildingMemory: project.buildingMemory,
    evidence,
    diagnosis: project.diagnosis ?? [],
    recentDocumentSummaries,
  });

  const conflicts: DataConflict[] = detected.map((c) => ({
    ...c,
    id: generateId("conflict"),
  }));

  let insights: AIInsight[] = [];
  if (persistInsights && conflicts.length > 0) {
    insights = await addInsights(projectId, conflictsToInsights(projectId, detected));
  }

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "conflict_detection",
    inputSummary: `Conflict scan — ${evidence.length} evidence, ${project.diagnosis?.length ?? 0} diagnosis items`,
    outputSummary: `Detected ${conflicts.length} potential data conflicts`,
    generatedItemCount: conflicts.length,
    modelName: "recrete-conflict-v1",
    confidence: conflicts.length > 0 ? 0.87 : 0.95,
  });

  let buildingMemory: BuildingMemory | null | undefined;
  if (refreshBuildingMemory) {
    buildingMemory = await updateBuildingMemory(projectId);
  }

  return { conflicts, insights, analysisRun, buildingMemory };
}
