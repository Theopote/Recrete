import type { ProjectStatus } from "@/types";

export type ProjectLifecycleAction = "archived" | "deleted";

export interface ProjectDeletionSummary {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: ProjectStatus;
  documentCount: number;
  diagnosisCount: number;
  strategyCount: number;
  reportCount: number;
  issueCount: number;
  bimModelCount: number;
  canPermanentDelete: boolean;
  deleteBlockReason?: string;
}

export interface ProjectLifecycleAuditEntry {
  id: string;
  organizationId: string;
  projectId: string | null;
  projectCode: string;
  projectName: string;
  action: ProjectLifecycleAction;
  previousStatus: string | null;
  reason: string | null;
  performedById: string;
  performedByName: string;
  deletionSummary: ProjectDeletionSummary | null;
  createdAt: Date;
}

export interface ArchiveProjectInput {
  projectId: string;
  organizationId: string;
  performedById: string;
  performedByName: string;
  reason?: string;
}

export interface DeleteProjectInput {
  projectId: string;
  organizationId: string;
  performedById: string;
  performedByName: string;
  confirmCode: string;
}
