import "server-only";

import type { AIService } from "./types";
import { isOpenAIConfigured } from "./model-router";
import { mockAIProvider } from "./providers/mock-provider";
import { openAIProvider } from "./providers/openai-provider";
import { openAIPlatform } from "./providers/openai-platform";

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

export { isOpenAIConfigured, getAIServiceMode, isRealAIEnabled } from "./model-router";
export { withAIInvocation } from "./invoke";
export type { InvokeAIContext } from "./invoke";
export { aiErrorResponse } from "./api-response";
export { getAIStatus } from "./ai-status";
export { normalizeAIError, AIServiceError, aiErrorToJson } from "./errors";
export type { AIErrorCode } from "./errors";
export { mockAIProvider, openAIProvider, openAIPlatform };
export { buildProjectAIContext, buildProjectAIContextSync } from "./context-builder";
export * as agents from "./agents";
export type { AIService, ProjectContext, AIMessage } from "./types";
export { ASSISTANT_SUGGESTIONS, CREATE_PROJECT_SUGGESTIONS } from "./prompts";
