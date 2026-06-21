import type { AIService } from "../types";
import * as agents from "../agents";
import { mockAIService } from "../mock-ai-service";

/** Mock AI provider — orchestrates specialized agents for MVP */
export class MockAIProvider implements AIService {
  generateDiagnosis = mockAIService.generateDiagnosis.bind(mockAIService);
  generateRenovationStrategies = mockAIService.generateRenovationStrategies.bind(mockAIService);
  generateReport = mockAIService.generateReport.bind(mockAIService);
  askProjectAssistant = mockAIService.askProjectAssistant.bind(mockAIService);

  buildingMemory = agents.buildingMemoryAgent;
  survey = agents.surveyAgent;
  diagnosis = agents.diagnosisAgent;
  strategy = agents.strategyAgent;
  costRisk = agents.costRiskAgent;
  report = agents.reportAgent;
  copilot = agents.copilotAgent;
}

export const mockAIProvider = new MockAIProvider();
