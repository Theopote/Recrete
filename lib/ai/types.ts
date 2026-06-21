import type {
  DiagnosisItem,
  Project,
  ProjectWithRelations,
  RenovationStrategy,
  ReportType,
  SiteIssue,
} from "@/types";
import type { AIMessage } from "@/types";
import type { BuildingMemory, AIInsight, SourceEvidence, KnowledgeSnippet } from "@/types/ai";

export interface ProjectContext {
  project: ProjectWithRelations;
  documents?: ProjectWithRelations["documents"];
  diagnosisItems?: DiagnosisItem[];
  strategies?: RenovationStrategy[];
  issues?: SiteIssue[];
  buildingMemory?: BuildingMemory | null;
  insights?: AIInsight[];
  evidence?: SourceEvidence[];
  knowledgeSnippets?: KnowledgeSnippet[];
}

export interface AIService {
  generateDiagnosis(
    project: ProjectWithRelations,
    _documents?: ProjectWithRelations["documents"]
  ): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]>;

  generateRenovationStrategies(
    project: ProjectWithRelations,
    diagnosisItems: DiagnosisItem[]
  ): Promise<
    Omit<
      RenovationStrategy,
      "id" | "projectId" | "createdAt" | "updatedAt"
    >[]
  >;

  generateReport(
    project: ProjectWithRelations,
    diagnosisItems: DiagnosisItem[],
    strategies: RenovationStrategy[],
    issues: SiteIssue[],
    reportType: ReportType
  ): Promise<{ title: string; content: string }>;

  askProjectAssistant(
    projectContext: ProjectContext,
    messages: AIMessage[]
  ): Promise<string>;
}

export type { AIMessage };
