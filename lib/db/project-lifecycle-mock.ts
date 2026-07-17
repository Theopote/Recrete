import type { ProjectStatus } from "@/types";
import type {
  ArchiveProjectInput,
  DeleteProjectInput,
  ProjectDeletionSummary,
  ProjectLifecycleAuditEntry,
} from "@/types/project-lifecycle";
import {
  canPermanentlyDeleteProject,
  permanentDeleteBlockReason,
} from "@/lib/projects/lifecycle-policy";
import {
  countMockProjectRelations,
  getMockProjectRow,
  removeMockProjectCascade,
} from "@/lib/db/mock-repository";
import { generateId } from "@/lib/mock-data";

const memoryAudits: ProjectLifecycleAuditEntry[] = [];

export function resetProjectLifecycleMockStore() {
  memoryAudits.length = 0;
}

function pushAudit(entry: Omit<ProjectLifecycleAuditEntry, "id" | "createdAt">) {
  const audit: ProjectLifecycleAuditEntry = {
    ...entry,
    id: generateId("lifecycle"),
    createdAt: new Date(),
  };
  memoryAudits.unshift(audit);
  return audit;
}

export async function getMockProjectDeletionSummary(
  projectId: string,
  organizationId: string
): Promise<ProjectDeletionSummary | null> {
  const project = getMockProjectRow(projectId, organizationId);
  if (!project) return null;

  const counts = countMockProjectRelations(projectId);
  const status = project.status as ProjectStatus;
  const canPermanentDelete = canPermanentlyDeleteProject(status);

  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    status,
    ...counts,
    canPermanentDelete,
    deleteBlockReason: canPermanentDelete ? undefined : permanentDeleteBlockReason(status),
  };
}

export async function archiveMockProject(
  input: ArchiveProjectInput
): Promise<{ projectId: string; status: ProjectStatus; audit: ProjectLifecycleAuditEntry } | null> {
  const project = getMockProjectRow(input.projectId, input.organizationId);
  if (!project) return null;
  if (project.status === "archived") {
    throw new Error("Project is already archived");
  }

  const previousStatus = project.status;
  project.status = "archived";
  project.updatedAt = new Date();

  const audit = pushAudit({
    organizationId: input.organizationId,
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    action: "archived",
    previousStatus,
    reason: input.reason ?? null,
    performedById: input.performedById,
    performedByName: input.performedByName,
    deletionSummary: null,
  });

  return { projectId: project.id, status: "archived", audit };
}

export async function deleteMockProjectPermanently(
  input: DeleteProjectInput
): Promise<ProjectLifecycleAuditEntry | null> {
  const project = getMockProjectRow(input.projectId, input.organizationId);
  if (!project) return null;

  const status = project.status as ProjectStatus;
  if (!canPermanentlyDeleteProject(status)) {
    throw new Error(permanentDeleteBlockReason(status) ?? "Project cannot be deleted in current status");
  }

  if (input.confirmCode.trim() !== project.code) {
    throw new Error("Project code confirmation does not match");
  }

  const summary = await getMockProjectDeletionSummary(input.projectId, input.organizationId);
  if (!summary) return null;

  const audit = pushAudit({
    organizationId: input.organizationId,
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    action: "deleted",
    previousStatus: project.status,
    reason: null,
    performedById: input.performedById,
    performedByName: input.performedByName,
    deletionSummary: summary,
  });

  removeMockProjectCascade(project.id);

  return { ...audit, projectId: null };
}

export async function listMockProjectLifecycleAudits(
  organizationId: string,
  limit = 20
): Promise<ProjectLifecycleAuditEntry[]> {
  return memoryAudits.filter((a) => a.organizationId === organizationId).slice(0, limit);
}
