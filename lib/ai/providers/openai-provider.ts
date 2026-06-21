/** OpenAI-compatible provider placeholder for future LLM integration */
import type { AIService } from "../types";
import { mockAIService } from "../mock-ai-service";

export class OpenAIProvider implements AIService {
  generateDiagnosis = mockAIService.generateDiagnosis.bind(mockAIService);
  generateRenovationStrategies = mockAIService.generateRenovationStrategies.bind(mockAIService);
  generateReport = mockAIService.generateReport.bind(mockAIService);
  askProjectAssistant = mockAIService.askProjectAssistant.bind(mockAIService);
}

export const openAIProvider = new OpenAIProvider();
