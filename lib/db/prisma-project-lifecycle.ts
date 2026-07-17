import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
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

function mapAudit(row: {
  id: string;
  organizationId: string;
  projectId: string | null;
  projectCode: string;
  projectName: string;
  action: "archived" | "deleted";
  previousStatus: string | null;
  reason: string | null;
  performedById: string;
  performedByName: string;
  deletionSummary: Prisma.JsonValue;
  createdAt: Date;
}): ProjectLifecycleAuditEntry {
  return {
    id: row.id,
    organizationId: row.organizationId,
    projectId: row.projectId,
    projectCode: row.projectCode,
    projectName: row.projectName,
    action: row.action,
    previousStatus: row.previousStatus,
    reason: row.reason,
    performedById: row.performedById,
    performedByName: row.performedByName,
    deletionSummary: row.deletionSummary as ProjectDeletionSummary | null,
    createdAt: row.createdAt,
  };
}

export async function getDbProjectDeletionSummary(
  projectId: string,
  organizationId: string
): Promise<ProjectDeletionSummary | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    include: {
      _count: {
        select: {
          documents: true,
          diagnosis: true,
          strategies: true,
          reports: true,
          issues: true,
          bimModels: true,
        },
      },
    },
  });

  if (!project) return null;

  const status = project.status as ProjectStatus;
  const canPermanentDelete = canPermanentlyDeleteProject(status);

  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    status,
    documentCount: project._count.documents,
    diagnosisCount: project._count.diagnosis,
    strategyCount: project._count.strategies,
    reportCount: project._count.reports,
    issueCount: project._count.issues,
    bimModelCount: project._count.bimModels,
    canPermanentDelete,
    deleteBlockReason: canPermanentDelete ? undefined : permanentDeleteBlockReason(status),
  };
}

async function createDbLifecycleAudit(input: {
  organizationId: string;
  projectId: string | null;
  projectCode: string;
  projectName: string;
  action: "archived" | "deleted";
  previousStatus?: string | null;
  reason?: string | null;
  performedById: string;
  performedByName: string;
  deletionSummary?: ProjectDeletionSummary | null;
}) {
  const row = await prisma.projectLifecycleAudit.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      projectCode: input.projectCode,
      projectName: input.projectName,
      action: input.action,
      previousStatus: input.previousStatus ?? null,
      reason: input.reason ?? null,
      performedById: input.performedById,
      performedByName: input.performedByName,
      deletionSummary: input.deletionSummary
        ? (input.deletionSummary as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });
  return mapAudit(row);
}

export async function archiveDbProject(
  input: ArchiveProjectInput
): Promise<{ projectId: string; status: ProjectStatus; audit: ProjectLifecycleAuditEntry } | null> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.organizationId },
  });
  if (!project) return null;
  if (project.status === "archived") {
    throw new Error("Project is already archived");
  }

  const previousStatus = project.status;
  await prisma.project.update({
    where: { id: project.id },
    data: { status: "archived" },
  });

  const audit = await createDbLifecycleAudit({
    organizationId: input.organizationId,
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    action: "archived",
    previousStatus,
    reason: input.reason ?? null,
    performedById: input.performedById,
    performedByName: input.performedByName,
  });

  return { projectId: project.id, status: "archived", audit };
}

export async function deleteDbProjectPermanently(
  input: DeleteProjectInput
): Promise<ProjectLifecycleAuditEntry | null> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.organizationId },
    include: {
      _count: {
        select: {
          documents: true,
          diagnosis: true,
          strategies: true,
          reports: true,
          issues: true,
          bimModels: true,
        },
      },
    },
  });

  if (!project) return null;

  const status = project.status as ProjectStatus;
  if (!canPermanentlyDeleteProject(status)) {
    throw new Error(permanentDeleteBlockReason(status) ?? "Project cannot be deleted in current status");
  }

  if (input.confirmCode.trim() !== project.code) {
    throw new Error("Project code confirmation does not match");
  }

  const summary: ProjectDeletionSummary = {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    status,
    documentCount: project._count.documents,
    diagnosisCount: project._count.diagnosis,
    strategyCount: project._count.strategies,
    reportCount: project._count.reports,
    issueCount: project._count.issues,
    bimModelCount: project._count.bimModels,
    canPermanentDelete: true,
  };

  const audit = await createDbLifecycleAudit({
    organizationId: input.organizationId,
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    action: "deleted",
    previousStatus: project.status,
    performedById: input.performedById,
    performedByName: input.performedByName,
    deletionSummary: summary,
  });

  await prisma.project.delete({ where: { id: project.id } });

  return { ...audit, projectId: null };
}

export async function listDbProjectLifecycleAudits(
  organizationId: string,
  limit = 20
): Promise<ProjectLifecycleAuditEntry[]> {
  const rows = await prisma.projectLifecycleAudit.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapAudit);
}
