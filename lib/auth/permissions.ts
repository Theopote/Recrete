import type { UserRole } from "@/types";

export type ProjectAction =
  | "view"
  | "edit_profile"
  | "upload_documents"
  | "run_ai_analysis"
  | "create_strategy"
  | "approve_strategy"
  | "manage_issues"
  | "publish_report"
  | "manage_collaboration"
  | "manage_members"
  | "archive_project"
  | "delete_project";

const ROLE_PERMISSIONS: Record<UserRole, ProjectAction[]> = {
  admin: [
    "view",
    "edit_profile",
    "upload_documents",
    "run_ai_analysis",
    "create_strategy",
    "approve_strategy",
    "manage_issues",
    "publish_report",
    "manage_collaboration",
    "manage_members",
    "archive_project",
    "delete_project",
  ],
  architect: [
    "view",
    "edit_profile",
    "upload_documents",
    "run_ai_analysis",
    "create_strategy",
    "manage_issues",
    "publish_report",
    "manage_collaboration",
    "archive_project",
  ],
  engineer: [
    "view",
    "upload_documents",
    "run_ai_analysis",
    "manage_issues",
    "manage_collaboration",
  ],
  consultant: [
    "view",
    "upload_documents",
    "run_ai_analysis",
    "manage_collaboration",
  ],
  project_manager: [
    "view",
    "edit_profile",
    "upload_documents",
    "run_ai_analysis",
    "create_strategy",
    "approve_strategy",
    "manage_issues",
    "publish_report",
    "manage_collaboration",
    "manage_members",
    "archive_project",
    "delete_project",
  ],
  owner: ["view", "approve_strategy", "manage_collaboration"],
  viewer: ["view"],
};

export function canPerformAction(role: UserRole, action: ProjectAction): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export function getRolePermissions(role: UserRole): ProjectAction[] {
  return ROLE_PERMISSIONS[role] ?? ["view"];
}

export function canApproveReview(role: UserRole, party?: string): boolean {
  if (role === "admin" || role === "project_manager") return true;
  if (role === "owner" && party === "owner") return true;
  if (role === "architect" && party === "design_team") return true;
  if (role === "engineer" && party === "structure_consultant") return true;
  if (role === "consultant") return true;
  return false;
}
