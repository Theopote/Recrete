import { getProjectEvidence } from "@/lib/db/repository";
import type { ProjectWithRelations } from "@/types";
import {
  buildRenovationContext,
  formatRenovationContextBlock,
} from "@/lib/ai/renovation-context";

export async function loadRenovationContextBlock(
  project: ProjectWithRelations,
  options?: {
    includeDiagnosis?: boolean;
    includeMemory?: boolean;
    includeStrategies?: boolean;
  }
): Promise<string> {
  const evidence = await getProjectEvidence(project.id);
  const ctx = buildRenovationContext(project, evidence);
  return formatRenovationContextBlock(ctx, {
    diagnosis: options?.includeDiagnosis ? project.diagnosis : undefined,
    includeMemory: options?.includeMemory,
    includeStrategies: options?.includeStrategies,
  });
}
