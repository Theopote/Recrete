import { getProjectById, getProjectEvidence } from "@/lib/db/repository";
import { retrieveCopilotRagContext } from "@/lib/ai/knowledge/copilot-rag";
import type { ProjectAIContext } from "@/types/ai";

export async function buildProjectAIContext(
  projectId: string,
  organizationId: string,
  userQuery?: string
): Promise<ProjectAIContext | null> {
  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const allEvidence = await getProjectEvidence(projectId);
  const rag = await retrieveCopilotRagContext({
    project,
    userQuery,
    evidence: allEvidence,
  });

  return {
    project,
    buildingMemory: project.buildingMemory ?? null,
    insights: project.insights ?? [],
    tasks: project.tasks ?? [],
    analysisRuns: project.analysisRuns ?? [],
    evidence: rag.evidence,
    knowledgeSnippets: rag.knowledgeSnippets,
  };
}

export async function buildProjectAIContextSync(
  project: NonNullable<Awaited<ReturnType<typeof getProjectById>>>,
  evidence: ProjectAIContext["evidence"] = [],
  userQuery?: string
): Promise<ProjectAIContext> {
  const rag = await retrieveCopilotRagContext({
    project,
    userQuery,
    evidence,
  });

  return {
    project,
    buildingMemory: project.buildingMemory ?? null,
    insights: project.insights ?? [],
    tasks: project.tasks ?? [],
    analysisRuns: project.analysisRuns ?? [],
    evidence: rag.evidence,
    knowledgeSnippets: rag.knowledgeSnippets,
  };
}
