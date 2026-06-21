import "server-only";

import { generateComplianceDiagnosisHybrid } from "../compliance/hybrid-compliance";
import { mockAIProvider } from "./mock-provider";
import { openAIProvider } from "./openai-provider";

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
