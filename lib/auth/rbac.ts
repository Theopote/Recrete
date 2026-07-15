import type { ProjectSection } from "@/types";
import type { UserRole } from "@/types";
import {
  canPerformAction,
  type ProjectAction,
} from "@/lib/auth/permissions";

/** App-level routes mapped to minimum required action */
export const APP_ROUTE_ACTIONS: Record<string, ProjectAction> = {
  "/dashboard": "view",
  "/projects": "view",
  "/projects/new": "edit_profile",
  "/survey": "view",
  "/diagnosis": "view",
  "/strategies": "view",
  "/issues": "view",
  "/reports": "view",
  "/knowledge": "view",
  "/knowledge/material-prices": "manage_members",
  "/knowledge/cost-records": "publish_report",
  "/settings": "view",
};

/** Project workspace sections mapped to minimum required action */
export const PROJECT_SECTION_ACTIONS: Partial<Record<ProjectSection, ProjectAction>> = {
  "expert-agents": "run_ai_analysis",
  collaboration: "manage_collaboration",
};

/** Mutating API endpoints → required action */
export const API_ACTION_GUARDS: Record<string, ProjectAction> = {
  "POST /api/projects": "edit_profile",
  "POST /api/projects/ai-create": "edit_profile",
  "POST /api/projects/ai-create/stream": "edit_profile",
  "POST /api/projects/*/strategies/generate": "create_strategy",
  "POST /api/projects/*/strategies": "create_strategy",
  "POST /api/projects/*/strategies/iterate": "create_strategy",
  "POST /api/projects/*/documents": "upload_documents",
  "POST /api/projects/*/documents/*/analyze": "run_ai_analysis",
  "POST /api/projects/*/bim-models": "upload_documents",
  "POST /api/projects/*/bim-models/*/annotations": "manage_collaboration",
  "POST /api/projects/*/issues": "manage_issues",
  "PATCH /api/projects/*/issues/*": "manage_issues",
  "POST /api/projects/*/reports/generate": "publish_report",
  "POST /api/projects/*/diagnosis/generate": "run_ai_analysis",
  "POST /api/projects/*/diagnosis": "run_ai_analysis",
  "POST /api/projects/*/survey/analyze": "run_ai_analysis",
  "POST /api/projects/*/knowledge-graph": "run_ai_analysis",
  "POST /api/projects/*/collaboration/reviews/*": "manage_collaboration",
  "POST /api/knowledge/material-prices": "manage_members",
  "PATCH /api/knowledge/material-prices/*": "manage_members",
  "DELETE /api/knowledge/material-prices/*": "manage_members",
  "POST /api/knowledge/material-prices/reset": "manage_members",
  "POST /api/knowledge/sync": "manage_members",
};

export function canAccessAppRoute(role: UserRole, pathname: string): boolean {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";

  const exact = APP_ROUTE_ACTIONS[normalized];
  if (exact) return canPerformAction(role, exact);

  if (normalized.startsWith("/projects/") && normalized !== "/projects/new") {
    return canPerformAction(role, "view");
  }

  if (normalized.startsWith("/knowledge/")) {
    return canPerformAction(role, "view");
  }

  return canPerformAction(role, "view");
}

export function canAccessProjectSection(
  role: UserRole,
  section: ProjectSection
): boolean {
  const required = PROJECT_SECTION_ACTIONS[section];
  if (!required) return canPerformAction(role, "view");
  return canPerformAction(role, required);
}

export function getVisibleAppRoutes(role: UserRole): string[] {
  return Object.entries(APP_ROUTE_ACTIONS)
    .filter(([, action]) => canPerformAction(role, action))
    .map(([route]) => route);
}

export function getVisibleProjectSections(role: UserRole): ProjectSection[] {
  const allSections: ProjectSection[] = [
    "overview",
    "building-memory",
    "survey-intelligence",
    "bim-viewer",
    "diagnosis",
    "expert-agents",
    "strategy-lab",
    "collaboration",
    "cost-risk",
    "issues",
    "reports",
  ];
  return allSections.filter((s) => canAccessProjectSection(role, s));
}

export function resolveApiAction(
  method: string,
  pathname: string
): ProjectAction | null {
  const key = `${method.toUpperCase()} ${pathname}`;
  if (API_ACTION_GUARDS[key]) return API_ACTION_GUARDS[key];

  for (const [pattern, action] of Object.entries(API_ACTION_GUARDS)) {
    const [patMethod, patPath] = pattern.split(" ");
    if (patMethod !== method.toUpperCase()) continue;
    const regex = new RegExp(
      "^" + patPath.replace(/\*/g, "[^/]+") + "$"
    );
    if (regex.test(pathname)) return action;
  }
  return null;
}
