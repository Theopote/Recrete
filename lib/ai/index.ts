import type { AIService } from "./types";
import { mockAIProvider } from "./providers/mock-provider";
import { openAIProvider } from "./providers/openai-provider";

export function getAIService(): AIService {
  const service = process.env.AI_SERVICE ?? "mock";
  if (service === "openai" && process.env.OPENAI_API_KEY) {
    return openAIProvider;
  }
  return mockAIProvider;
}

export function getAIPlatform() {
  return mockAIProvider;
}

export { mockAIProvider, openAIProvider };
export { buildProjectAIContext, buildProjectAIContextSync } from "./context-builder";
export * as agents from "./agents";
export type { AIService, ProjectContext, AIMessage } from "./types";
export { ASSISTANT_SUGGESTIONS, CREATE_PROJECT_SUGGESTIONS } from "./prompts";
