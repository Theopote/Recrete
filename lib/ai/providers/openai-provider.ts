import "server-only";

import type { AIService } from "../types";
import { openAIService } from "../openai-service";

/** OpenAI-backed AIService — scenario-routed models via openai-service. */
export class OpenAIProvider implements AIService {
  generateDiagnosis = openAIService.generateDiagnosis.bind(openAIService);
  generateRenovationStrategies = openAIService.generateRenovationStrategies.bind(openAIService);
  generateReport = openAIService.generateReport.bind(openAIService);
  askProjectAssistant = openAIService.askProjectAssistant.bind(openAIService);
}

export const openAIProvider = new OpenAIProvider();
