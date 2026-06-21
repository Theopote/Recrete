import "server-only";

import type { AIService } from "../types";
import { openAIService } from "../openai-service";
import { mockAIProvider } from "./mock-provider";
import { generateComplianceDiagnosisHybrid } from "../compliance/hybrid-compliance";

/** OpenAI-backed AIService — scenario-routed models via openai-service. */
export class OpenAIProvider implements AIService {
  generateDiagnosis = openAIService.generateDiagnosis.bind(openAIService);
  generateRenovationStrategies = openAIService.generateRenovationStrategies.bind(openAIService);
  generateReport = openAIService.generateReport.bind(openAIService);
  askProjectAssistant = openAIService.askProjectAssistant.bind(openAIService);
}

export const openAIProvider = new OpenAIProvider();

/**
 * Full AI platform: OpenAI for core generation, specialized agents from mock
 * with compliance upgraded to rule engine + RAG + LLM hybrid.
 */
export const openAIPlatform = Object.assign(
  Object.create(Object.getPrototypeOf(mockAIProvider)) as typeof mockAIProvider,
  mockAIProvider,
  {
    generateDiagnosis: openAIProvider.generateDiagnosis,
    generateRenovationStrategies: openAIProvider.generateRenovationStrategies,
    generateReport: openAIProvider.generateReport,
    askProjectAssistant: openAIProvider.askProjectAssistant,
    compliance: {
      ...mockAIProvider.compliance,
      generateComplianceDiagnosis: generateComplianceDiagnosisHybrid,
    },
  }
);
