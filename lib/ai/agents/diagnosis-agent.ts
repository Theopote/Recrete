import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import type { AIInsight, AITask } from "@/types/ai";
import { withMockDelay } from "../providers/utils";
import { mockAIService } from "../mock-ai-service";
import {
  runDiagnosisInsightsChain,
  runDiagnosisTasksChain,
} from "../langchain/diagnosis-chain";

export async function generateDiagnosis(
  project: ProjectWithRelations
): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  return mockAIService.generateDiagnosis(project);
}

export async function generateDiagnosisInsights(
  project: ProjectWithRelations,
  diagnosisItems: DiagnosisItem[]
): Promise<Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  const drafts = await runDiagnosisInsightsChain({ project, diagnosisItems });

  return withMockDelay(
    () =>
      drafts.map((d) => ({
        title: d.title,
        type: d.type,
        priority: d.priority,
        summary: d.summary,
        evidence: d.sourceTitle ? `Diagnosis: ${d.sourceTitle}` : null,
        recommendation: d.recommendation,
        confidence: 0.88,
        status: "open" as const,
        sourceType: "diagnosis" as const,
        sourceId: diagnosisItems.find((item) => item.title === d.sourceTitle)?.id ?? null,
      })),
    400
  );
}

export async function generateTasksFromDiagnosis(
  project: ProjectWithRelations,
  diagnosisItems: DiagnosisItem[],
  options?: { insightsSummary?: string }
): Promise<Omit<AITask, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  const drafts = await runDiagnosisTasksChain({
    project,
    diagnosisItems,
    insightsSummary: options?.insightsSummary,
  });

  return withMockDelay(
    () =>
      drafts.map((t) => ({
        insightId: null,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: "pending" as const,
        assignedToId: null,
        dueDate: null,
      })),
    350
  );
}
