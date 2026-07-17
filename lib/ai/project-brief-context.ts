import type { DocumentAsset } from "@/types";
import type { ProjectBriefFact } from "@/types/document-facts";
import { parseStoredDocumentExtract } from "@/lib/documents/structured-extract-storage";

export interface ProjectBriefFactWithSource extends ProjectBriefFact {
  documentId: string;
  documentName: string;
}

export function collectStructuredProjectBriefFacts(
  documents: DocumentAsset[] = []
): ProjectBriefFactWithSource[] {
  const facts: ProjectBriefFactWithSource[] = [];
  for (const doc of documents) {
    if (doc.isCurrentVersion === false) continue;
    if (doc.category !== "project_brief") continue;
    const stored = parseStoredDocumentExtract(doc.extractedText);
    if (stored?.structured?.kind !== "project_brief") continue;
    for (const fact of stored.structured.facts) {
      facts.push({
        ...fact,
        documentId: doc.id,
        documentName: doc.name,
      });
    }
  }
  return facts;
}

export function formatProjectBriefConstraintsBlock(
  facts: ProjectBriefFactWithSource[]
): string {
  if (facts.length === 0) {
    return "No structured owner brief constraints extracted yet.";
  }

  const prioritized = facts
    .slice()
    .sort((a, b) => {
      const score = (field: ProjectBriefFact["field"]) =>
        field === "constraint" || field === "objective"
          ? 3
          : field === "program" || field === "metric" || field === "schedule"
            ? 2
            : 1;
      return score(b.field) - score(a.field);
    })
    .slice(0, 12);

  return prioritized
    .map(
      (f, i) =>
        `${i + 1}. [${f.documentName}] ${f.label} (${f.field}): ${f.value.slice(0, 180)}`
    )
    .join("\n");
}
