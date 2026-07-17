import { prisma } from "@/lib/db/prisma";
import {
  mapProject,
  mapProjectWithRelations,
  mapProjectWithRelationsExtended,
  mapProjectOverview,
  mapDocument,
  mapDiagnosis,
  mapStrategy,
  mapIssue,
  mapReport,
  mapUser,
  mapBuilding,
} from "@/lib/db/mappers";
import { knowledgeArticles } from "@/lib/mock-data/knowledge";
import { strategyMetrics, getAIInsightsSummary } from "@/lib/mock-data";
import { computeStrategyMetrics } from "@/lib/utils/strategy-metrics";
import { attachStrategyRankings } from "@/lib/utils/strategy-ranking";
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
import type { AIProjectDraft } from "@/lib/ai/agents/project-creation-agent";
import type { BuildingMemory, AIInsight, AITask } from "@/types/ai";
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
      buildingMemory: true,
      documents: { orderBy: { createdAt: "desc" } },
      diagnosis: { orderBy: { updatedAt: "desc" } },
      strategies: { orderBy: { updatedAt: "desc" } },
      issues: { orderBy: { updatedAt: "desc" } },
      reports: { orderBy: { createdAt: "desc" } },
      insights: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      evidence: { orderBy: { createdAt: "desc" } },
      analysisRuns: { orderBy: { createdAt: "desc" }, take: 20 },
      buildingMemoryHistory: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  return row ? mapProjectWithRelationsExtended(row) : null;
}

export async function getProjectOverview(
  id: string,
  organizationId: string
): Promise<ProjectWithRelations | null> {
  const row = await prisma.project.findFirst({
    where: { id, organizationId },
    include: {
      building: true,
      buildingMemory: true,
      insights: { orderBy: { createdAt: "desc" }, take: 24 },
      tasks: { orderBy: { createdAt: "desc" }, take: 12 },
      issues: { orderBy: { updatedAt: "desc" }, take: 8 },
      analysisRuns: { orderBy: { createdAt: "desc" }, take: 4 },
    },
  });
  return row ? mapProjectOverview(row) : null;
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

export async function createProjectFromBrief(
  draft: AIProjectDraft,
  organizationId: string
): Promise<ProjectWithRelations> {
  const input = draft.project;

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
      status: "survey",
      renovationGoal: input.renovationGoal,
      budgetLevel: input.budgetLevel,
      riskLevel: draft.riskLevel,
      healthScore: draft.healthScore,
      potentialScore: draft.potentialScore,
      aiReadinessScore: draft.aiReadinessScore,
      dataCompletenessScore: draft.dataCompletenessScore,
      description: input.description,
      building: {
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
      },
      buildingMemory: {
        create: {
          summary: draft.buildingMemory.summary,
          knownFacts: draft.buildingMemory.knownFacts,
          missingInformation: draft.buildingMemory.missingInformation,
          keyRisks: draft.buildingMemory.keyRisks,
          renovationPotential: draft.buildingMemory.renovationPotential,
          designConstraints: draft.buildingMemory.designConstraints,
          ownerRequirements: draft.buildingMemory.ownerRequirements,
          importantDecisions: draft.buildingMemory.importantDecisions,
          unresolvedQuestions: draft.buildingMemory.unresolvedQuestions,
        },
      },
      tasks: {
        create: draft.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          status: task.status,
          assignedToId: task.assignedToId,
          dueDate: task.dueDate,
          insightId: task.insightId,
        })),
      },
      insights: {
        create: draft.insights.map((insight) => ({
          title: insight.title,
          type: insight.type,
          priority: insight.priority,
          summary: insight.summary,
          evidence: insight.evidence,
          recommendation: insight.recommendation,
          confidence: insight.confidence,
          status: insight.status,
          sourceType: insight.sourceType,
          sourceId: insight.sourceId,
        })),
      },
      analysisRuns: {
        create: {
          analysisType: "copilot_chat",
          inputSummary: input.renovationGoal.slice(0, 120),
          outputSummary: draft.analysisSummary,
          generatedItemCount: draft.tasks.length + draft.insights.length + 1,
          modelName: "recrete-create-v1",
          confidence: 0.91,
        },
      },
    },
    include: {
      building: true,
      buildingMemory: true,
      documents: true,
      diagnosis: true,
      strategies: true,
      issues: true,
      reports: true,
      insights: true,
      tasks: true,
    },
  });

  return mapProjectWithRelationsExtended(project);
}

export async function replaceStrategies(
  projectId: string,
  strategies: Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">[]
): Promise<RenovationStrategy[]> {
  await prisma.renovationStrategy.deleteMany({ where: { projectId } });

  const created = await Promise.all(
    strategies.map((s) =>
      prisma.renovationStrategy.create({
        data: { ...s, projectId },
      })
    )
  );

  return created.map(mapStrategy);
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
  data: Partial<Pick<DocumentAsset, "aiSummary" | "extractedText" | "description" | "category">>
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

export async function deleteDocument(documentId: string): Promise<boolean> {
  try {
    await prisma.documentAsset.delete({ where: { id: documentId } });
    return true;
  } catch {
    return false;
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

export async function updateBuildingMemory(
  projectId: string,
  organizationId: string,
  triggerType = "manual"
) {
  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const { updateBuildingMemory: computeBuildingMemory } = await import(
    "@/lib/ai/agents/building-memory-agent"
  );
  const updated = await computeBuildingMemory(project);
  const now = new Date();

  const existing = await prisma.buildingMemory.findUnique({ where: { projectId } });
  if (existing) {
    await prisma.buildingMemoryHistory.create({
      data: {
        projectId,
        summary: existing.summary,
        knownFactsCount: existing.knownFacts.length,
        missingInfoCount: existing.missingInformation.length,
        keyRisksCount: existing.keyRisks.length,
        triggerType,
      },
    });
  }

  const memory = await prisma.buildingMemory.upsert({
    where: { projectId },
    create: {
      projectId,
      summary: updated.summary,
      knownFacts: updated.knownFacts,
      missingInformation: updated.missingInformation,
      keyRisks: updated.keyRisks,
      renovationPotential: updated.renovationPotential,
      designConstraints: updated.designConstraints,
      ownerRequirements: updated.ownerRequirements,
      importantDecisions: updated.importantDecisions,
      unresolvedQuestions: updated.unresolvedQuestions,
      lastUpdatedByAI: now,
    },
    update: {
      summary: updated.summary,
      knownFacts: updated.knownFacts,
      missingInformation: updated.missingInformation,
      keyRisks: updated.keyRisks,
      renovationPotential: updated.renovationPotential,
      designConstraints: updated.designConstraints,
      ownerRequirements: updated.ownerRequirements,
      importantDecisions: updated.importantDecisions,
      unresolvedQuestions: updated.unresolvedQuestions,
      lastUpdatedByAI: now,
    },
  });

  await prisma.aIAnalysisRun.create({
    data: {
      projectId,
      analysisType: "building_memory_update",
      inputSummary: `Project ${project.name} — ${project.documents?.length ?? 0} docs, ${project.diagnosis?.length ?? 0} diagnosis items`,
      outputSummary: "Building Memory updated with latest AI analysis",
      generatedItemCount: 1,
      modelName: "recrete-mock-v1",
      confidence: 0.89,
    },
  });

  return {
    id: memory.id,
    projectId: memory.projectId,
    summary: memory.summary,
    knownFacts: memory.knownFacts,
    missingInformation: memory.missingInformation,
    keyRisks: memory.keyRisks,
    renovationPotential: memory.renovationPotential,
    designConstraints: memory.designConstraints,
    ownerRequirements: memory.ownerRequirements,
    importantDecisions: memory.importantDecisions,
    unresolvedQuestions: memory.unresolvedQuestions,
    lastUpdatedByAI: memory.lastUpdatedByAI,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

export async function addInsights(
  projectId: string,
  insights: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[]
): Promise<AIInsight[]> {
  const created = await Promise.all(
    insights.map((insight) =>
      prisma.aIInsight.create({
        data: { ...insight, projectId },
      })
    )
  );
  return created.map((i) => ({
    id: i.id,
    projectId: i.projectId,
    title: i.title,
    type: i.type,
    priority: i.priority,
    summary: i.summary,
    evidence: i.evidence,
    recommendation: i.recommendation,
    confidence: i.confidence,
    status: i.status,
    sourceType: i.sourceType,
    sourceId: i.sourceId,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  }));
}

export async function addTasks(
  projectId: string,
  tasks: Omit<AITask, "id" | "projectId" | "createdAt" | "updatedAt">[]
): Promise<AITask[]> {
  const created = await Promise.all(
    tasks.map((task) =>
      prisma.aITask.create({
        data: { ...task, projectId },
      })
    )
  );
  return created.map((t) => ({
    id: t.id,
    projectId: t.projectId,
    insightId: t.insightId,
    title: t.title,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    assignedToId: t.assignedToId,
    dueDate: t.dueDate,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
}

export async function replaceInsightsBySourceType(
  projectId: string,
  sourceType: string,
  insights: Parameters<typeof import("@/lib/db/mock-repository").replaceInsightsBySourceType>[2]
) {
  await prisma.aIInsight.deleteMany({ where: { projectId, sourceType } });
  return addInsights(
    projectId,
    insights.map((insight) => ({ ...insight, sourceType }))
  );
}

export async function updateStrategy(
  strategyId: string,
  data: Partial<Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">>
): Promise<RenovationStrategy | null> {
  try {
    const updated = await prisma.renovationStrategy.update({
      where: { id: strategyId },
      data,
    });
    return mapStrategy(updated);
  } catch {
    return null;
  }
}

export async function addStrategyVersion(
  projectId: string,
  strategy: Parameters<typeof import("@/lib/db/mock-repository").addStrategyVersion>[1],
  meta?: Parameters<typeof import("@/lib/db/mock-repository").addStrategyVersion>[2]
) {
  const latest = await prisma.strategyVersion.findFirst({
    where: { strategyId: strategy.id },
    orderBy: { versionNumber: "desc" },
  });
  const versionNumber = (latest?.versionNumber ?? 0) + 1;

  const created = await prisma.strategyVersion.create({
    data: {
      projectId,
      strategyId: strategy.id,
      versionNumber,
      label: meta?.label ?? `v${versionNumber}`,
      snapshot: strategy as object,
      instruction: meta?.instruction ?? null,
      changeSummary: meta?.changeSummary ?? null,
    },
  });

  return {
    id: created.id,
    projectId: created.projectId,
    strategyId: created.strategyId,
    versionNumber: created.versionNumber,
    label: created.label,
    snapshot: strategy,
    instruction: created.instruction,
    changeSummary: created.changeSummary,
    createdAt: created.createdAt,
  };
}

export async function getStrategyVersions(strategyId: string) {
  const rows = await prisma.strategyVersion.findMany({
    where: { strategyId },
    orderBy: { versionNumber: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    strategyId: row.strategyId,
    versionNumber: row.versionNumber,
    label: row.label,
    snapshot: row.snapshot as unknown as RenovationStrategy,
    instruction: row.instruction,
    changeSummary: row.changeSummary,
    createdAt: row.createdAt,
  }));
}

export async function getStrategyVersionById(versionId: string) {
  const row = await prisma.strategyVersion.findUnique({ where: { id: versionId } });
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.projectId,
    strategyId: row.strategyId,
    versionNumber: row.versionNumber,
    label: row.label,
    snapshot: row.snapshot as unknown as RenovationStrategy,
    instruction: row.instruction,
    changeSummary: row.changeSummary,
    createdAt: row.createdAt,
  };
}

export async function getBuildingMemoryHistory(projectId: string, limit = 10) {
  const rows = await prisma.buildingMemoryHistory.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    summary: row.summary,
    knownFactsCount: row.knownFactsCount,
    missingInfoCount: row.missingInfoCount,
    keyRisksCount: row.keyRisksCount,
    triggerType: row.triggerType,
    createdAt: row.createdAt,
  }));
}

export async function getStrategiesWithMetrics(projectId: string): Promise<StrategyWithMetrics[]> {
  const [projectRow, strategyRows] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      include: { building: true },
    }),
    prisma.renovationStrategy.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const mappedStrategies = strategyRows.map(mapStrategy);
  const withMetrics = mappedStrategies.map((strategy) => ({
    ...strategy,
    metrics:
      strategyMetrics[strategy.id] ??
      computeStrategyMetrics(strategy, null, mappedStrategies),
  }));

  if (!projectRow) return withMetrics;

  const rankingProject = {
    ...mapProject(projectRow),
    building: projectRow.building ? mapBuilding(projectRow.building) : null,
  } as ProjectWithRelations;

  return attachStrategyRankings(withMetrics, rankingProject);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? mapUser(user) : undefined;
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
