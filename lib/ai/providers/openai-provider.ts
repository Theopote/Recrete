/** OpenAI-compatible provider placeholder for future LLM integration */
import type { AIService } from "../types";
import { mockAIProvider } from "./mock-provider";

export class OpenAIProvider implements AIService {
  private fallback = mockAIProvider;

  generateDiagnosis = (...args: Parameters<AIService["generateDiagnosis"]>) =>
    this.fallback.generateDiagnosis(...args);

  generateRenovationStrategies = (...args: Parameters<AIService["generateRenovationStrategies"]>) =>
    this.fallback.generateRenovationStrategies(...args);

  generateReport = (...args: Parameters<AIService["generateReport"]>) =>
    this.fallback.generateReport(...args);

  askProjectAssistant = (...args: Parameters<AIService["askProjectAssistant"]>) =>
    this.fallback.askProjectAssistant(...args);
}

export const openAIProvider = new OpenAIProvider();
