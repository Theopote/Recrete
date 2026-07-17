import { shouldUseDatabase } from "@/lib/db/resolve";
import type {
  ArchiveProjectInput,
  DeleteProjectInput,
  ProjectDeletionSummary,
  ProjectLifecycleAuditEntry,
} from "@/types/project-lifecycle";
import * as db from "@/lib/db/prisma-project-lifecycle";
import * as mock from "@/lib/db/project-lifecycle-mock";

export {
  canPermanentlyDeleteProject,
  permanentDeleteBlockReason,
  PROJECT_DELETABLE_STATUSES,
} from "@/lib/projects/lifecycle-policy";

export { resetProjectLifecycleMockStore } from "@/lib/db/project-lifecycle-mock";

export async function getProjectDeletionSummary(
  projectId: string,
  organizationId: string
): Promise<ProjectDeletionSummary | null> {
  if (await shouldUseDatabase()) {
    return db.getDbProjectDeletionSummary(projectId, organizationId);
  }
  return mock.getMockProjectDeletionSummary(projectId, organizationId);
}

export async function archiveProject(
  input: ArchiveProjectInput
): Promise<{ projectId: string; status: "archived"; audit: ProjectLifecycleAuditEntry } | null> {
  if (await shouldUseDatabase()) {
    return db.archiveDbProject(input);
  }
  return mock.archiveMockProject(input);
}

export async function deleteProjectPermanently(
  input: DeleteProjectInput
): Promise<ProjectLifecycleAuditEntry | null> {
  if (await shouldUseDatabase()) {
    return db.deleteDbProjectPermanently(input);
  }
  return mock.deleteMockProjectPermanently(input);
}

export async function listProjectLifecycleAudits(
  organizationId: string,
  limit = 20
): Promise<ProjectLifecycleAuditEntry[]> {
  if (await shouldUseDatabase()) {
    return db.listDbProjectLifecycleAudits(organizationId, limit);
  }
  return mock.listMockProjectLifecycleAudits(organizationId, limit);
}
