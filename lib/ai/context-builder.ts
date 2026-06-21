import { getProjectById, getProjectEvidence } from "@/lib/db/repository";
import type { ProjectAIContext } from "@/types/ai";

export async function buildProjectAIContext(projectId: string): Promise<ProjectAIContext | null> {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const evidence = await getProjectEvidence(projectId);

  return {
    project,
    buildingMemory: project.buildingMemory ?? null,
    insights: project.insights ?? [],
    tasks: project.tasks ?? [],
    analysisRuns: project.analysisRuns ?? [],
    evidence,
  };
}

export function buildProjectAIContextSync(
  project: NonNullable<Awaited<ReturnType<typeof getProjectById>>>,
  evidence: ProjectAIContext["evidence"] = []
): ProjectAIContext {
  return {
    project,
    buildingMemory: project.buildingMemory ?? null,
    insights: project.insights ?? [],
    tasks: project.tasks ?? [],
    analysisRuns: project.analysisRuns ?? [],
    evidence,
  };
}
