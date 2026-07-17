import "server-only";

import { getProjectById, updateProjectDataCompletenessScore } from "@/lib/db/repository";
import { computeProjectPhaseCompleteness } from "@/lib/documents/phase-completeness";
import type { DocumentAsset, ProjectStatus } from "@/types";

export function computeDataCompletenessScore(
  documents: DocumentAsset[],
  projectStatus?: ProjectStatus
): number {
  return computeProjectPhaseCompleteness(documents, projectStatus).overallScore;
}

export async function syncProjectDataCompleteness(
  projectId: string,
  organizationId: string
): Promise<number | null> {
  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const score = computeDataCompletenessScore(project.documents ?? [], project.status);
  await updateProjectDataCompletenessScore(projectId, score);
  return score;
}
