export type UserRole =
  | "admin"
  | "architect"
  | "engineer"
  | "consultant"
  | "project_manager"
  | "owner"
  | "viewer";

export type ProjectStatus =
  | "draft"
  | "survey"
  | "diagnosis"
  | "strategy"
  | "design"
  | "construction"
  | "completed"
  | "archived";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type BudgetLevel = "low" | "medium" | "high" | "premium";

export type DocumentCategory =
  | "old_drawings"
  | "survey_photos"
  | "structure_documents"
  | "mep_documents"
  | "historical_documents"
  | "cost_documents"
  | "meeting_records"
  | "reports"
  | "others";

export type DiagnosisCategory =
  | "architecture"
  | "structure"
  | "facade"
  | "mep"
  | "fire_safety"
  | "accessibility"
  | "energy"
  | "heritage"
  | "operation";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export type DiagnosisStatus =
  | "identified"
  | "under_review"
  | "confirmed"
  | "resolved";

export type StrategyType =
  | "light_renewal"
  | "medium_renovation"
  | "deep_recreation"
  | "adaptive_reuse"
  | "facade_upgrade"
  | "energy_retrofit"
  | "safety_upgrade";

export type CostScheduleLevel = "low" | "medium" | "high";

export type IssueCategory =
  | "crack"
  | "leakage"
  | "spalling"
  | "corrosion"
  | "structure_exposure"
  | "mep_conflict"
  | "facade_damage"
  | "fire_safety"
  | "accessibility"
  | "drawing_mismatch"
  | "other";

export type IssuePriority = "low" | "medium" | "high" | "urgent";

export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";

export type ReportType =
  | "existing_condition_report"
  | "diagnosis_report"
  | "renovation_strategy_report"
  | "owner_presentation"
  | "government_submission"
  | "site_issue_report"
  | "design_meeting_summary";

export type ReportStatus = "draft" | "generating" | "ready" | "published";

export type HeritageLevel =
  | "none"
  | "local"
  | "provincial"
  | "national"
  | "world";

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  location: string;
  buildingType: string;
  originalFunction: string;
  currentFunction: string;
  targetFunction: string;
  constructionYear: number;
  structureType: string;
  floorCount: number;
  grossFloorArea: number;
  status: ProjectStatus;
  renovationGoal: string;
  budgetLevel: BudgetLevel;
  riskLevel: RiskLevel;
  healthScore: number;
  potentialScore: number;
  aiReadinessScore: number;
  dataCompletenessScore: number;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Building {
  id: string;
  projectId: string;
  name: string;
  address: string;
  constructionYear: number;
  structureType: string;
  floorCount: number;
  basementCount: number;
  grossFloorArea: number;
  currentCondition: string;
  heritageLevel: HeritageLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentAsset {
  id: string;
  projectId: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  aiSummary?: string | null;
  extractedText?: string | null;
  description?: string | null;
  uploadedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagnosisItem {
  id: string;
  projectId: string;
  insightId?: string | null;
  title: string;
  category: DiagnosisCategory;
  severity: SeverityLevel;
  status: DiagnosisStatus;
  description: string;
  evidence?: string | null;
  recommendation?: string | null;
  relatedLocation?: string | null;
  requiresEngineerReview?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RenovationStrategy {
  id: string;
  projectId: string;
  name: string;
  type: StrategyType;
  summary: string;
  designGoal: string;
  spatialStrategy: string;
  structuralStrategy: string;
  facadeStrategy: string;
  mepStrategy: string;
  costLevel: CostScheduleLevel;
  scheduleLevel: CostScheduleLevel;
  riskLevel: RiskLevel;
  designValueScore?: number;
  feasibilityScore?: number;
  preservationScore?: number;
  pros: string[];
  cons: string[];
  recommendationReason?: string | null;
  linkedDiagnosisIds?: string[];
  linkedEvidenceIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteIssue {
  id: string;
  projectId: string;
  title: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  location?: string | null;
  description: string;
  photoUrl?: string | null;
  assignedToId?: string | null;
  aiDetected?: boolean;
  relatedInsightId?: string | null;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  projectId: string;
  title: string;
  type: ReportType;
  content: string;
  status: ReportStatus;
  createdById?: string | null;
  generatedByAI?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithRelations extends Project {
  building?: Building | null;
  buildingMemory?: import("@/types/ai").BuildingMemory | null;
  documents?: DocumentAsset[];
  insights?: import("@/types/ai").AIInsight[];
  tasks?: import("@/types/ai").AITask[];
  analysisRuns?: import("@/types/ai").AIAnalysisRun[];
  diagnosis?: DiagnosisItem[];
  strategies?: RenovationStrategy[];
  issues?: SiteIssue[];
  reports?: Report[];
  sourceEvidence?: import("@/types/ai").SourceEvidence[];
  buildingMemoryHistory?: import("@/types/ai").BuildingMemoryHistoryEntry[];
  collaboration?: import("@/types/collaboration").CollaborationSummary;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  highRiskProjects: number;
  pendingIssues: number;
  statusDistribution: { status: ProjectStatus; count: number }[];
}

export interface CreateProjectInput {
  name: string;
  code: string;
  location: string;
  buildingType: string;
  originalFunction: string;
  currentFunction: string;
  targetFunction: string;
  constructionYear: number;
  structureType: string;
  floorCount: number;
  grossFloorArea: number;
  renovationGoal: string;
  budgetLevel: BudgetLevel;
  description?: string;
  buildingName?: string;
  address?: string;
  basementCount?: number;
  currentCondition?: string;
  heritageLevel?: HeritageLevel;
}

export type ProjectSection =
  | "overview"
  | "building-memory"
  | "survey-intelligence"
  | "bim-viewer"
  | "diagnosis"
  | "strategy-lab"
  | "collaboration"
  | "cost-risk"
  | "issues"
  | "reports"
  | "expert-agents"
  | "building"
  | "documents"
  | "strategies"
  | "timeline";

export interface StrategyComparisonMetrics {
  cost: number;
  schedule: number;
  risk: number;
  designValue: number;
  constructionDifficulty: number;
  preservationLevel: number;
  feasibility: number;
  /** ROI-adjusted lifecycle cost risk (lower is better); aligns with Cost & Risk matrix */
  lifecycleCost: number;
}

export interface StrategyWithMetrics extends RenovationStrategy {
  metrics: StrategyComparisonMetrics;
  rank?: number;
  compositeScore?: number;
  areaFitScore?: number;
}

export interface DiagnosisWithProject extends DiagnosisItem {
  projectName: string;
  projectCode: string;
}

export interface IssueWithProject extends SiteIssue {
  projectName: string;
  projectCode: string;
}

export interface ReportWithProject extends Report {
  projectName: string;
}

export interface StrategyWithProject extends RenovationStrategy {
  projectName: string;
}

export interface DocumentWithProject extends DocumentAsset {
  projectName: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  updatedAt: Date;
}

export interface SearchResult {
  type: "project" | "document" | "diagnosis" | "issue";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}
