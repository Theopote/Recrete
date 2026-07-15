import type {
  Project,
  ProjectWithRelations,
  Building,
  DocumentAsset,
  DiagnosisItem,
  RenovationStrategy,
  SiteIssue,
  Report,
  User,
} from "@/types";
import type { BuildingMemory, AIInsight, AITask } from "@/types/ai";
import type {
  Project as PrismaProject,
  Building as PrismaBuilding,
  DocumentAsset as PrismaDocument,
  DiagnosisItem as PrismaDiagnosis,
  RenovationStrategy as PrismaStrategy,
  SiteIssue as PrismaIssue,
  Report as PrismaReport,
  User as PrismaUser,
} from "@prisma/client";

export function mapUser(u: PrismaUser): User {
  return {
    id: u.id,
    organizationId: u.organizationId,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    role: u.role,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export function mapProject(p: PrismaProject): Project {
  const ext = p as PrismaProject & { aiReadinessScore?: number; dataCompletenessScore?: number };
  return {
    id: p.id,
    organizationId: p.organizationId,
    name: p.name,
    code: p.code,
    location: p.location,
    buildingType: p.buildingType,
    originalFunction: p.originalFunction,
    currentFunction: p.currentFunction,
    targetFunction: p.targetFunction,
    constructionYear: p.constructionYear,
    structureType: p.structureType,
    floorCount: p.floorCount,
    grossFloorArea: p.grossFloorArea,
    status: p.status,
    renovationGoal: p.renovationGoal,
    budgetLevel: p.budgetLevel,
    riskLevel: p.riskLevel,
    healthScore: p.healthScore,
    potentialScore: p.potentialScore,
    aiReadinessScore: ext.aiReadinessScore ?? 50,
    dataCompletenessScore: ext.dataCompletenessScore ?? 50,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function mapBuilding(b: PrismaBuilding): Building {
  return { ...b };
}

export function mapDocument(d: PrismaDocument): DocumentAsset {
  return {
    ...d,
    aiSummary: d.aiSummary,
    extractedText: d.extractedText,
  };
}

export function mapDiagnosis(d: PrismaDiagnosis): DiagnosisItem {
  return {
    ...d,
    insightId: d.insightId,
    requiresEngineerReview: d.requiresEngineerReview ?? false,
  };
}

export function mapStrategy(s: PrismaStrategy): RenovationStrategy {
  return {
    ...s,
    designValueScore: s.designValueScore ?? undefined,
    feasibilityScore: s.feasibilityScore ?? undefined,
    preservationScore: s.preservationScore ?? undefined,
    recommendationReason: s.recommendationReason,
  };
}

export function mapIssue(i: PrismaIssue): SiteIssue {
  return {
    ...i,
    aiDetected: i.aiDetected ?? false,
    relatedInsightId: i.relatedInsightId,
  };
}

export function mapReport(r: PrismaReport): Report {
  return {
    ...r,
    generatedByAI: r.generatedByAI ?? false,
  };
}

type ProjectFull = PrismaProject & {
  building: PrismaBuilding | null;
  documents: PrismaDocument[];
  diagnosis: PrismaDiagnosis[];
  strategies: PrismaStrategy[];
  issues: PrismaIssue[];
  reports: PrismaReport[];
};

export function mapProjectWithRelations(p: ProjectFull): ProjectWithRelations {
  return mapProjectWithRelationsExtended(p);
}

type ProjectExtended = ProjectFull & {
  buildingMemory?: {
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
  } | null;
  insights?: Array<{
    id: string;
    projectId: string;
    title: string;
    type: AIInsight["type"];
    priority: AIInsight["priority"];
    summary: string;
    evidence: string | null;
    recommendation: string | null;
    confidence: number;
    status: AIInsight["status"];
    sourceType: string | null;
    sourceId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  tasks?: Array<{
    id: string;
    projectId: string;
    insightId: string | null;
    title: string;
    description: string;
    category: AITask["category"];
    priority: AITask["priority"];
    status: AITask["status"];
    assignedToId: string | null;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export function mapProjectWithRelationsExtended(p: ProjectExtended): ProjectWithRelations {
  return {
    ...mapProject(p),
    building: p.building ? mapBuilding(p.building) : null,
    buildingMemory: p.buildingMemory
      ? ({
          ...p.buildingMemory,
        } satisfies BuildingMemory)
      : null,
    documents: p.documents.map(mapDocument),
    insights: p.insights?.map((i) => ({ ...i })) ?? [],
    tasks: p.tasks?.map((t) => ({ ...t, dueDate: t.dueDate })) ?? [],
    diagnosis: p.diagnosis.map(mapDiagnosis),
    strategies: p.strategies.map(mapStrategy),
    issues: p.issues.map(mapIssue),
    reports: p.reports.map(mapReport),
  };
}
