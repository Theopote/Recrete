import type { ProjectStatus } from "@/types";

/** Statuses that allow permanent deletion (must archive first unless already completed). */
export const PROJECT_DELETABLE_STATUSES: ProjectStatus[] = ["archived", "completed"];

export function canPermanentlyDeleteProject(status: ProjectStatus): boolean {
  return PROJECT_DELETABLE_STATUSES.includes(status);
}

export function permanentDeleteBlockReason(status: ProjectStatus): string | undefined {
  if (canPermanentlyDeleteProject(status)) return undefined;
  if (status === "archived") return undefined;
  return "项目须先归档或标记为竣工后，才能永久删除";
}
