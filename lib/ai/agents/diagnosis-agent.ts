import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import type { AIInsight, AITask } from "@/types/ai";
import { getAIService } from "@/lib/ai";
import { withMockDelay } from "../providers/utils";
import {
  runDiagnosisInsightsChain,
  runDiagnosisTasksChain,
} from "../langchain/diagnosis-chain";
import { insightConfidenceFromDiagnosis } from "./cost-risk-scoring";

function findDiagnosisForDraft(
  diagnosisItems: DiagnosisItem[],
  sourceTitle?: string
): DiagnosisItem | undefined {
  if (!sourceTitle) return undefined;
  return diagnosisItems.find(
    (item) =>
      item.title.trim().toLowerCase() === sourceTitle.trim().toLowerCase() ||
      item.id === sourceTitle
  );
}

export async function generateDiagnosis(
  project: ProjectWithRelations
): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  const ai = getAIService();
  return ai.generateDiagnosis(project, project.documents);
}

export async function generateDiagnosisInsights(
  project: ProjectWithRelations,
  diagnosisItems: DiagnosisItem[]
): Promise<Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  const drafts = await runDiagnosisInsightsChain({ project, diagnosisItems });

  return withMockDelay(
    () =>
      drafts.map((d) => {
        const matched = findDiagnosisForDraft(diagnosisItems, d.sourceTitle);
        return {
          title: d.title,
          type: d.type,
          priority: d.priority,
          summary: d.summary,
          evidence:
            matched?.evidence ??
            (d.sourceTitle ? `Diagnosis: ${d.sourceTitle}` : null),
          recommendation: d.recommendation,
          confidence: insightConfidenceFromDiagnosis(matched),
          status: "open" as const,
          sourceType: "diagnosis" as const,
          sourceId: matched?.id ?? null,
        };
      }),
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
