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
  structural = {
    assessStructuralSafety: agents.assessStructuralSafety,
    generateStructuralDiagnosis: agents.generateStructuralDiagnosis,
    suggestStrengtheningMethods: agents.suggestStrengtheningMethods,
  };
  compliance = {
    performComplianceCheck: agents.performComplianceCheck,
    generateComplianceDiagnosis: agents.generateComplianceDiagnosis,
    searchCodeRequirements: agents.searchCodeRequirements,
  };
  fire = {
    analyzeFireSafety: agents.analyzeFireSafety,
    generateFireDiagnosis: agents.generateFireDiagnosis,
  };
  mep = {
    assessMepCapacity: agents.assessMepCapacity,
    generateMepDiagnosis: agents.generateMepDiagnosis,
  };
  energy = {
    analyzeEnergyPerformance: agents.analyzeEnergyPerformance,
    simulateBuildingEnergy: agents.simulateBuildingEnergy,
    generateEnergyDiagnosis: agents.generateEnergyDiagnosis,
  };
  costEstimator = {
    estimateProjectCost: agents.estimateProjectCost,
  };
  heritage = {
    assessHeritageProject: agents.assessHeritageProject,
    generateHeritageDiagnosis: agents.generateHeritageDiagnosis,
  };
  conflict = {
    detectDataConflicts: agents.detectDataConflicts,
    conflictsToInsights: agents.conflictsToInsights,
  };
}

export const mockAIProvider = new MockAIProvider();
