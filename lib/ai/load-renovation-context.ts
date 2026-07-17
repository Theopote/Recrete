import { getProjectEvidence } from "@/lib/db/repository";
import type { ProjectWithRelations } from "@/types";
import {
  buildRenovationContext,
  formatRenovationContextBlock,
} from "@/lib/ai/renovation-context";
import { loadProjectDrawingGraph } from "@/lib/ai/load-project-drawing-graph";
import { formatDrawingGraphSection } from "@/lib/ai/strategy-schema";

export async function loadRenovationContextBlock(
  project: ProjectWithRelations,
  options?: {
    includeDiagnosis?: boolean;
    includeMemory?: boolean;
    includeStrategies?: boolean;
    includeDrawingGraph?: boolean;
  }
): Promise<string> {
  const evidence = await getProjectEvidence(project.id);
  const ctx = buildRenovationContext(project, evidence);
  const blocks = [
    formatRenovationContextBlock(ctx, {
      diagnosis: options?.includeDiagnosis ? project.diagnosis : undefined,
      includeMemory: options?.includeMemory,
      includeStrategies: options?.includeStrategies,
    }),
  ];

  if (options?.includeDrawingGraph !== false) {
    const documentNames = Object.fromEntries(
      (project.documents ?? []).map((doc) => [doc.id, doc.name])
    );
    const graph = await loadProjectDrawingGraph(project.id, documentNames);
    blocks.push(formatDrawingGraphSection(graph));
  }

  return blocks.filter(Boolean).join("\n\n");
}
