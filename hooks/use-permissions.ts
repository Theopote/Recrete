"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import {
  canPerformAction,
  getRolePermissions,
  type ProjectAction,
} from "@/lib/auth/permissions";
import {
  canAccessAppRoute,
  canAccessProjectSection,
  getVisibleAppRoutes,
  getVisibleProjectSections,
} from "@/lib/auth/rbac";
import type { ProjectSection, UserRole } from "@/types";

export function usePermissions() {
  const { data: session, status } = useSession();
  const role = (session?.user?.role as UserRole) ?? "viewer";

  return useMemo(
    () => ({
      role,
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated",
      permissions: getRolePermissions(role),
      can: (action: ProjectAction) => canPerformAction(role, action),
      canAccessRoute: (pathname: string) => canAccessAppRoute(role, pathname),
      canAccessSection: (section: ProjectSection) =>
        canAccessProjectSection(role, section),
      visibleRoutes: getVisibleAppRoutes(role),
      visibleSections: getVisibleProjectSections(role),
    }),
    [role, status]
  );
}
