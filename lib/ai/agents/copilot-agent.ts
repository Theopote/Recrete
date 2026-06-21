import type { AIMessage } from "@/types";
import type { ProjectAIContext } from "@/types/ai";
import { getAIService } from "../index";
import { mockAIService } from "../mock-ai-service";
import { isOpenAIConfigured } from "../model-router";
import { withMockDelay } from "../providers/utils";

function toProjectContext(projectContext: ProjectAIContext) {
  return {
    project: projectContext.project,
    documents: projectContext.project.documents,
    diagnosisItems: projectContext.project.diagnosis,
    strategies: projectContext.project.strategies,
    issues: projectContext.project.issues,
    buildingMemory: projectContext.buildingMemory,
    insights: projectContext.insights,
    evidence: projectContext.evidence,
    knowledgeSnippets: projectContext.knowledgeSnippets,
  };
}

export async function askProjectCopilot(
  projectContext: ProjectAIContext,
  messages: AIMessage[]
): Promise<string> {
  const ctx = toProjectContext(projectContext);

  if (isOpenAIConfigured()) {
    return getAIService().askProjectAssistant(ctx, messages);
  }

  return withMockDelay(
    () => mockAIService.askProjectAssistant(ctx, messages),
    600
  );
}

export async function suggestNextActions(projectContext: ProjectAIContext): Promise<string[]> {
  return withMockDelay(() => {
    const tasks = projectContext.tasks.filter((t) => t.status === "pending").slice(0, 4);
    const missing = projectContext.buildingMemory?.missingInformation.slice(0, 2) ?? [];
    return [
      ...tasks.map((t) => t.title),
      ...missing.map((m) => `Resolve: ${m}`),
      "Update Building Memory with latest site data",
    ].slice(0, 5);
  }, 400);
}

export async function answerRiskQuestion(
  projectContext: ProjectAIContext,
  question: string
): Promise<string> {
  return askProjectCopilot(projectContext, [
    { role: "user", content: question, timestamp: new Date() },
  ]);
}

/** Expose RAG snippets for API / UI source attribution. */
export function getCopilotRagSources(projectContext: ProjectAIContext) {
  return {
    knowledge: projectContext.knowledgeSnippets ?? [],
    evidence: projectContext.evidence.slice(0, 6),
  };
}
