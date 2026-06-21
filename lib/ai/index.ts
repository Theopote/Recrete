import type { AIService } from "./types";
import { isOpenAIConfigured } from "./model-router";
import { mockAIProvider } from "./providers/mock-provider";
import { openAIProvider, openAIPlatform } from "./providers/openai-provider";

export function getAIService(): AIService {
  if (isOpenAIConfigured()) {
    return openAIProvider;
  }
  return mockAIProvider;
}

export function getAIPlatform() {
  if (isOpenAIConfigured()) {
    return openAIPlatform;
  }
  return mockAIProvider;
}

export { isOpenAIConfigured } from "./model-router";
export { mockAIProvider, openAIProvider, openAIPlatform };
export { buildProjectAIContext, buildProjectAIContextSync } from "./context-builder";
export * as agents from "./agents";
export type { AIService, ProjectContext, AIMessage } from "./types";
export { ASSISTANT_SUGGESTIONS, CREATE_PROJECT_SUGGESTIONS } from "./prompts";
