import { prisma } from "@/lib/db/prisma";
import {
  mapProject,
  mapProjectWithRelations,
  mapDocument,
  mapDiagnosis,
  mapStrategy,
  mapIssue,
  mapReport,
  mapUser,
} from "@/lib/db/mappers";
import { knowledgeArticles } from "@/lib/mock-data/knowledge";
import { strategyMetrics, getAIInsightsSummary } from "@/lib/mock-data";
import type {
  CreateProjectInput,
  DiagnosisItem,
  DiagnosisWithProject,
  DocumentAsset,
  DocumentWithProject,
  IssueWithProject,
  KnowledgeArticle,
  Project,
  ProjectWithRelations,
  RenovationStrategy,
  Report,
  ReportWithProject,
  SearchResult,
  SiteIssue,
  StrategyWithProject,
  User,
} from "@/types";
import type { StrategyWithMetrics } from "@/types";
import type { ProjectStatus } from "@/types";

function buildProjectWhere(
  organizationId: string,
  filters?: {
  status?: string;
  riskLevel?: string;
  buildingType?: string;
  targetFunction?: string;
}) {
  const where: Record<string, unknown> = { organizationId };
  if (filters?.status && filters.status !== "all") where.status = filters.status;
  if (filters?.riskLevel && filters.riskLevel !== "all") where.riskLevel = filters.riskLevel;
  if (filters?.buildingType && filters.buildingType !== "all") where.buildingType = filters.buildingType;
  if (filters?.targetFunction && filters.targetFunction !== "all") where.targetFunction = filters.targetFunction;
  return where;
}

export async function getProjects(
  organizationId: string,
  filters?: {
    status?: string;
    riskLevel?: string;
    buildingType?: string;
    targetFunction?: string;
  }
): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: buildProjectWhere(organizationId, filters),
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapProject);
}

export async function getProjectById(
  id: string,
  organizationId: string
): Promise<ProjectWithRelations | null> {
  const row = await prisma.project.findFirst({
    where: { id, organizationId },
    include: {
      building: true,
      documents: { orderBy: { createdAt: "desc" } },
      diagnosis: { orderBy: { updatedAt: "desc" } },
      strategies: { orderBy: { updatedAt: "desc" } },
      issues: { orderBy: { updatedAt: "desc" } },
      reports: { orderBy: { createdAt: "desc" } },
    },
  });
  return row ? mapProjectWithRelations(row) : null;
}

export async function createProject(
  input: CreateProjectInput,
  organizationId: string
): Promise<ProjectWithRelations> {
  const project = await prisma.project.create({
    data: {
      organizationId,
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
      renovationGoal: input.renovationGoal,
      budgetLevel: input.budgetLevel,
      description: input.description,
      building:
        input.buildingName || input.address
          ? {
              create: {
                name: input.buildingName ?? input.name,
                address: input.address ?? input.location,
                constructionYear: input.constructionYear,
                structureType: input.structureType,
                floorCount: input.floorCount,
                basementCount: input.basementCount ?? 0,
                grossFloorArea: input.grossFloorArea,
                currentCondition: input.currentCondition ?? "",
                heritageLevel: input.heritageLevel ?? "none",
              },
            }
          : undefined,
    },
    include: {
      building: true,
      documents: true,
      diagnosis: true,
      strategies: true,
      issues: true,
      reports: true,
    },
  });
  return mapProjectWithRelations(project);
}

export async function addDiagnosisItems(
  projectId: string,
  items: Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]
): Promise<DiagnosisItem[]> {
  const created = await Promise.all(
    items.map((item) =>
      prisma.diagnosisItem.create({
        data: { ...item, projectId },
      })
    )
  );
  return created.map(mapDiagnosis);
}

export async function updateDiagnosisItem(
  itemId: string,
  data: Partial<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">>
): Promise<DiagnosisItem | null> {
  try {
    const updated = await prisma.diagnosisItem.update({
      where: { id: itemId },
      data,
    });
    return mapDiagnosis(updated);
  } catch {
    return null;
  }
}

export async function addStrategies(
  projectId: string,
  strategies: Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">[]
): Promise<RenovationStrategy[]> {
  const created = await Promise.all(
    strategies.map((s) =>
      prisma.renovationStrategy.create({
        data: { ...s, projectId },
      })
    )
  );
  return created.map(mapStrategy);
}

export async function addDocument(
  projectId: string,
  doc: Omit<DocumentAsset, "id" | "projectId" | "createdAt" | "updatedAt">
): Promise<DocumentAsset> {
  const created = await prisma.documentAsset.create({
    data: { ...doc, projectId },
  });
  return mapDocument(created);
}

export async function getDocumentById(documentId: string): Promise<DocumentAsset | null> {
  const doc = await prisma.documentAsset.findUnique({ where: { id: documentId } });
  return doc ? mapDocument(doc) : null;
}

export async function updateDocument(
  documentId: string,
  data: Partial<Pick<DocumentAsset, "aiSummary" | "extractedText" | "description">>
): Promise<DocumentAsset | null> {
  try {
    const updated = await prisma.documentAsset.update({
      where: { id: documentId },
      data,
    });
    return mapDocument(updated);
  } catch {
    return null;
  }
}

export async function addSourceEvidence(
  evidence: Omit<import("@/types/ai").SourceEvidence, "id" | "createdAt">
): Promise<import("@/types/ai").SourceEvidence> {
  const created = await prisma.sourceEvidence.create({ data: evidence });
  return {
    id: created.id,
    projectId: created.projectId,
    sourceType: created.sourceType,
    sourceId: created.sourceId,
    documentId: created.documentId,
    pageNumber: created.pageNumber,
    locationLabel: created.locationLabel,
    quote: created.quote,
    boundingBox: created.boundingBox,
    confidence: created.confidence,
    createdAt: created.createdAt,
  };
}

export async function addAnalysisRun(
  run: Omit<import("@/types/ai").AIAnalysisRun, "id" | "createdAt">
): Promise<import("@/types/ai").AIAnalysisRun> {
  const created = await prisma.aIAnalysisRun.create({ data: run });
  return {
    id: created.id,
    projectId: created.projectId,
    analysisType: created.analysisType,
    inputSummary: created.inputSummary,
    outputSummary: created.outputSummary,
    generatedItemCount: created.generatedItemCount,
    modelName: created.modelName,
    confidence: created.confidence,
    createdAt: created.createdAt,
  };
}

export async function getProjectEvidence(projectId: string) {
  const rows = await prisma.sourceEvidence.findMany({ where: { projectId } });
  return rows.map((e) => ({
    id: e.id,
    projectId: e.projectId,
    sourceType: e.sourceType,
    sourceId: e.sourceId,
    documentId: e.documentId,
    pageNumber: e.pageNumber,
    locationLabel: e.locationLabel,
    quote: e.quote,
    boundingBox: e.boundingBox,
    confidence: e.confidence,
    createdAt: e.createdAt,
  }));
}

export async function updateIssueStatus(
  issueId: string,
  status: SiteIssue["status"]
): Promise<SiteIssue | null> {
  try {
    const updated = await prisma.siteIssue.update({
      where: { id: issueId },
      data: { status },
    });
    return mapIssue(updated);
  } catch {
    return null;
  }
}

export async function addReport(
  projectId: string,
  report: Omit<Report, "id" | "projectId" | "createdAt" | "updatedAt">
): Promise<Report> {
  const created = await prisma.report.create({
    data: { ...report, projectId },
  });
  return mapReport(created);
}

export async function updateReport(
  reportId: string,
  data: Partial<Pick<Report, "title" | "content" | "status">>
): Promise<Report | null> {
  try {
    const updated = await prisma.report.update({
      where: { id: reportId },
      data,
    });
    return mapReport(updated);
  } catch {
    return null;
  }
}

export async function addIssue(
  projectId: string,
  issue: Omit<SiteIssue, "id" | "projectId" | "createdAt" | "updatedAt" | "status">
): Promise<SiteIssue> {
  const created = await prisma.siteIssue.create({
    data: { ...issue, projectId, status: "open" },
  });
  return mapIssue(created);
}

export async function getAllDiagnosis(filters?: {
  severity?: string;
  category?: string;
}): Promise<DiagnosisWithProject[]> {
  const where: Record<string, unknown> = {};
  if (filters?.severity && filters.severity !== "all") where.severity = filters.severity;
  if (filters?.category && filters.category !== "all") where.category = filters.category;

  const rows = await prisma.diagnosisItem.findMany({
    where,
    include: { project: { select: { name: true, code: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((d) => ({
    ...mapDiagnosis(d),
    projectName: d.project.name,
    projectCode: d.project.code,
  }));
}

export async function getAllIssues(filters?: {
  status?: string;
  priority?: string;
}): Promise<IssueWithProject[]> {
  const where: Record<string, unknown> = {};
  if (filters?.status && filters.status !== "all") where.status = filters.status;
  if (filters?.priority && filters.priority !== "all") where.priority = filters.priority;

  const rows = await prisma.siteIssue.findMany({
    where,
    include: { project: { select: { name: true, code: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((i) => ({
    ...mapIssue(i),
    projectName: i.project.name,
    projectCode: i.project.code,
  }));
}

export async function getAllReports(): Promise<ReportWithProject[]> {
  const rows = await prisma.report.findMany({
    include: { project: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    ...mapReport(r),
    projectName: r.project.name,
  }));
}

export async function getAllStrategies(): Promise<StrategyWithProject[]> {
  const rows = await prisma.renovationStrategy.findMany({
    include: { project: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((s) => ({
    ...mapStrategy(s),
    projectName: s.project.name,
  }));
}

export async function getAllDocuments(filters?: { category?: string }): Promise<DocumentWithProject[]> {
  const where: Record<string, unknown> = {};
  if (filters?.category && filters.category !== "all") where.category = filters.category;

  const rows = await prisma.documentAsset.findMany({
    where,
    include: { project: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((d) => ({
    ...mapDocument(d),
    projectName: d.project.name,
  }));
}

export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  return [...knowledgeArticles].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getKnowledgeArticle(id: string): Promise<KnowledgeArticle | null> {
  return knowledgeArticles.find((a) => a.id === id) ?? null;
}

export async function search(query: string): Promise<SearchResult[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const [projects, documents, diagnosis, issues] = await Promise.all([
    prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.documentAsset.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { aiSummary: { contains: q, mode: "insensitive" } },
          { extractedText: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { project: { select: { name: true } } },
      take: 4,
    }),
    prisma.diagnosisItem.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      include: { project: { select: { name: true } } },
      take: 4,
    }),
    prisma.siteIssue.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      include: { project: { select: { name: true } } },
      take: 4,
    }),
  ]);

  const results: SearchResult[] = [
    ...projects.map((p) => ({
      type: "project" as const,
      id: p.id,
      title: p.name,
      subtitle: `${p.code} · ${p.location}`,
      href: `/projects/${p.id}`,
    })),
    ...documents.map((d) => ({
      type: "document" as const,
      id: d.id,
      title: d.name,
      subtitle: d.project.name,
      href: `/projects/${d.projectId}?section=documents`,
    })),
    ...diagnosis.map((d) => ({
      type: "diagnosis" as const,
      id: d.id,
      title: d.title,
      subtitle: `${d.project.name} · ${d.severity}`,
      href: `/projects/${d.projectId}?section=diagnosis`,
    })),
    ...issues.map((i) => ({
      type: "issue" as const,
      id: i.id,
      title: i.title,
      subtitle: `${i.project.name} · ${i.priority}`,
      href: `/projects/${i.projectId}?section=issues`,
    })),
  ];

  return results.slice(0, 12);
}

export async function getDashboardData(organizationId: string) {
  const { getDashboardData: mockDashboard } = await import("@/lib/db/mock-repository");
  return mockDashboard(organizationId);
}

export async function getCommandCenterData(organizationId: string) {
  const { getCommandCenterData: mockCommandCenter } = await import("@/lib/db/mock-repository");
  return mockCommandCenter(organizationId);
}

export async function updateBuildingMemory(projectId: string, organizationId: string) {
  const { updateBuildingMemory: mockUpdate } = await import("@/lib/db/mock-repository");
  return mockUpdate(projectId, organizationId);
}

export async function addInsights(
  projectId: string,
  insights: Parameters<typeof import("@/lib/db/mock-repository").addInsights>[1]
) {
  const { addInsights: mockAdd } = await import("@/lib/db/mock-repository");
  return mockAdd(projectId, insights);
}

export async function replaceInsightsBySourceType(
  projectId: string,
  sourceType: string,
  insights: Parameters<typeof import("@/lib/db/mock-repository").replaceInsightsBySourceType>[2]
) {
  const { replaceInsightsBySourceType: mockReplace } = await import("@/lib/db/mock-repository");
  return mockReplace(projectId, sourceType, insights);
}

export async function addTasks(
  projectId: string,
  tasks: Parameters<typeof import("@/lib/db/mock-repository").addTasks>[1]
) {
  const { addTasks: mockAdd } = await import("@/lib/db/mock-repository");
  return mockAdd(projectId, tasks);
}

export async function updateStrategy(
  strategyId: string,
  data: Parameters<typeof import("@/lib/db/mock-repository").updateStrategy>[1]
) {
  const { updateStrategy: mockUpdate } = await import("@/lib/db/mock-repository");
  return mockUpdate(strategyId, data);
}

export async function addStrategyVersion(
  projectId: string,
  strategy: Parameters<typeof import("@/lib/db/mock-repository").addStrategyVersion>[1],
  meta?: Parameters<typeof import("@/lib/db/mock-repository").addStrategyVersion>[2]
) {
  const { addStrategyVersion: mockAdd } = await import("@/lib/db/mock-repository");
  return mockAdd(projectId, strategy, meta);
}

export async function getStrategyVersions(strategyId: string) {
  const { getStrategyVersions: mockGet } = await import("@/lib/db/mock-repository");
  return mockGet(strategyId);
}

export async function getStrategyVersionById(versionId: string) {
  const { getStrategyVersionById: mockGet } = await import("@/lib/db/mock-repository");
  return mockGet(versionId);
}

export async function getStrategiesWithMetrics(projectId: string): Promise<StrategyWithMetrics[]> {
  const strategies = await prisma.renovationStrategy.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
  });
  return strategies.map((s) => ({
    ...mapStrategy(s),
    metrics: strategyMetrics[s.id] ?? {
      cost: 50,
      schedule: 50,
      risk: 50,
      designValue: 50,
      constructionDifficulty: 50,
      preservationLevel: 50,
      feasibility: 50,
      lifecycleCost: 50,
    },
  }));
}

export async function getUserById(id: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? mapUser(user) : undefined;
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
