import type { ProjectWithRelations } from "@/types";
import type { AIInsight, AITask } from "@/types/ai";
import { missingDocumentCategories } from "@/lib/mock-data/ai-native";
import { withMockDelay } from "../providers/utils";

export async function analyzeUploadedDocuments(project: ProjectWithRelations) {
  return withMockDelay(() => {
    const docs = project.documents ?? [];
    return docs.map((doc) => ({
      documentId: doc.id,
      category: doc.category,
      aiSummary:
        doc.aiSummary ??
        `AI summary pending for ${doc.name}. Document type: ${doc.category.replace(/_/g, " ")}.`,
      confidence: 0.82,
    }));
  }, 1000);
}

export async function detectMissingInformation(
  project: ProjectWithRelations
): Promise<Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  return withMockDelay(() => {
    const docs = project.documents ?? [];
    const categories = new Set(docs.map((d) => d.category));
    const missing = missingDocumentCategories.filter(
      (label) => !categories.has("structure_documents") && label.includes("structural")
        ? false
        : label.includes("Hazardous") && !categories.has("others")
    );

    return missing.slice(0, 4).map((item, i) => ({
      title: item,
      type: "missing_info" as const,
      priority: i === 0 ? ("high" as const) : ("medium" as const),
      summary: `Required for ${project.name} renovation planning — not found in current document archive.`,
      evidence: `Document archive scan (${docs.length} files)`,
      recommendation: "Upload or commission this document before schematic design.",
      confidence: 0.88 - i * 0.05,
      status: "open" as const,
      sourceType: "document",
      sourceId: null,
    }));
  }, 900);
}

export async function generateSurveyTaskList(
  project: ProjectWithRelations
): Promise<Omit<AITask, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  return withMockDelay(
    () => [
      {
        insightId: null,
        title: "Complete measured floor plan survey",
        description: `Field measure all floors of ${project.name} to verify as-built conditions.`,
        category: "survey" as const,
        priority: "high" as const,
        status: "pending" as const,
        assignedToId: null,
        dueDate: null,
      },
      {
        insightId: null,
        title: "Photograph all facade elevations",
        description: "Document north, east, and west elevations to complement existing south facade survey.",
        category: "survey" as const,
        priority: "medium" as const,
        status: "pending" as const,
        assignedToId: null,
        dueDate: null,
      },
      {
        insightId: null,
        title: "MEP shaft and riser survey",
        description: "Document vertical shaft dimensions and routing for new load planning.",
        category: "mep" as const,
        priority: "high" as const,
        status: "pending" as const,
        assignedToId: null,
        dueDate: null,
      },
    ],
    800
  );
}
