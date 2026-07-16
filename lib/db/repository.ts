import { shouldUseDatabase } from "@/lib/db/resolve";
import * as mock from "@/lib/db/mock-repository";
import * as db from "@/lib/db/prisma-repository";

async function resolveDb() {
  return shouldUseDatabase();
}

export async function getProjects(
  organizationId: string,
  filters?: Parameters<typeof mock.getProjects>[1]
) {
  return (await resolveDb()) ? db.getProjects(organizationId, filters) : mock.getProjects(organizationId, filters);
}

export async function getProjectById(id: string, organizationId: string) {
  return (await resolveDb()) ? db.getProjectById(id, organizationId) : mock.getProjectById(id, organizationId);
}

export async function createProject(
  input: Parameters<typeof mock.createProject>[0],
  organizationId: string
) {
  return (await resolveDb()) ? db.createProject(input, organizationId) : mock.createProject(input, organizationId);
}

export async function createProjectFromBrief(
  draft: Parameters<typeof mock.createProjectFromBrief>[0],
  organizationId: string
) {
  if (await resolveDb()) {
    return db.createProjectFromBrief(draft, organizationId);
  }
  return mock.createProjectFromBrief(draft, organizationId);
}

export async function addDiagnosisItems(
  projectId: string,
  items: Parameters<typeof mock.addDiagnosisItems>[1]
) {
  return (await resolveDb()) ? db.addDiagnosisItems(projectId, items) : mock.addDiagnosisItems(projectId, items);
}

export async function addInsights(
  projectId: string,
  insights: Parameters<typeof mock.addInsights>[1]
) {
  return (await resolveDb()) ? db.addInsights(projectId, insights) : mock.addInsights(projectId, insights);
}

export async function replaceInsightsBySourceType(
  projectId: string,
  sourceType: string,
  insights: Parameters<typeof mock.replaceInsightsBySourceType>[2]
) {
  return (await resolveDb())
    ? db.replaceInsightsBySourceType(projectId, sourceType, insights)
    : mock.replaceInsightsBySourceType(projectId, sourceType, insights);
}

export async function addTasks(
  projectId: string,
  tasks: Parameters<typeof mock.addTasks>[1]
) {
  return (await resolveDb()) ? db.addTasks(projectId, tasks) : mock.addTasks(projectId, tasks);
}

export async function updateDiagnosisItem(
  itemId: string,
  data: Parameters<typeof mock.updateDiagnosisItem>[1]
) {
  return (await resolveDb()) ? db.updateDiagnosisItem(itemId, data) : mock.updateDiagnosisItem(itemId, data);
}

export async function addStrategies(
  projectId: string,
  strategies: Parameters<typeof mock.addStrategies>[1]
) {
  return (await resolveDb()) ? db.addStrategies(projectId, strategies) : mock.addStrategies(projectId, strategies);
}

export async function replaceStrategies(
  projectId: string,
  strategies: Parameters<typeof mock.replaceStrategies>[1]
) {
  return (await resolveDb())
    ? db.replaceStrategies(projectId, strategies)
    : mock.replaceStrategies(projectId, strategies);
}

export async function updateStrategy(
  strategyId: string,
  data: Parameters<typeof mock.updateStrategy>[1]
) {
  return (await resolveDb()) ? db.updateStrategy(strategyId, data) : mock.updateStrategy(strategyId, data);
}

export async function addStrategyVersion(
  projectId: string,
  strategy: Parameters<typeof mock.addStrategyVersion>[1],
  meta?: Parameters<typeof mock.addStrategyVersion>[2]
) {
  return (await resolveDb()) ? db.addStrategyVersion(projectId, strategy, meta) : mock.addStrategyVersion(projectId, strategy, meta);
}

export async function getStrategyVersions(strategyId: string) {
  return (await resolveDb()) ? db.getStrategyVersions(strategyId) : mock.getStrategyVersions(strategyId);
}

export async function getStrategyVersionById(versionId: string) {
  return (await resolveDb()) ? db.getStrategyVersionById(versionId) : mock.getStrategyVersionById(versionId);
}

export async function addDocument(
  projectId: string,
  doc: Parameters<typeof mock.addDocument>[1]
) {
  return (await resolveDb()) ? db.addDocument(projectId, doc) : mock.addDocument(projectId, doc);
}

export async function getDocumentById(documentId: string) {
  return (await resolveDb()) ? db.getDocumentById(documentId) : mock.getDocumentById(documentId);
}

export async function updateDocument(
  documentId: string,
  data: Parameters<typeof mock.updateDocument>[1]
) {
  return (await resolveDb()) ? db.updateDocument(documentId, data) : mock.updateDocument(documentId, data);
}

export async function deleteDocument(documentId: string) {
  return (await resolveDb()) ? db.deleteDocument(documentId) : mock.deleteDocument(documentId);
}

export async function addSourceEvidence(
  evidence: Parameters<typeof mock.addSourceEvidence>[0]
) {
  return (await resolveDb()) ? db.addSourceEvidence(evidence) : mock.addSourceEvidence(evidence);
}

export async function addAnalysisRun(run: Parameters<typeof mock.addAnalysisRun>[0]) {
  return (await resolveDb()) ? db.addAnalysisRun(run) : mock.addAnalysisRun(run);
}

export async function getProjectEvidence(projectId: string) {
  return (await resolveDb()) ? db.getProjectEvidence(projectId) : mock.getProjectEvidence(projectId);
}

export async function updateIssueStatus(
  issueId: string,
  status: Parameters<typeof mock.updateIssueStatus>[1]
) {
  return (await resolveDb()) ? db.updateIssueStatus(issueId, status) : mock.updateIssueStatus(issueId, status);
}

export async function addReport(
  projectId: string,
  report: Parameters<typeof mock.addReport>[1]
) {
  return (await resolveDb()) ? db.addReport(projectId, report) : mock.addReport(projectId, report);
}

export async function updateReport(
  reportId: string,
  data: Parameters<typeof mock.updateReport>[1]
) {
  return (await resolveDb()) ? db.updateReport(reportId, data) : mock.updateReport(reportId, data);
}

export async function addIssue(
  projectId: string,
  issue: Parameters<typeof mock.addIssue>[1]
) {
  return (await resolveDb()) ? db.addIssue(projectId, issue) : mock.addIssue(projectId, issue);
}

export async function getAllDiagnosis(filters?: Parameters<typeof mock.getAllDiagnosis>[0]) {
  return (await resolveDb()) ? db.getAllDiagnosis(filters) : mock.getAllDiagnosis(filters);
}

export async function getAllIssues(filters?: Parameters<typeof mock.getAllIssues>[0]) {
  return (await resolveDb()) ? db.getAllIssues(filters) : mock.getAllIssues(filters);
}

export async function getAllReports() {
  return (await resolveDb()) ? db.getAllReports() : mock.getAllReports();
}

export async function getAllStrategies() {
  return (await resolveDb()) ? db.getAllStrategies() : mock.getAllStrategies();
}

export async function getAllDocuments(filters?: Parameters<typeof mock.getAllDocuments>[0]) {
  return (await resolveDb()) ? db.getAllDocuments(filters) : mock.getAllDocuments(filters);
}

export async function getKnowledgeArticles() {
  return (await resolveDb()) ? db.getKnowledgeArticles() : mock.getKnowledgeArticles();
}

export async function getKnowledgeArticle(id: string) {
  return (await resolveDb()) ? db.getKnowledgeArticle(id) : mock.getKnowledgeArticle(id);
}

export async function search(query: string) {
  return (await resolveDb()) ? db.search(query) : mock.search(query);
}

export async function getDashboardData(organizationId: string) {
  return (await resolveDb()) ? db.getDashboardData(organizationId) : mock.getDashboardData(organizationId);
}

export async function getStrategiesWithMetrics(projectId: string) {
  return (await resolveDb()) ? db.getStrategiesWithMetrics(projectId) : mock.getStrategiesWithMetrics(projectId);
}

export async function getUserById(id: string) {
  return (await resolveDb()) ? db.getUserById(id) : mock.getUserById(id);
}

export async function getCommandCenterData(organizationId: string) {
  return (await resolveDb()) ? db.getCommandCenterData(organizationId) : mock.getCommandCenterData(organizationId);
}

export async function updateBuildingMemory(
  projectId: string,
  organizationId: string,
  triggerType?: string
) {
  return (await resolveDb())
    ? db.updateBuildingMemory(projectId, organizationId, triggerType)
    : mock.updateBuildingMemory(projectId, organizationId, triggerType);
}

export async function getBuildingMemoryHistory(projectId: string, limit = 10) {
  return (await resolveDb())
    ? db.getBuildingMemoryHistory(projectId, limit)
    : mock.getBuildingMemoryHistory(projectId, limit);
}

export { updateProjectStatus } from "@/lib/db/project-costs";
export {
  listProjectCostRecords,
  listAllProjectCostRecordsWithProject,
  createProjectCostRecord,
  updateProjectCostRecord,
  deleteProjectCostRecord,
} from "@/lib/db/project-costs";

export { resetStore } from "@/lib/db/mock-repository";
export { mockProjects } from "@/lib/mock-data";
export type { DashboardStats } from "@/types";

export {
  saveComplianceRun,
  getComplianceRun,
  listComplianceRuns,
  applyComplianceDiagnosis,
  persistComplianceResult,
  resetComplianceStore,
} from "@/lib/db/compliance-store";
export {
  persistMepClashIssues,
  isDuplicateMepClashIssue,
  mepClashIssueKey,
  formatClashSummary,
} from "@/lib/db/mep-clash-store";
export {
  getProjectSiteMeasurements,
  getProjectSiteMeasurementsWithFallback,
  updateProjectSiteMeasurements,
  resolveProjectMeasurements,
  resetSiteMeasurementsStore,
} from "@/lib/db/site-measurements-store";
