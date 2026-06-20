import { shouldUseDatabase } from "@/lib/db/resolve";
import * as mock from "@/lib/db/mock-repository";
import * as db from "@/lib/db/prisma-repository";

async function useDb() {
  return shouldUseDatabase();
}

export async function getProjects(
  filters?: Parameters<typeof mock.getProjects>[0]
) {
  return (await useDb()) ? db.getProjects(filters) : mock.getProjects(filters);
}

export async function getProjectById(id: string) {
  return (await useDb()) ? db.getProjectById(id) : mock.getProjectById(id);
}

export async function createProject(input: Parameters<typeof mock.createProject>[0]) {
  return (await useDb()) ? db.createProject(input) : mock.createProject(input);
}

export async function addDiagnosisItems(
  projectId: string,
  items: Parameters<typeof mock.addDiagnosisItems>[1]
) {
  return (await useDb()) ? db.addDiagnosisItems(projectId, items) : mock.addDiagnosisItems(projectId, items);
}

export async function addStrategies(
  projectId: string,
  strategies: Parameters<typeof mock.addStrategies>[1]
) {
  return (await useDb()) ? db.addStrategies(projectId, strategies) : mock.addStrategies(projectId, strategies);
}

export async function addDocument(
  projectId: string,
  doc: Parameters<typeof mock.addDocument>[1]
) {
  return (await useDb()) ? db.addDocument(projectId, doc) : mock.addDocument(projectId, doc);
}

export async function updateIssueStatus(
  issueId: string,
  status: Parameters<typeof mock.updateIssueStatus>[1]
) {
  return (await useDb()) ? db.updateIssueStatus(issueId, status) : mock.updateIssueStatus(issueId, status);
}

export async function addReport(
  projectId: string,
  report: Parameters<typeof mock.addReport>[1]
) {
  return (await useDb()) ? db.addReport(projectId, report) : mock.addReport(projectId, report);
}

export async function addIssue(
  projectId: string,
  issue: Parameters<typeof mock.addIssue>[1]
) {
  return (await useDb()) ? db.addIssue(projectId, issue) : mock.addIssue(projectId, issue);
}

export async function getAllDiagnosis(filters?: Parameters<typeof mock.getAllDiagnosis>[0]) {
  return (await useDb()) ? db.getAllDiagnosis(filters) : mock.getAllDiagnosis(filters);
}

export async function getAllIssues(filters?: Parameters<typeof mock.getAllIssues>[0]) {
  return (await useDb()) ? db.getAllIssues(filters) : mock.getAllIssues(filters);
}

export async function getAllReports() {
  return (await useDb()) ? db.getAllReports() : mock.getAllReports();
}

export async function getAllStrategies() {
  return (await useDb()) ? db.getAllStrategies() : mock.getAllStrategies();
}

export async function getAllDocuments(filters?: Parameters<typeof mock.getAllDocuments>[0]) {
  return (await useDb()) ? db.getAllDocuments(filters) : mock.getAllDocuments(filters);
}

export async function getKnowledgeArticles() {
  return (await useDb()) ? db.getKnowledgeArticles() : mock.getKnowledgeArticles();
}

export async function getKnowledgeArticle(id: string) {
  return (await useDb()) ? db.getKnowledgeArticle(id) : mock.getKnowledgeArticle(id);
}

export async function search(query: string) {
  return (await useDb()) ? db.search(query) : mock.search(query);
}

export async function getDashboardData() {
  return (await useDb()) ? db.getDashboardData() : mock.getDashboardData();
}

export async function getStrategiesWithMetrics(projectId: string) {
  return (await useDb()) ? db.getStrategiesWithMetrics(projectId) : mock.getStrategiesWithMetrics(projectId);
}

export async function getUserById(id: string) {
  return (await useDb()) ? db.getUserById(id) : mock.getUserById(id);
}

export { resetStore } from "@/lib/db/mock-repository";
export { mockProjects } from "@/lib/mock-data";
export type { DashboardStats } from "@/types";
