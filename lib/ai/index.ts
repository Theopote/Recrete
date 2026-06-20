import type { AIService } from "./types";
import { mockAIService } from "./mock-ai-service";
import { openAIService } from "./openai-service";

export function getAIService(): AIService {
  const service = process.env.AI_SERVICE ?? "mock";
  if (service === "openai" && process.env.OPENAI_API_KEY) {
    return openAIService;
  }
  return mockAIService;
}

export { mockAIService, openAIService };
export type { AIService, ProjectContext, AIMessage } from "./types";
export { ASSISTANT_SUGGESTIONS } from "./prompts";
