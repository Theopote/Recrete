import { getProjectById, getProjectEvidence } from "@/lib/db/repository";
import { searchKnowledgeForProject } from "@/lib/ai/knowledge/embedding-search";
import type { ProjectAIContext } from "@/types/ai";

export async function buildProjectAIContext(
  projectId: string,
  userQuery?: string
): Promise<ProjectAIContext | null> {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const evidence = await getProjectEvidence(projectId);
  const knowledgeSnippets = searchKnowledgeForProject(project, userQuery, 5);

  return {
    project,
    buildingMemory: project.buildingMemory ?? null,
    insights: project.insights ?? [],
    tasks: project.tasks ?? [],
    analysisRuns: project.analysisRuns ?? [],
    evidence,
    knowledgeSnippets,
  };
}

export function buildProjectAIContextSync(
  project: NonNullable<Awaited<ReturnType<typeof getProjectById>>>,
  evidence: ProjectAIContext["evidence"] = [],
  userQuery?: string
): ProjectAIContext {
  const knowledgeSnippets = searchKnowledgeForProject(project, userQuery, 5);

  return {
    project,
    buildingMemory: project.buildingMemory ?? null,
    insights: project.insights ?? [],
    tasks: project.tasks ?? [],
    analysisRuns: project.analysisRuns ?? [],
    evidence,
    knowledgeSnippets,
  };
}
