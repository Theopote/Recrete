import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import type { AIInsight, AITask } from "@/types/ai";
import { withMockDelay } from "../providers/utils";
import { mockAIService } from "../mock-ai-service";

export async function generateDiagnosis(
  project: ProjectWithRelations
): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  return mockAIService.generateDiagnosis(project);
}

export async function generateDiagnosisInsights(
  project: ProjectWithRelations,
  diagnosisItems: DiagnosisItem[]
): Promise<Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  return withMockDelay(
    () =>
      diagnosisItems
        .filter((d) => d.severity === "high" || d.severity === "critical")
        .map((d) => ({
          title: d.title,
          type: d.category === "fire_safety" ? ("compliance_warning" as const) : ("risk" as const),
          priority: d.severity === "critical" ? ("critical" as const) : ("high" as const),
          summary: d.description.slice(0, 200),
          evidence: d.evidence ?? null,
          recommendation: d.recommendation ?? null,
          confidence: 0.86,
          status: "open" as const,
          sourceType: "diagnosis",
          sourceId: d.id,
        })),
    600
  );
}

export async function generateTasksFromDiagnosis(
  project: ProjectWithRelations,
  diagnosisItems: DiagnosisItem[]
): Promise<Omit<AITask, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  return withMockDelay(
    () =>
      diagnosisItems
        .filter((d) => d.requiresEngineerReview)
        .map((d) => ({
          insightId: d.insightId ?? null,
          title: `Engineer review: ${d.title}`,
          description: d.recommendation ?? d.description,
          category: (d.category === "structure" ? "structure" : d.category === "mep" ? "mep" : "compliance") as AITask["category"],
          priority: d.severity === "critical" ? ("critical" as const) : ("high" as const),
          status: "pending" as const,
          assignedToId: null,
          dueDate: null,
        })),
    500
  );
}
