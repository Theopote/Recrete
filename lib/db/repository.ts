import type {
  CreateProjectInput,
  DashboardStats,
  DiagnosisItem,
  DocumentAsset,
  Project,
  ProjectWithRelations,
  RenovationStrategy,
  Report,
  SiteIssue,
} from "@/types";
import {
  createMockStore,
  generateId,
  getDashboardStats,
  getProjectWithRelations,
  getRecentDiagnosis,
  getRecentProjects,
  getUserById,
  getAIInsightsSummary,
  mockProjects,
  strategyMetrics,
} from "@/lib/mock-data";
import type { StrategyWithMetrics } from "@/types";

let store = createMockStore();

export function resetStore() {
  store = createMockStore();
}

export async function getProjects(filters?: {
  status?: string;
  riskLevel?: string;
  buildingType?: string;
  targetFunction?: string;
}): Promise<Project[]> {
  let projects = [...store.projects];

  if (filters?.status && filters.status !== "all") {
    projects = projects.filter((p) => p.status === filters.status);
  }
  if (filters?.riskLevel && filters.riskLevel !== "all") {
    projects = projects.filter((p) => p.riskLevel === filters.riskLevel);
  }
  if (filters?.buildingType && filters.buildingType !== "all") {
    projects = projects.filter((p) => p.buildingType === filters.buildingType);
  }
  if (filters?.targetFunction && filters.targetFunction !== "all") {
    projects = projects.filter((p) => p.targetFunction === filters.targetFunction);
  }

  return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getProjectById(id: string): Promise<ProjectWithRelations | null> {
  const project = store.projects.find((p) => p.id === id);
  if (!project) return null;

  return {
    ...project,
    building: store.buildings.find((b) => b.projectId === id) ?? null,
    documents: store.documents.filter((d) => d.projectId === id),
    diagnosis: store.diagnosis.filter((d) => d.projectId === id),
    strategies: store.strategies.filter((s) => s.projectId === id),
    issues: store.issues.filter((i) => i.projectId === id),
    reports: store.reports.filter((r) => r.projectId === id),
  };
}

export async function createProject(input: CreateProjectInput): Promise<ProjectWithRelations> {
  const now = new Date();
  const project: Project = {
    id: generateId("proj"),
    organizationId: "org-1",
    name: input.name,
    code: input.code,
    location: input.location,
    buildingType: input.buildingType,
    originalFunction: input.originalFunction,
    currentFunction: input.currentFunction,
    targetFunction: input.targetFunction,
    constructionYear: input.constructionYear,
    structureType: input.structureType,
    floorCount: input.floorCount,
    grossFloorArea: input.grossFloorArea,
    status: "draft",
    renovationGoal: input.renovationGoal,
    budgetLevel: input.budgetLevel,
    riskLevel: "medium",
    healthScore: 50,
    potentialScore: 60,
    description: input.description ?? null,
    createdAt: now,
    updatedAt: now,
  };

  store.projects.push(project);

  if (input.buildingName || input.address) {
    store.buildings.push({
      id: generateId("bld"),
      projectId: project.id,
      name: input.buildingName ?? project.name,
      address: input.address ?? input.location,
      constructionYear: input.constructionYear,
      structureType: input.structureType,
      floorCount: input.floorCount,
      basementCount: input.basementCount ?? 0,
      grossFloorArea: input.grossFloorArea,
      currentCondition: input.currentCondition ?? "",
      heritageLevel: input.heritageLevel ?? "none",
      createdAt: now,
      updatedAt: now,
    });
  }

  return (await getProjectById(project.id))!;
}

export async function addDiagnosisItems(
  projectId: string,
  items: Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]
): Promise<DiagnosisItem[]> {
  const now = new Date();
  const created = items.map((item) => ({
    ...item,
    id: generateId("diag"),
    projectId,
    createdAt: now,
    updatedAt: now,
  }));
  store.diagnosis.push(...created);
  return created;
}

export async function addStrategies(
  projectId: string,
  strategies: Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">[]
): Promise<RenovationStrategy[]> {
  const now = new Date();
  const created = strategies.map((s) => ({
    ...s,
    id: generateId("strat"),
    projectId,
    createdAt: now,
    updatedAt: now,
  }));
  store.strategies.push(...created);
  return created;
}

export async function addDocument(
  projectId: string,
  doc: Omit<DocumentAsset, "id" | "projectId" | "createdAt" | "updatedAt">
): Promise<DocumentAsset> {
  const now = new Date();
  const created: DocumentAsset = {
    ...doc,
    id: generateId("doc"),
    projectId,
    createdAt: now,
    updatedAt: now,
  };
  store.documents.push(created);
  return created;
}

export async function updateIssueStatus(
  issueId: string,
  status: SiteIssue["status"]
): Promise<SiteIssue | null> {
  const issue = store.issues.find((i) => i.id === issueId);
  if (!issue) return null;
  issue.status = status;
  issue.updatedAt = new Date();
  return issue;
}

export async function addReport(
  projectId: string,
  report: Omit<Report, "id" | "projectId" | "createdAt" | "updatedAt">
): Promise<Report> {
  const now = new Date();
  const created: Report = {
    ...report,
    id: generateId("report"),
    projectId,
    createdAt: now,
    updatedAt: now,
  };
  store.reports.push(created);
  return created;
}

export async function getDashboardData() {
  return {
    stats: getDashboardStats(),
    recentProjects: getRecentProjects(5),
    recentDiagnosis: getRecentDiagnosis(5),
    aiInsights: getAIInsightsSummary(),
  };
}

export async function getStrategiesWithMetrics(
  projectId: string
): Promise<StrategyWithMetrics[]> {
  const strategies = store.strategies.filter((s) => s.projectId === projectId);
  return strategies.map((s) => ({
    ...s,
    metrics: strategyMetrics[s.id] ?? {
      cost: 50,
      schedule: 50,
      risk: 50,
      designValue: 50,
      constructionDifficulty: 50,
      preservationLevel: 50,
    },
  }));
}

export {
  getUserById,
  mockProjects,
};

export type { DashboardStats };
