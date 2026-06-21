// AI-native types for Recrete (砼憶)

/** Insights persisted from Cost & Risk / energy ROI analysis */
export const COST_RISK_INSIGHT_SOURCE = "cost_risk" as const;

export type AIInsightType =
  | "missing_info"
  | "risk"
  | "opportunity"
  | "design_strategy"
  | "cost_warning"
  | "schedule_warning"
  | "compliance_warning"
  | "site_issue"
  | "report_suggestion"
  | "data_conflict";

export type AIInsightPriority = "low" | "medium" | "high" | "critical";

export type AIInsightStatus = "open" | "acknowledged" | "resolved" | "dismissed";

export type AITaskCategory =
  | "survey"
  | "structure"
  | "mep"
  | "facade"
  | "fire_safety"
  | "documentation"
  | "design"
  | "compliance"
  | "other";

export type AITaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type AIAnalysisType =
  | "building_memory_update"
  | "document_analysis"
  | "missing_info_detection"
  | "diagnosis_generation"
  | "strategy_generation"
  | "cost_risk_estimation"
  | "report_generation"
  | "copilot_chat"
  | "conflict_detection";

export type SourceEvidenceType =
  | "document"
  | "photo"
  | "site_issue"
  | "user_note"
  | "meeting_record"
  | "diagnosis";

export interface BuildingMemory {
  id: string;
  projectId: string;
  summary: string;
  knownFacts: string[];
  missingInformation: string[];
  keyRisks: string[];
  renovationPotential: string;
  designConstraints: string[];
  ownerRequirements: string[];
  importantDecisions: string[];
  unresolvedQuestions: string[];
  lastUpdatedByAI: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIInsight {
  id: string;
  projectId: string;
  title: string;
  type: AIInsightType;
  priority: AIInsightPriority;
  summary: string;
  evidence?: string | null;
  recommendation?: string | null;
  confidence: number;
  status: AIInsightStatus;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AITask {
  id: string;
  projectId: string;
  insightId?: string | null;
  title: string;
  description: string;
  category: AITaskCategory;
  priority: AIInsightPriority;
  status: AITaskStatus;
  assignedToId?: string | null;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAnalysisRun {
  id: string;
  projectId: string;
  analysisType: AIAnalysisType;
  inputSummary: string;
  outputSummary: string;
  generatedItemCount: number;
  modelName: string;
  confidence: number;
  createdAt: Date;
}

export interface SourceEvidence {
  id: string;
  projectId: string;
  sourceType: SourceEvidenceType;
  sourceId?: string | null;
  documentId?: string | null;
  pageNumber?: number | null;
  locationLabel?: string | null;
  quote?: string | null;
  boundingBox?: string | null;
  confidence: number;
  createdAt: Date;
}

export interface ProjectAIContext {
  project: import("@/types").ProjectWithRelations;
  buildingMemory?: BuildingMemory | null;
  insights: AIInsight[];
  tasks: AITask[];
  analysisRuns: AIAnalysisRun[];
  evidence: SourceEvidence[];
  knowledgeSnippets?: KnowledgeSnippet[];
}

export interface KnowledgeSnippet {
  id: string;
  sourceType: "case" | "knowledge" | "code";
  title: string;
  excerpt: string;
  relevance: number;
}

export interface StrategyLabParams {
  targetFunction: string;
  budgetLevel: string;
  /** Optional area override (m²); defaults to project.grossFloorArea */
  grossFloorArea?: number;
  preservationLevel: "low" | "medium" | "high";
  constructionIntensity: "low" | "medium" | "high";
  scheduleRequirement: "flexible" | "moderate" | "urgent";
  designAmbition: "conservative" | "balanced" | "ambitious";
  riskTolerance: "low" | "medium" | "high";
}

export interface StrategyRankEntry {
  strategyId: string;
  rank: number;
  compositeScore: number;
  areaFitScore: number;
  breakdown: {
    cost: number;
    schedule: number;
    risk: number;
    designValue: number;
    feasibility: number;
    preservation: number;
    areaFit: number;
  };
  summary: string;
}

export interface StrategyVersion {
  id: string;
  projectId: string;
  strategyId: string;
  versionNumber: number;
  label: string;
  snapshot: import("@/types").RenovationStrategy;
  instruction?: string | null;
  changeSummary?: string | null;
  createdAt: Date;
}

export interface CostRiskMatrix {
  strategies: {
    strategyId: string;
    strategyName: string;
    costRisk: number;
    scheduleRisk: number;
    constructionRisk: number;
    complianceRisk: number;
    /** Lifecycle-adjusted score when energy ROI improves operational cost profile */
    lifecycleCostScore?: number;
  }[];
  costWarnings: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[];
  scheduleWarnings: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[];
  phasingPlan: string[];
  energyRoi?: EnergyRoiSummary | null;
  energyOpportunities?: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[];
}

/** Energy ROI linked from Cost & Risk analysis */
export interface EnergyRoiSummary {
  totalInvestment: number;
  annualEnergySavingsKwh: number;
  annualCostSavings: number;
  simplePaybackYears: number;
  roiPercent10Year: number;
  currentEui: number;
  targetEui: number;
  rating: "poor" | "average" | "good";
  recommendedMeasures: Array<{ nameZh: string; savingsPercent: number }>;
  linkedStrategyId?: string;
  linkedStrategyName?: string;
}

export interface CommandCenterData {
  projects: import("@/types").Project[];
  insights: AIInsight[];
  tasks: AITask[];
  analysisRuns: AIAnalysisRun[];
  avgAiReadiness: number;
  avgDataCompleteness: number;
  highRiskInsightCount: number;
  missingInfoCount: number;
}
