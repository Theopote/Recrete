import type { AIMessage } from "@/types";
import type { ProjectAIContext } from "@/types/ai";
import { mockAIService } from "../mock-ai-service";
import { withMockDelay } from "../providers/utils";

export async function askProjectCopilot(
  projectContext: ProjectAIContext,
  messages: AIMessage[]
): Promise<string> {
  return mockAIService.askProjectAssistant(
    {
      project: projectContext.project,
      documents: projectContext.project.documents,
      diagnosisItems: projectContext.project.diagnosis,
      strategies: projectContext.project.strategies,
      issues: projectContext.project.issues,
      buildingMemory: projectContext.buildingMemory,
      insights: projectContext.insights,
      evidence: projectContext.evidence,
    },
    messages
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
